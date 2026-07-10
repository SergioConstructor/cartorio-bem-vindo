// Etapas do acompanhamento da escritura ("andamento").
//
// No Trello, o cartão de cada escritura MIGRA entre vários quadros conforme
// avança no processo. Cada quadro representa uma macro-etapa do fluxo. Este
// arquivo é a fonte única da verdade que mapeia, EM ORDEM, cada quadro do
// Trello para uma etapa amigável exibida ao cliente.
//
// Como preencher os boardId:
//   1. Gere API Key e Token do Trello (conta do cartório, permissão de leitura).
//   2. Liste os quadros e seus IDs:
//        https://api.trello.com/1/members/me/boards?fields=name&key=SUA_KEY&token=SEU_TOKEN
//   3. Substitua cada "PREENCHER_ID_N" abaixo pelo id do quadro correspondente,
//      na ordem em que o processo acontece.
//
// Enquanto os IDs não forem preenchidos (ou faltarem as credenciais), a página
// /acompanhar opera em MODO DEMONSTRAÇÃO — ver src/lib/api/tracking.functions.ts.

export type TrackingStage = {
  /** id do quadro (board) no Trello onde o cartão fica nesta etapa */
  boardId: string;
  /** rótulo curto exibido na linha do tempo */
  label: string;
  /** explicação amigável do que acontece nesta etapa */
  description: string;
};

export const trackingStages: TrackingStage[] = [
  {
    boardId: "PREENCHER_ID_1",
    label: "Protocolo recebido",
    description: "Seu pedido foi registrado e o protocolo aberto no cartório.",
  },
  {
    boardId: "PREENCHER_ID_2",
    label: "Análise de documentos",
    description: "Conferimos os documentos e certidões apresentados.",
  },
  {
    boardId: "PREENCHER_ID_3",
    label: "Tributos e certidões (ITBI)",
    description: "Emissão de certidões e conferência do recolhimento de tributos.",
  },
  {
    boardId: "PREENCHER_ID_4",
    label: "Minuta em elaboração",
    description: "O tabelião prepara a minuta da escritura para conferência das partes.",
  },
  {
    boardId: "PREENCHER_ID_5",
    label: "Aguardando assinaturas",
    description: "A escritura aguarda o comparecimento e a assinatura das partes.",
  },
  {
    boardId: "PREENCHER_ID_6",
    label: "Escritura lavrada",
    description: "A escritura foi lavrada e assinada, com fé pública.",
  },
  {
    boardId: "PREENCHER_ID_7",
    label: "Concluída — pronta para retirada",
    description: "Processo finalizado. A via da escritura está disponível para retirada.",
  },
];

export const totalStages = trackingStages.length;

/** Índice (0-based) da etapa correspondente ao quadro; -1 se o quadro não estiver mapeado. */
export function stageIndexByBoard(boardId: string): number {
  return trackingStages.findIndex((stage) => stage.boardId === boardId);
}

/** Etapa usada no modo demonstração, quando o Trello ainda não está configurado. */
export const demoStageIndex = 3;
