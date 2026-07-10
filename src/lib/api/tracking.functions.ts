import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { stageIndexByBoard, totalStages } from "../../content/tracking";

// Consulta o andamento ("andamento") de uma escritura pelo número de protocolo.
//
// O cartão da escritura migra entre vários quadros do Trello. Usamos a busca
// global do Trello (/1/search) para achar o cartão pelo protocolo em qualquer
// quadro e, a partir do quadro atual do cartão, resolvemos em que ETAPA do
// fluxo público ele está (ver src/content/tracking.ts).
//
// Privacidade (LGPD): retornamos APENAS o índice da etapa e a data da última
// atividade — nunca o nome do cartão, descrição, partes ou qualquer conteúdo
// do Trello.

export type TrackingResult =
  | { status: "ok"; currentStageIndex: number; totalStages: number; updatedAt: string | null }
  | { status: "nao_encontrado" }
  | { status: "ambiguo" }
  | { status: "config_pendente" }
  | { status: "erro" };

// Cartão retornado pela busca do Trello (só os campos que usamos).
type TrelloCard = {
  id: string;
  name: string;
  idBoard: string;
  dateLastActivity?: string | null;
};

const TRELLO_SEARCH_URL = "https://api.trello.com/1/search";

// Normaliza para comparar protocolo ignorando maiúsculas e espaços nas bordas.
function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// A busca do Trello é "fuzzy"; confirmamos que o protocolo aparece como token
// exato no nome do cartão (evita casar "123" com "1234"). Consideramos limites
// de palavra qualquer caractere que não seja letra/número.
function nameMatchesProtocol(cardName: string, protocolo: string): boolean {
  const target = normalize(protocolo);
  const tokens = normalize(cardName)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  return tokens.includes(target);
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

    const params = new URLSearchParams({
      query: protocolo,
      modelTypes: "cards",
      card_fields: "name,idBoard,dateLastActivity",
      cards_limit: "10",
      partial: "false",
      key: trelloApiKey,
      token: trelloApiToken,
    });

    let cards: TrelloCard[];
    try {
      const response = await fetch(`${TRELLO_SEARCH_URL}?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        console.error(`Trello search falhou: ${response.status} ${response.statusText}`);
        return { status: "erro" };
      }
      const body = (await response.json()) as { cards?: TrelloCard[] };
      cards = body.cards ?? [];
    } catch (error) {
      console.error("Erro ao consultar o Trello:", error);
      return { status: "erro" };
    }

    // Mantém só cartões cujo nome contém o protocolo exato e cujo quadro está
    // mapeado como uma etapa pública do fluxo.
    const matches = cards
      .filter((card) => nameMatchesProtocol(card.name, protocolo))
      .map((card) => ({ card, stageIndex: stageIndexByBoard(card.idBoard) }))
      .filter((entry) => entry.stageIndex >= 0);

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
      totalStages,
      updatedAt: card.dateLastActivity ?? null,
    };
  });
