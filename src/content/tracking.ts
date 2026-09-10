// Acompanhamento da escritura — mapeamento do fluxo real do cartório no Trello.
//
// O andamento é a LISTA (coluna) em que o cartão está. Levantamento feito nos
// nove quadros da conta em 10/09/2026; o cartão de um protocolo passa por até
// três quadros:
//
//   00. Protocolo/Cadastro   Pré-protocolo (Site) → Triagem → Protocolo/Entrada
//                            → Em Digitalização → Cadastro Extradigital
//                            → Em Conferência … e, no fim, as listas "Arquivo…"
//                            (Arquivo Geral, Arquivado ✔, Arquivamento • …).
//                            Também abriga "Escrituras Sem Efeito".
//   01. TABELIÃO             🤖 Gerar Minuta → Aguarda Auditoria → Conferir
//                            Minuta → MESA TABELIÃO; e as listas de espera
//                            AGUARDA e PENDÊNCIAS. (As listas "⚙ …" são
//                            cadastros de parceiros, não protocolos.)
//   02. ESCREVENTE …         (um por escrevente, mesmas colunas) Revisar Minuta
//                            → Conferência de Minuta → Ajuste/Retorno → Agendar
//                            Assinatura → Aguardando Assinatura → Finalizado →
//                            Arquivar. Alguns têm PENDÊNCIAS e Enotariado/Onr.
//
// Colunas de mesmo significado em quadros diferentes contam como a MESMA etapa
// ("Conferir Minuta" no tabelião e "Conferência de Minuta" na escrevente).
// A comparação ignora acentos, maiúsculas, emoji e pontuação; um nome
// terminado em "*" casa por prefixo ("Arquiv*" pega todas as listas de
// arquivo). Lista que não bate com etapa nenhuma NÃO some do acompanhamento:
// vira "em andamento" (ver classificarLista).
//
// Para mudar o fluxo sem mexer no código, defina TRELLO_STAGE_LISTS na Vercel:
//   etapas separadas por vírgula; dentro de cada etapa, nomes alternativos
//   separados por "|" — o primeiro é o rótulo exibido. Ex.:
//   TRELLO_STAGE_LISTS=Triagem, Elaboração da minuta | Revisar Minuta, Finalizado | Arquiv*

export type Stage = {
  /** rótulo exibido na linha do tempo */
  label: string;
  /** nomes das listas do Trello que correspondem a esta etapa ("Nome*" = prefixo) */
  lists: string[];
};

export const defaultStages: Stage[] = [
  { label: "Triagem", lists: ["Triagem"] },
  { label: "Protocolo/Entrada", lists: ["Protocolo/Entrada"] },
  { label: "Digitalização", lists: ["Em Digitalização"] },
  { label: "Cadastro extradigital", lists: ["Cadastro Extradigital"] },
  { label: "Conferência do cadastro", lists: ["Em Conferência"] },
  // A minuta nasce no quadro do tabelião ("🤖 Gerar Minuta") e vai para a
  // escrevente revisar. "A Fazer (Minuta)" é o nome antigo dessa coluna.
  {
    label: "Elaboração da minuta",
    lists: ["Gerar Minuta", "Revisar Minuta", "A Fazer (Minuta)"],
  },
  {
    label: "Conferência da minuta",
    lists: ["Conferir Minuta", "Conferência de Minuta", "Aguarda Auditoria"],
  },
  { label: "Análise do tabelião", lists: ["Mesa Tabelião"] },
  { label: "Ajustes/retorno", lists: ["Ajuste/Retorno", "Ajustes/Retorno"] },
  { label: "Agendamento da assinatura", lists: ["Agendar Assinatura"] },
  // "Enotariado/Onr": assinatura eletrônica pela plataforma e-Notariado.
  { label: "Aguardando assinatura", lists: ["Aguardando Assinatura", "Enotariado*"] },
  // Depois de finalizada, a escritura passa por várias listas de arquivo
  // (Arquivar, Arquivo Geral, Arquivado ✔, Arquivamento • revisar …) — para o
  // cliente, tudo isso é "finalizado".
  { label: "Finalizado", lists: ["Finalizado", "Concluído", "Arquiv*"] },
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

/** Compara nomes do Trello ignorando acentos, maiúsculas, emoji e pontuação. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Classificação da lista
// ---------------------------------------------------------------------------

/**
 * O que a lista em que o cartão está significa para o cliente.
 *
 * - "etapa": uma das etapas da linha do tempo (índice em `stages`).
 * - "pre_protocolo": envio do site ainda não conferido pelo cartório.
 * - "pendencia": o processo está parado esperando algo (documento, resposta).
 *   No Trello são as listas "PENDÊNCIAS" e "AGUARDA".
 * - "sem_efeito": protocolo encerrado sem lavrar a escritura.
 * - "desconhecida": lista de um quadro do fluxo que não bate com nada acima.
 *   O cartão EXISTE e está em andamento — só não sabemos dizer a etapa. Antes
 *   isso virava "não encontrado", que era o pior dos mundos para o cliente.
 */
export type Classificacao =
  | { tipo: "etapa"; indice: number }
  | { tipo: "pre_protocolo" }
  | { tipo: "pendencia" }
  | { tipo: "sem_efeito" }
  | { tipo: "desconhecida" };

function casaComLista(padrao: string, lista: string): boolean {
  if (padrao.endsWith("*")) {
    return lista.startsWith(normalizarNome(padrao.slice(0, -1)));
  }
  return lista === normalizarNome(padrao);
}

export function classificarLista(stages: Stage[], nomeLista: string): Classificacao {
  const lista = normalizarNome(nomeLista);

  if (lista.startsWith("pre protocolo")) return { tipo: "pre_protocolo" };
  if (lista.includes("sem efeito")) return { tipo: "sem_efeito" };
  // "AGUARDA" sozinha é espera; "Aguarda Auditoria" é etapa de conferência,
  // por isso a comparação exata.
  if (lista.startsWith("pendenc") || lista === "aguarda") return { tipo: "pendencia" };

  const indice = stages.findIndex((stage) =>
    stage.lists.some((padrao) => casaComLista(padrao, lista)),
  );
  return indice >= 0 ? { tipo: "etapa", indice } : { tipo: "desconhecida" };
}

/**
 * Quando mais de um cartão tem o mesmo número, o que está EM ANDAMENTO vale
 * mais que um arquivado ou sem efeito (uma cópia esquecida no arquivo não pode
 * esconder o processo vivo). Menor = mais prioritário.
 */
export function prioridade(classificacao: Classificacao, stages: Stage[]): number {
  switch (classificacao.tipo) {
    case "etapa":
      return classificacao.indice === stages.length - 1 ? 3 : 0;
    case "pendencia":
      return 0;
    case "desconhecida":
      return 1;
    case "pre_protocolo":
      return 2;
    case "sem_efeito":
      return 4;
  }
}

// ---------------------------------------------------------------------------
// Responsável pelo cartão, deduzido do quadro
// ---------------------------------------------------------------------------

// Quando o cartão está no quadro de uma escrevente ("02. ESCREVENTE LARA"),
// mostramos o nome dela: assim o cliente sabe por quem perguntar no balcão ou
// no WhatsApp. No quadro "01. TABELIÃO", o processo está com o tabelião.

export type Responsavel = { tipo: "escrevente"; nome: string } | { tipo: "tabeliao" };

/** Grafia oficial dos nomes — o quadro do Trello vem sem acento e em CAIXA ALTA. */
const ESCREVENTES = ["Josilene", "Camily", "Romênia", "Lara", "Jonas"] as const;

function semAcento(valor: string): string {
  return valor.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

function capitalizar(nome: string): string {
  return nome
    .toLocaleLowerCase("pt-BR")
    .replace(
      /(^|\s)(\p{L})/gu,
      (_, espaco: string, letra: string) => espaco + letra.toLocaleUpperCase("pt-BR"),
    );
}

/**
 * Extrai o nome da escrevente do nome do quadro; null se o quadro não for de
 * uma escrevente (ex.: "00. Protocolo/Cadastro").
 *
 * Prefere a grafia da lista acima — o quadro "02. ESCREVENTE ROMENIA" vira
 * "Romênia", com o acento certo. Um nome novo, ainda não listado, aparece
 * capitalizado ("SUZANA" → "Suzana"), então criar um quadro não exige deploy.
 */
export function escreventeDoQuadro(nomeQuadro: string): string | null {
  const match = /escrevente\s+(.+)$/i.exec(nomeQuadro);
  const bruto = match?.[1].trim();
  if (!bruto) return null;

  const conhecida = ESCREVENTES.find((nome) => semAcento(nome) === semAcento(bruto));
  return conhecida ?? capitalizar(bruto);
}

export function responsavelDoQuadro(nomeQuadro: string): Responsavel | null {
  const escrevente = escreventeDoQuadro(nomeQuadro);
  if (escrevente) return { tipo: "escrevente", nome: escrevente };
  if (/tabeli/i.test(semAcento(nomeQuadro))) return { tipo: "tabeliao" };
  return null;
}
