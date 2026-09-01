// Cliente HTTP do Trello, compartilhado pelo acompanhamento (leitura) e pelo
// protocolo online (escrita e anexos).
//
// Cuida do que toda chamada precisa: credenciais só no servidor, tempo limite,
// e uma retentativa educada quando o Trello responde 429 (limite de taxa).

import { getServerConfig } from "./config.server";

const TRELLO_BASE = "https://api.trello.com/1";
const FETCH_TIMEOUT_MS = 8000;
const UPLOAD_TIMEOUT_MS = 25_000;

function credenciais() {
  const { trelloApiKey, trelloApiToken } = getServerConfig();
  return { key: trelloApiKey ?? "", token: trelloApiToken ?? "" };
}

async function comRetentativa(
  executar: () => Promise<Response>,
  descricao: string,
): Promise<Response> {
  let resposta = await executar();

  // Limite de taxa do Trello: uma única retentativa. A cota é por janela de 10
  // segundos, então esperar 1–2 s cairia na MESMA janela já saturada — daí o
  // piso de 10 s (respeitando um Retry-After maior, se vier).
  if (resposta.status === 429) {
    const retryAfter = Number(resposta.headers.get("retry-after"));
    const esperaMs = Math.min(
      Math.max(Number.isFinite(retryAfter) ? retryAfter * 1000 : 0, 10_000),
      20_000,
    );
    await new Promise((resolve) => setTimeout(resolve, esperaMs));
    resposta = await executar();
  }

  if (!resposta.ok) {
    throw new Error(`Trello ${descricao} falhou: ${resposta.status} ${resposta.statusText}`);
  }
  return resposta;
}

export async function trelloGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const busca = new URLSearchParams({ ...params, ...credenciais() });
  const resposta = await comRetentativa(
    () =>
      fetch(`${TRELLO_BASE}${path}?${busca.toString()}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
    path,
  );
  return (await resposta.json()) as T;
}

/** POST/PUT com os parâmetros na query string, como a API do Trello espera. */
export async function trelloWrite<T>(
  path: string,
  params: Record<string, string>,
  metodo: "POST" | "PUT" = "POST",
): Promise<T> {
  const busca = new URLSearchParams({ ...params, ...credenciais() });
  const resposta = await comRetentativa(
    () =>
      fetch(`${TRELLO_BASE}${path}?${busca.toString()}`, {
        method: metodo,
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
    path,
  );
  return (await resposta.json()) as T;
}

/**
 * POST/PUT com corpo JSON. Alguns endpoints do Trello — notadamente o de
 * valores de campo personalizado — exigem o valor aninhado num corpo JSON e
 * ignoram parâmetros de query.
 */
export async function trelloWriteJson<T>(
  path: string,
  corpo: unknown,
  metodo: "POST" | "PUT" = "PUT",
): Promise<T> {
  const busca = new URLSearchParams(credenciais());
  const resposta = await comRetentativa(
    () =>
      fetch(`${TRELLO_BASE}${path}?${busca.toString()}`, {
        method: metodo,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      }),
    path,
  );
  return (await resposta.json()) as T;
}

/** Envia um arquivo como anexo do cartão. Prazo maior: o upload é o gargalo. */
export async function trelloAnexar<T>(
  cardId: string,
  arquivo: { nome: string; bytes: Uint8Array; tipo: string },
): Promise<T> {
  const busca = new URLSearchParams(credenciais());
  const corpo = new FormData();
  corpo.append(
    "file",
    new Blob([arquivo.bytes as unknown as BlobPart], { type: arquivo.tipo }),
    arquivo.nome,
  );
  corpo.append("name", arquivo.nome);

  const resposta = await comRetentativa(
    () =>
      fetch(`${TRELLO_BASE}/cards/${cardId}/attachments?${busca.toString()}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: corpo,
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      }),
    "anexo",
  );
  return (await resposta.json()) as T;
}

/** Compara nomes do Trello ignorando acentos, maiúsculas e pontuação. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Quadros do fluxo do cartório: o nome começa com dois dígitos ("00. …"). */
export const QUADRO_FLUXO_RE = /^\s*\d{2}\b/;
