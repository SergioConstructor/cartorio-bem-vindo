// Regras puras do protocolo online: quais perguntas aparecem, quais documentos
// o caso concreto exige e como o código de solicitação é gerado.
// Sem I/O e sem dependência de React — é aqui que moram os testes.

import { dossieBase, type AtoId } from "../../content/protocolo/atos";
import { perguntasDoAto, type Pergunta } from "../../content/protocolo/triagem";

/** Resposta de uma pergunta: texto (opção/data) ou lista (pergunta múltipla). */
export type Respostas = Record<string, string | string[] | undefined>;

/** Uma pergunta condicional só aparece quando a pergunta-mãe tem a resposta esperada. */
export function visivel(pergunta: Pergunta, respostas: Respostas): boolean {
  if (!pergunta.dependeDe) return true;
  const [idMae, esperado] = pergunta.dependeDe;
  const atual = respostas[idMae];
  if (typeof atual !== "string") return false;
  return Array.isArray(esperado) ? esperado.includes(atual) : atual === esperado;
}

/** Perguntas atualmente visíveis, na ordem do questionário. */
export function perguntasVisiveis(ato: AtoId, respostas: Respostas): Pergunta[] {
  return perguntasDoAto(ato).filter((pergunta) => visivel(pergunta, respostas));
}

/**
 * Dossiê do caso concreto: documentos sempre exigidos pelo ato + os que as
 * respostas visíveis acrescentam. Sem repetições, preservando a ordem.
 * Respostas de perguntas que deixaram de estar visíveis são ignoradas.
 */
export function itensDossie(ato: AtoId, respostas: Respostas): string[] {
  const itens = [...dossieBase(ato)];

  for (const pergunta of perguntasDoAto(ato)) {
    if (!visivel(pergunta, respostas) || !pergunta.ops) continue;
    const resposta = respostas[pergunta.id];
    if (!resposta) continue;

    const escolhidas = Array.isArray(resposta) ? resposta : [resposta];
    for (const escolhida of escolhidas) {
      const opcao = pergunta.ops.find((o) => o.v === escolhida);
      for (const documento of opcao?.inj ?? []) {
        if (!itens.includes(documento)) itens.push(documento);
      }
    }
  }

  return itens;
}

/** Avisos jurídicos das respostas atualmente escolhidas, para exibir ao cliente. */
export function avisosAtivos(
  ato: AtoId,
  respostas: Respostas,
): { pergunta: string; aviso: string }[] {
  const avisos: { pergunta: string; aviso: string }[] = [];

  for (const pergunta of perguntasDoAto(ato)) {
    if (!visivel(pergunta, respostas) || !pergunta.ops) continue;
    const resposta = respostas[pergunta.id];
    if (!resposta) continue;

    const escolhidas = Array.isArray(resposta) ? resposta : [resposta];
    for (const escolhida of escolhidas) {
      const opcao = pergunta.ops.find((o) => o.v === escolhida);
      if (opcao?.aviso) avisos.push({ pergunta: pergunta.titulo, aviso: opcao.aviso });
    }
  }

  return avisos;
}

// Alfabeto de Crockford sem os caracteres que se confundem ao ditar por
// telefone (I, L, O, U) — o cliente vai repetir esse código para a atendente.
const ALFABETO = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TAMANHO_CODIGO = 6;

export const CODIGO_RE = /^S-[0-9A-HJKMNP-TV-Z]{6}$/;

/**
 * Código de solicitação aleatório (32 alternativas ^ 6 ≈ 1 bilhão). Aleatório —
 * e não sequencial — para que ninguém consiga varrer as solicitações alheias
 * em /acompanhar.
 */
export function gerarCodigo(): string {
  const bytes = new Uint8Array(TAMANHO_CODIGO);
  crypto.getRandomValues(bytes);
  let codigo = "";
  for (const byte of bytes) codigo += ALFABETO[byte % ALFABETO.length];
  return `S-${codigo}`;
}

/** Aceita "s-xk4m2p" ou "S-XK4M2P"; devolve null se não for um código válido. */
export function normalizarCodigo(entrada: string): string | null {
  const candidato = entrada.trim().toUpperCase().replace(/\s+/g, "");
  const comPrefixo = candidato.startsWith("S-") ? candidato : `S-${candidato}`;
  return CODIGO_RE.test(comPrefixo) ? comPrefixo : null;
}

/**
 * Nome do cartão no Trello. O código vai entre colchetes, então NÃO há dígitos
 * logo após ") -" — é isso que impede o extrator de protocolo de /acompanhar
 * de confundir uma solicitação do site com um número oficial.
 */
export function tituloCartao(ato: AtoId, codigo: string, nomeParte: string): string {
  const nome = nomeParte.trim().toUpperCase();
  return `Prot. (${ato}) - [${codigo}]${nome ? ` ${nome}` : ""}`;
}
