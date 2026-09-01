// Autorização de anexo, sem estado no servidor.
//
// O cliente NUNCA recebe o id do cartão do Trello — recebe um token assinado
// que carrega o cartão, o prazo e o número máximo de arquivos. Assim ninguém
// pode anexar em cartão alheio, nem continuar anexando depois do prazo.
//
// Formato: base64url(payload JSON) + "." + base64url(HMAC-SHA256)

export type ConteudoToken = {
  /** id do cartão criado no Trello */
  c: string;
  /** validade (epoch em segundos) */
  exp: number;
  /** número máximo de arquivos autorizados */
  n: number;
};

export const VALIDADE_TOKEN_S = 15 * 60;

function paraBase64Url(bytes: Uint8Array): string {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(texto: string): Uint8Array {
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

async function assinar(mensagem: string, segredo: string): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(mensagem));
  return new Uint8Array(assinatura);
}

/** Comparação em tempo constante — não vaza quantos bytes bateram. */
function iguaisEmTempoConstante(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a[i] ^ b[i];
  return diferenca === 0;
}

export async function criarUploadToken(
  cardId: string,
  maxArquivos: number,
  segredo: string,
  agoraMs: number = Date.now(),
): Promise<string> {
  const conteudo: ConteudoToken = {
    c: cardId,
    exp: Math.floor(agoraMs / 1000) + VALIDADE_TOKEN_S,
    n: maxArquivos,
  };
  const corpo = paraBase64Url(new TextEncoder().encode(JSON.stringify(conteudo)));
  const assinatura = paraBase64Url(await assinar(corpo, segredo));
  return `${corpo}.${assinatura}`;
}

/** Devolve o conteúdo do token ou null se for inválido, adulterado ou expirado. */
export async function lerUploadToken(
  token: string,
  segredo: string,
  agoraMs: number = Date.now(),
): Promise<ConteudoToken | null> {
  const partes = token.split(".");
  if (partes.length !== 2) return null;
  const [corpo, assinatura] = partes;

  try {
    const esperada = await assinar(corpo, segredo);
    if (!iguaisEmTempoConstante(deBase64Url(assinatura), esperada)) return null;

    const conteudo = JSON.parse(new TextDecoder().decode(deBase64Url(corpo))) as ConteudoToken;
    if (typeof conteudo.c !== "string" || !conteudo.c) return null;
    if (typeof conteudo.exp !== "number" || typeof conteudo.n !== "number") return null;
    if (conteudo.exp * 1000 < agoraMs) return null;
    return conteudo;
  } catch {
    return null;
  }
}
