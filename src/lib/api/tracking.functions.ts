import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { defaultStages, parseStagesConfig, type Stage } from "../../content/tracking";

// Consulta o andamento de uma escritura pelo número de protocolo.
//
// Os cartões seguem o padrão "Prot. (Tipo) -NÚMERO" (ex.: "Prot. (CV-Urbano)
// -0988"), e a etapa é a LISTA (coluna) em que o cartão está — as colunas de
// mesmo nome nos quadros das escreventes contam como a mesma etapa. O fluxo
// padrão está em src/content/tracking.ts e pode ser sobrescrito pela variável
// TRELLO_STAGE_LISTS, sem mexer no código.
//
// Só participam do acompanhamento os quadros do fluxo, que no cartório são
// nomeados com prefixo numérico ("00. Protocolo/Cadastro", "02. ESCREVENTE…").
// Cartões de outros quadros da conta (financeiro, interno) nunca são expostos.
//
// Privacidade (LGPD): retornamos APENAS os rótulos das etapas, o índice da
// etapa atual e a data da última atividade — nunca o nome do cartão,
// descrição, partes ou qualquer conteúdo do Trello.

export type TrackingResult =
  | {
      status: "ok";
      currentStageIndex: number;
      stages: { label: string }[];
      updatedAt: string | null;
    }
  | { status: "nao_encontrado" }
  | { status: "ambiguo" }
  | { status: "config_pendente" }
  | { status: "erro" };

type TrelloCard = {
  id: string;
  name: string;
  dateLastActivity?: string | null;
  list?: { id: string; name: string } | null;
  board?: { id: string; name: string } | null;
};

const TRELLO_BASE = "https://api.trello.com/1";
const FETCH_TIMEOUT_MS = 8000;

// Quadros do fluxo público: nome começa com dois dígitos ("00. …", "02. …").
const FLOW_BOARD_RE = /^\s*\d{2}\b/;

// Proteções da consulta pública (por instância do servidor): limita quantas
// consultas chegam ao Trello por janela e reaproveita resultados recentes,
// para não estourar a cota da API (~100 req/10s por token) nem permitir
// varreduras rápidas de protocolos.
const RATE_WINDOW_MS = 10_000;
const RATE_MAX_LOOKUPS = 20;
let rateWindowStart = 0;
let rateLookups = 0;

function overRateLimit(): boolean {
  const now = Date.now();
  if (now - rateWindowStart > RATE_WINDOW_MS) {
    rateWindowStart = now;
    rateLookups = 0;
  }
  rateLookups += 1;
  return rateLookups > RATE_MAX_LOOKUPS;
}

const RESULT_TTL_MS = 60_000;
const resultCache = new Map<string, { result: TrackingResult; expiresAt: number }>();

function cachedResult(key: string): TrackingResult | null {
  const entry = resultCache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.result;
  resultCache.delete(key);
  return null;
}

function cacheResult(key: string, result: TrackingResult): void {
  if (resultCache.size > 1000) resultCache.clear();
  resultCache.set(key, { result, expiresAt: Date.now() + RESULT_TTL_MS });
}

async function trelloGet<T>(path: string, params: Record<string, string>, attempt = 0): Promise<T> {
  const { trelloApiKey, trelloApiToken } = getServerConfig();
  const search = new URLSearchParams({
    ...params,
    key: trelloApiKey ?? "",
    token: trelloApiToken ?? "",
  });
  const response = await fetch(`${TRELLO_BASE}${path}?${search.toString()}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  // Rate limit do Trello: uma única retentativa respeitando o Retry-After.
  if (response.status === 429 && attempt === 0) {
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Math.min(Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000, 2000);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return trelloGet(path, params, 1);
  }
  if (!response.ok) {
    throw new Error(`Trello ${path} falhou: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

// Compara nomes de listas com tolerância: ignora acentos, maiúsculas e
// pontuação ("A Fazer (Minuta)" casa com "a fazer minuta").
function normalizeListName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getStages(): Stage[] {
  const { trelloStageLists } = getServerConfig();
  return parseStagesConfig(trelloStageLists) ?? defaultStages;
}

/** Índice da etapa correspondente à lista do Trello; -1 se não mapeada. */
function stageIndexByList(stages: Stage[], listName: string): number {
  const target = normalizeListName(listName);
  return stages.findIndex((stage) =>
    stage.lists.some((name) => normalizeListName(name) === target),
  );
}

function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+(?=\d)/, "");
}

// Protocolo "oficial" do cartão: o número logo após o ") -" do padrão
// "Prot. (Tipo) -0988". Isso evita confundir com outros números do nome,
// como "Extra 1375" ou "Minut 2487". Retorna null se o nome não tem o padrão.
function protocolFromCardName(cardName: string): string | null {
  const match = /\)\s*[-–—]\s*0*(\d+)/u.exec(cardName);
  return match ? match[1] : null;
}

// Fallback para nomes fora do padrão: o protocolo como token exato do nome
// ("Prot. 0872 ao 881" → tokens 0872/881), com zeros à esquerda ignorados.
function nameHasProtocolToken(cardName: string, target: string): boolean {
  return cardName
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => /^\d+$/.test(token))
    .some((token) => stripLeadingZeros(token) === target);
}

/**
 * Seleciona os cartões que correspondem ao protocolo dentro da UNIÃO dos
 * resultados de todas as variantes de busca: preferimos sempre o padrão
 * ") -NÚMERO"; só se nenhum cartão da união seguir o padrão vale o token
 * avulso (assim um cartão de faixa "Prot. 0872 ao 881" nunca disputa com o
 * cartão exato "-0881", mesmo que apareçam em buscas de variantes diferentes).
 */
export function selectMatches(cards: TrelloCard[], target: string): TrelloCard[] {
  const primary = cards.filter((card) => {
    const protocol = protocolFromCardName(card.name);
    return protocol !== null && stripLeadingZeros(protocol) === target;
  });
  if (primary.length > 0) return primary;
  return cards.filter(
    (card) => protocolFromCardName(card.name) === null && nameHasProtocolToken(card.name, target),
  );
}

export const getEscrituraStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      // Só dígitos (o protocolo do cartório é numérico e único), com
      // tolerância a zeros à esquerda; curto o bastante para não virar
      // consulta arbitrária.
      protocolo: z
        .string()
        .trim()
        .regex(/^\d{1,10}$/u, "Informe apenas os números do protocolo."),
    }),
  )
  .handler(async ({ data }): Promise<TrackingResult> => {
    const { trelloApiKey, trelloApiToken } = getServerConfig();

    // Sem credenciais → a página cai em modo demonstração.
    if (!trelloApiKey || !trelloApiToken) {
      return { status: "config_pendente" };
    }

    const stages = getStages();
    const target = stripLeadingZeros(data.protocolo);

    const cached = cachedResult(target);
    if (cached) return cached;

    if (overRateLimit()) {
      return { status: "erro" };
    }

    // A busca textual do Trello não sabe que "988" e "0988" são o mesmo
    // número; buscamos as variantes e juntamos tudo antes de escolher.
    const queries = [...new Set([target, target.padStart(4, "0")])];

    try {
      const byId = new Map<string, TrelloCard>();
      for (const query of queries) {
        const { cards = [] } = await trelloGet<{ cards?: TrelloCard[] }>("/search", {
          query,
          modelTypes: "cards",
          card_fields: "name,dateLastActivity",
          card_list: "true",
          card_board: "true",
          cards_limit: "250",
          partial: "false",
        });
        for (const card of cards) byId.set(card.id, card);
      }

      const matched = selectMatches([...byId.values()], target);

      // Cartão precisa estar num quadro do fluxo E numa lista mapeada como
      // etapa — cartões de quadros internos nunca são expostos.
      const inStages = [];
      for (const card of matched) {
        // card_board/card_list normalmente já vêm na busca; busca-os se faltarem.
        const board =
          card.board ??
          (await trelloGet<{ id: string; name: string }>(`/cards/${card.id}/board`, {
            fields: "name",
          }));
        if (!FLOW_BOARD_RE.test(board.name)) continue;

        const list =
          card.list ??
          (await trelloGet<{ id: string; name: string }>(`/cards/${card.id}/list`, {
            fields: "name",
          }));
        const stageIndex = stageIndexByList(stages, list.name);
        if (stageIndex >= 0) inStages.push({ card, stageIndex });
      }

      let result: TrackingResult;
      if (inStages.length === 0) {
        result = { status: "nao_encontrado" };
      } else if (inStages.length > 1) {
        result = { status: "ambiguo" };
      } else {
        result = {
          status: "ok",
          currentStageIndex: inStages[0].stageIndex,
          stages: stages.map(({ label }) => ({ label })),
          updatedAt: inStages[0].card.dateLastActivity ?? null,
        };
      }
      cacheResult(target, result);
      return result;
    } catch (error) {
      console.error("Erro ao consultar o Trello:", error);
      return { status: "erro" };
    }
  });
