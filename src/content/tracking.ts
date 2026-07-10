// Acompanhamento da escritura ("andamento") — convenção dos quadros do Trello.
//
// As etapas NÃO ficam no código: o site descobre os quadros-etapa ao vivo no
// Trello. Basta o cartório nomear cada quadro com um número na frente, na
// ordem do fluxo:
//
//   01 · Protocolo recebido
//   02 · Análise de documentos
//   03 · Tributos e certidões
//   ...
//
// O número define a ORDEM e o texto vira o RÓTULO exibido ao cliente.
// Separadores aceitos: · . - – — : )  (ex.: "01 - Análise", "2) Minuta").
// Quadros sem número na frente são ignorados pelo acompanhamento.
//
// Cada escritura é um cartão com o número de protocolo no nome
// (ex.: "2025-00123 — Compra e venda"); mover o cartão entre quadros já
// atualiza o andamento no site. Nada disso exige mexer no código.

export type Stage = {
  /** rótulo exibido na linha do tempo (vem do nome do quadro) */
  label: string;
};

export type OrderedBoard = {
  boardId: string;
  order: number;
  label: string;
};

const STAGE_NAME_RE = /^\s*(\d+)\s*[·.\-–—:)]\s*(.+?)\s*$/u;

/** "01 · Protocolo recebido" → { order: 1, label: "Protocolo recebido" }; null se não seguir a convenção. */
export function parseStageBoardName(name: string): { order: number; label: string } | null {
  const match = STAGE_NAME_RE.exec(name);
  if (!match) return null;
  return { order: Number(match[1]), label: match[2] };
}

// Etapas de DEMONSTRAÇÃO: usadas apenas enquanto o Trello não está configurado
// (sem credenciais ou sem quadros seguindo a convenção), para pré-visualizar a
// página. Em produção os rótulos reais vêm dos nomes dos quadros.
export const demoStages: Stage[] = [
  { label: "Protocolo recebido" },
  { label: "Análise de documentos" },
  { label: "Tributos e certidões (ITBI)" },
  { label: "Minuta em elaboração" },
  { label: "Aguardando assinaturas" },
  { label: "Escritura lavrada" },
  { label: "Concluída — pronta para retirada" },
];

export const demoStageIndex = 3;
