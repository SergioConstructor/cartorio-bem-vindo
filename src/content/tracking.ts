// Acompanhamento da escritura — mapeamento do fluxo real do cartório no Trello.
//
// O andamento acontece pelas LISTAS (colunas) em que o cartão está:
//   - Quadro "00. Protocolo/Cadastro": Triagem → Protocolo/Entrada →
//     Em Digitalização → Cadastro Extradigital → Em Conferência
//   - Quadros "02. ESCREVENTE …" (um por escrevente, todos com as mesmas
//     colunas): A Fazer (Minuta) → Conferência de Minuta → Ajuste/Retorno →
//     Agendar Assinatura → Aguardando Assinatura → Finalizado
//
// Colunas de mesmo nome em quadros diferentes contam como a MESMA etapa, então
// não importa qual escrevente está com o processo. Cada etapa abaixo tem um
// rótulo amigável (mostrado ao cliente) e os nomes das listas do Trello que
// correspondem a ela (a comparação ignora acentos, maiúsculas e pontuação).
//
// Para mudar o fluxo sem mexer no código, defina TRELLO_STAGE_LISTS na Vercel:
//   etapas separadas por vírgula; dentro de cada etapa, nomes alternativos
//   separados por "|" — o primeiro é o rótulo exibido. Ex.:
//   TRELLO_STAGE_LISTS=Triagem, Elaboração da minuta | A Fazer (Minuta), Finalizado

export type Stage = {
  /** rótulo exibido na linha do tempo */
  label: string;
  /** nomes das listas do Trello que correspondem a esta etapa */
  lists: string[];
};

export const defaultStages: Stage[] = [
  { label: "Triagem", lists: ["Triagem"] },
  { label: "Protocolo/Entrada", lists: ["Protocolo/Entrada"] },
  { label: "Digitalização", lists: ["Em Digitalização"] },
  { label: "Cadastro extradigital", lists: ["Cadastro Extradigital"] },
  { label: "Conferência do cadastro", lists: ["Em Conferência"] },
  { label: "Elaboração da minuta", lists: ["A Fazer (Minuta)", "Pendências"] },
  { label: "Conferência da minuta", lists: ["Conferência de Minuta"] },
  { label: "Ajustes/retorno", lists: ["Ajuste/Retorno", "Ajustes/Retorno"] },
  { label: "Agendamento da assinatura", lists: ["Agendar Assinatura"] },
  { label: "Aguardando assinatura", lists: ["Aguardando Assinatura"] },
  { label: "Finalizado", lists: ["Finalizado"] },
];

/**
 * Interpreta TRELLO_STAGE_LISTS ("Rótulo | lista alt, Rótulo 2, …").
 * Retorna null se a variável estiver vazia/ausente (usa defaultStages).
 */
export function parseStagesConfig(raw: string | undefined): Stage[] | null {
  const stages = (raw ?? "")
    .split(",")
    .map((entry) => {
      const names = entry
        .split("|")
        .map((name) => name.trim())
        .filter(Boolean);
      return names.length > 0 ? { label: names[0], lists: names } : null;
    })
    .filter((stage): stage is Stage => stage !== null);
  return stages.length > 0 ? stages : null;
}

/** Etapa exibida no modo demonstração (sem credenciais do Trello). */
export const demoStageIndex = 5;
