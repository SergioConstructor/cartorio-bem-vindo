import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { parseStageBoardName, type OrderedBoard, type Stage } from "../../content/tracking";

// Consulta o andamento de uma escritura pelo número de protocolo.
//
// Tudo é auto-alimentado pelo Trello, sem configuração no código:
//   1) As ETAPAS são descobertas listando os quadros da conta (ou do workspace,
//      se TRELLO_ORGANIZATION_ID estiver definido) e mantendo apenas os que
//      seguem a convenção de nome "NN · Rótulo" — ver src/content/tracking.ts.
//   2) O CARTÃO da escritura é achado pela busca global (/1/search) usando o
//      protocolo que aparece no nome do cartão, em qualquer quadro.
//   3) O quadro atual do cartão determina a etapa exibida.
//
// Privacidade (LGPD): retornamos APENAS os rótulos das etapas (nomes dos
// quadros), o índice da etapa atual e a data da última atividade — nunca o
// nome do cartão, descrição, partes ou qualquer conteúdo do Trello.

export type TrackingResult =
  | { status: "ok"; currentStageIndex: number; stages: Stage[]; updatedAt: string | null }
  | { status: "nao_encontrado" }
  | { status: "ambiguo" }
  | { status: "config_pendente" }
  | { status: "erro" };

type TrelloBoard = { id: string; name: string };

type TrelloCard = {
  id: string;
  name: string;
  idBoard: string;
  dateLastActivity?: string | null;
};

const TRELLO_BASE = "https://api.trello.com/1";

// Cache em memória dos quadros-etapa, para não listar os boards a cada
// consulta pública (rate-limit do Trello). Reinicia a cada cold start.
const STAGE_BOARDS_TTL_MS = 5 * 60 * 1000;
let stageBoardsCache: { boards: OrderedBoard[]; expiresAt: number } | null = null;

async function trelloGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const { trelloApiKey, trelloApiToken } = getServerConfig();
  const search = new URLSearchParams({
    ...params,
    key: trelloApiKey ?? "",
    token: trelloApiToken ?? "",
  });
  const response = await fetch(`${TRELLO_BASE}${path}?${search.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Trello ${path} falhou: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}

// Compara nomes de quadros com tolerância: ignora acentos, maiúsculas e
// espaços extras ("Em Análise " casa com "em analise").
function normalizeBoardName(name: string): string {
  return name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Descobre os quadros-etapa. Duas formas, nesta ordem:
//   1) TRELLO_STAGE_BOARDS definida: nomes dos quadros separados por vírgula,
//      na ordem do fluxo — usa os nomes atuais do Trello, sem renomear nada.
//   2) Convenção "NN · Rótulo" no nome dos quadros (número define a ordem).
async function getStageBoards(): Promise<OrderedBoard[]> {
  if (stageBoardsCache && stageBoardsCache.expiresAt > Date.now()) {
    return stageBoardsCache.boards;
  }

  const { trelloOrganizationId, trelloStageBoards } = getServerConfig();
  const path = trelloOrganizationId
    ? `/organizations/${trelloOrganizationId}/boards`
    : "/members/me/boards";

  const boards = await trelloGet<TrelloBoard[]>(path, { fields: "name", filter: "open" });

  let stageBoards: OrderedBoard[];

  const configuredNames = (trelloStageBoards ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  if (configuredNames.length > 0) {
    const byName = new Map(boards.map((board) => [normalizeBoardName(board.name), board]));
    stageBoards = configuredNames.flatMap((name, i) => {
      const board = byName.get(normalizeBoardName(name));
      if (!board) {
        console.error(`TRELLO_STAGE_BOARDS: quadro "${name}" não encontrado no Trello`);
        return [];
      }
      return [{ boardId: board.id, order: i, label: board.name }];
    });
  } else {
    stageBoards = boards
      .flatMap((board) => {
        const parsed = parseStageBoardName(board.name);
        return parsed ? [{ boardId: board.id, order: parsed.order, label: parsed.label }] : [];
      })
      .sort((a, b) => a.order - b.order);
  }

  stageBoardsCache = { boards: stageBoards, expiresAt: Date.now() + STAGE_BOARDS_TTL_MS };
  return stageBoards;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// A busca do Trello é "fuzzy"; confirmamos que o protocolo aparece como token
// exato no nome do cartão (evita casar "123" com "1234"). Consideramos limites
// de palavra qualquer caractere que não seja letra/número. Para tokens só de
// dígitos, zeros à esquerda são ignorados — o cartório usa nomes como
// "Prot. (CV-Urbano) -0988", e o cliente pode digitar "0988" ou "988".
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    return a.replace(/^0+(?=\d)/, "") === b.replace(/^0+(?=\d)/, "");
  }
  return false;
}

function nameMatchesProtocol(cardName: string, protocolo: string): boolean {
  const target = normalize(protocolo);
  return normalize(cardName)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
    .some((token) => tokensMatch(token, target));
}

export const getEscrituraStatus = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      // Protocolo: letras, números, traços, barras e pontos. Curto o bastante
      // para não virar consulta arbitrária, longo o bastante para ser útil.
      protocolo: z
        .string()
        .trim()
        .min(3, "Informe um número de protocolo válido.")
        .max(40)
        .regex(/^[\p{L}\p{N}\-/.]+$/u, "O protocolo contém caracteres inválidos."),
    }),
  )
  .handler(async ({ data }): Promise<TrackingResult> => {
    const { trelloApiKey, trelloApiToken } = getServerConfig();

    // Sem credenciais → a página cai em modo demonstração.
    if (!trelloApiKey || !trelloApiToken) {
      return { status: "config_pendente" };
    }

    const protocolo = data.protocolo.trim();

    try {
      const stageBoards = await getStageBoards();

      // Nenhum quadro segue a convenção "NN · Rótulo" ainda → fluxo não montado
      // no Trello; mostrar a demonstração em vez de quebrar.
      if (stageBoards.length === 0) {
        return { status: "config_pendente" };
      }

      const boardIndex = new Map(stageBoards.map((board, i) => [board.boardId, i]));

      // A busca textual do Trello não sabe que "988" e "0988" são o mesmo
      // número; para protocolos numéricos tentamos as variantes com e sem
      // zeros à esquerda até achar o cartão (ex.: "Prot. (CV-Urbano) -0988").
      const queries = [protocolo];
      if (/^\d+$/.test(protocolo)) {
        const stripped = protocolo.replace(/^0+(?=\d)/, "");
        for (const variant of [stripped, stripped.padStart(4, "0")]) {
          if (!queries.includes(variant)) queries.push(variant);
        }
      }

      // Mantém só cartões cujo nome contém o protocolo exato e cujo quadro é
      // uma etapa do fluxo público.
      let matches: { card: TrelloCard; stageIndex: number }[] = [];
      for (const query of queries) {
        const { cards = [] } = await trelloGet<{ cards?: TrelloCard[] }>("/search", {
          query,
          modelTypes: "cards",
          card_fields: "name,idBoard,dateLastActivity",
          cards_limit: "10",
          partial: "false",
        });

        matches = cards
          .filter((card) => nameMatchesProtocol(card.name, protocolo))
          .flatMap((card) => {
            const stageIndex = boardIndex.get(card.idBoard);
            return stageIndex === undefined ? [] : [{ card, stageIndex }];
          });
        if (matches.length > 0) break;
      }

      if (matches.length === 0) {
        return { status: "nao_encontrado" };
      }
      if (matches.length > 1) {
        return { status: "ambiguo" };
      }

      const { card, stageIndex } = matches[0];
      return {
        status: "ok",
        currentStageIndex: stageIndex,
        stages: stageBoards.map(({ label }) => ({ label })),
        updatedAt: card.dateLastActivity ?? null,
      };
    } catch (error) {
      console.error("Erro ao consultar o Trello:", error);
      return { status: "erro" };
    }
  });
