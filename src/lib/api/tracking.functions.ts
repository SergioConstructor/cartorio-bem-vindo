import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { QUADRO_FLUXO_RE, trelloGet } from "../trello.server";
import {
  classificarLista,
  defaultStages,
  parseStagesConfig,
  prioridade,
  responsavelDoQuadro,
  type Classificacao,
  type Responsavel,
  type Stage,
} from "../../content/tracking";
import { normalizarCodigo } from "../protocolo/dossie";

// Consulta o andamento de uma escritura pelo número de protocolo.
//
// Os cartões seguem o padrão "Prot. (Tipo) -NÚMERO" (ex.: "Prot. (CV-Urbano)
// -0988"), e a etapa é a LISTA (coluna) em que o cartão está — colunas de
// mesmo significado nos quadros do tabelião e das escreventes contam como a
// mesma etapa. O fluxo padrão está em src/content/tracking.ts e pode ser
// sobrescrito pela variável TRELLO_STAGE_LISTS, sem mexer no código.
//
// Só participam do acompanhamento os quadros do fluxo, que no cartório são
// nomeados com prefixo numérico ("00. Protocolo/Cadastro", "01. TABELIÃO",
// "02. ESCREVENTE…"). Cartões de outros quadros nunca são expostos.
//
// Privacidade (LGPD): retornamos APENAS a situação do processo (etapa,
// pendência…), a data da última atividade e o responsável (escrevente ou
// tabelião) — nunca o nome do cartão, descrição, partes ou qualquer conteúdo.

export type TrackingResult =
  | {
      status: "ok";
      currentStageIndex: number;
      stages: { label: string }[];
      updatedAt: string | null;
      responsavel: Responsavel | null;
    }
  // O cartão está num quadro do fluxo, mas numa lista que não corresponde a
  // nenhuma etapa conhecida. Existe e anda — só não sabemos dizer onde.
  | { status: "em_andamento"; updatedAt: string | null; responsavel: Responsavel | null }
  // Parado aguardando algo (documento, resposta, providência).
  | { status: "pendencia"; updatedAt: string | null; responsavel: Responsavel | null }
  // Protocolo encerrado sem lavrar a escritura.
  | { status: "sem_efeito"; updatedAt: string | null }
  // Solicitação feita pelo site, ainda na fila de conferência do cartório.
  | { status: "pre_protocolo"; updatedAt: string | null }
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

function getStages(): Stage[] {
  const { trelloStageLists } = getServerConfig();
  return parseStagesConfig(trelloStageLists) ?? defaultStages;
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

type Avaliacao = {
  card: TrelloCard;
  classificacao: Classificacao;
  responsavel: Responsavel | null;
};

/**
 * Descobre em que quadro/lista o cartão está e o que isso significa.
 * Devolve null se o cartão está fora dos quadros do fluxo (nunca exposto).
 */
async function avaliarCartao(card: TrelloCard, stages: Stage[]): Promise<Avaliacao | null> {
  // card_board/card_list normalmente já vêm na busca; busca-os se faltarem.
  const board =
    card.board ??
    (await trelloGet<{ id: string; name: string }>(`/cards/${card.id}/board`, { fields: "name" }));
  if (!QUADRO_FLUXO_RE.test(board.name)) return null;

  const list =
    card.list ??
    (await trelloGet<{ id: string; name: string }>(`/cards/${card.id}/list`, { fields: "name" }));

  const classificacao = classificarLista(stages, list.name);
  if (classificacao.tipo === "desconhecida") {
    // Fica no log da Vercel para o cartório saber que criou/renomeou uma
    // coluna que o site ainda não conhece (basta ajustar TRELLO_STAGE_LISTS).
    console.warn(`[acompanhar] lista sem etapa mapeada: "${list.name}" (quadro "${board.name}")`);
  }

  return { card, classificacao, responsavel: responsavelDoQuadro(board.name) };
}

function resultadoDe(
  { card, classificacao, responsavel }: Avaliacao,
  stages: Stage[],
): TrackingResult {
  const updatedAt = card.dateLastActivity ?? null;
  switch (classificacao.tipo) {
    case "etapa":
      return {
        status: "ok",
        currentStageIndex: classificacao.indice,
        stages: stages.map(({ label }) => ({ label })),
        updatedAt,
        responsavel,
      };
    case "pendencia":
      return { status: "pendencia", updatedAt, responsavel };
    case "sem_efeito":
      return { status: "sem_efeito", updatedAt };
    case "pre_protocolo":
      return { status: "pre_protocolo", updatedAt };
    case "desconhecida":
      return { status: "em_andamento", updatedAt, responsavel };
  }
}

/**
 * Entre vários cartões com o mesmo número, fica o que está em andamento; um
 * arquivado ou sem efeito só vale se não houver outro. Empate no topo é
 * ambiguidade de verdade — não escolhemos por palpite.
 */
function escolher(avaliacoes: Avaliacao[], stages: Stage[]): Avaliacao | "ambiguo" | null {
  if (avaliacoes.length === 0) return null;
  const melhor = Math.min(...avaliacoes.map((a) => prioridade(a.classificacao, stages)));
  const candidatos = avaliacoes.filter((a) => prioridade(a.classificacao, stages) === melhor);
  return candidatos.length === 1 ? candidatos[0] : "ambiguo";
}

/**
 * Consulta uma solicitação criada pelo site. O código aparece entre colchetes
 * no nome do cartão ("Prot. (CV-Urbano) - [S-XK4M2P] JOÃO"). Enquanto o
 * cartório não confere, o cartão está na lista de entrada; assim que a
 * escrevente move e numera, a consulta por número passa a valer.
 */
async function consultarPorCodigo(codigo: string, stages: Stage[]): Promise<TrackingResult> {
  const { cards = [] } = await trelloGet<{ cards?: TrelloCard[] }>("/search", {
    query: codigo,
    modelTypes: "cards",
    card_fields: "name,dateLastActivity",
    card_list: "true",
    card_board: "true",
    cards_limit: "50",
    partial: "false",
  });

  const alvo = `[${codigo}]`;
  const encontrados = cards.filter((card) => card.name.toUpperCase().includes(alvo));
  if (encontrados.length === 0) return { status: "nao_encontrado" };
  if (encontrados.length > 1) return { status: "ambiguo" };

  const avaliacao = await avaliarCartao(encontrados[0], stages);
  return avaliacao ? resultadoDe(avaliacao, stages) : { status: "nao_encontrado" };
}

async function consultarPorNumero(target: string, stages: Stage[]): Promise<TrackingResult> {
  // A busca textual do Trello não sabe que "988" e "0988" são o mesmo
  // número; buscamos as variantes e juntamos tudo antes de escolher.
  const queries = [...new Set([target, target.padStart(4, "0")])];

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

  const avaliacoes: Avaliacao[] = [];
  for (const card of selectMatches([...byId.values()], target)) {
    const avaliacao = await avaliarCartao(card, stages);
    if (avaliacao) avaliacoes.push(avaliacao);
  }

  const escolhido = escolher(avaliacoes, stages);
  if (escolhido === null) return { status: "nao_encontrado" };
  if (escolhido === "ambiguo") return { status: "ambiguo" };
  return resultadoDe(escolhido, stages);
}

export const getEscrituraStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      // Número oficial (só dígitos, com tolerância a zeros à esquerda) ou o
      // código de solicitação que o site emite ("S-XK4M2P").
      protocolo: z
        .string()
        .trim()
        .regex(
          /^(\d{1,10}|[Ss]-?[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{6})$/u,
          "Informe o número do protocolo ou o código recebido no site.",
        ),
    }),
  )
  .handler(async ({ data }): Promise<TrackingResult> => {
    const { trelloApiKey, trelloApiToken } = getServerConfig();

    // Sem credenciais → a página cai em modo demonstração.
    if (!trelloApiKey || !trelloApiToken) {
      return { status: "config_pendente" };
    }

    const stages = getStages();
    const codigo = normalizarCodigo(data.protocolo);
    // Parece código do site mas não passou na normalização (letra fora do
    // alfabeto, por exemplo): não faz sentido cair na busca numérica e gastar
    // uma consulta ao Trello com um alvo impossível.
    if (!codigo && /^[Ss]-?[^0-9]/.test(data.protocolo)) {
      return { status: "nao_encontrado" };
    }
    const target = codigo ?? stripLeadingZeros(data.protocolo);

    const cached = cachedResult(target);
    if (cached) return cached;

    if (overRateLimit()) {
      return { status: "erro" };
    }

    try {
      const resultado = codigo
        ? await consultarPorCodigo(codigo, stages)
        : await consultarPorNumero(target, stages);
      cacheResult(target, resultado);
      return resultado;
    } catch (erro) {
      console.error("Erro ao consultar o Trello:", erro);
      return { status: "erro" };
    }
  });
