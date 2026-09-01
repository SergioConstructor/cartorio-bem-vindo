// Validação e saneamento dos PDFs enviados pelo cliente.
//
// A extensão e o Content-Type vêm do navegador e são forjáveis, então o que
// vale é o conteúdo: todo arquivo precisa começar com a assinatura "%PDF-".

/** Limite de corpo de requisição da Vercel é 4,5 MB — ficamos abaixo dele. */
export const MAX_BYTES_ARQUIVO = 4 * 1024 * 1024;
export const MAX_ARQUIVOS = 10;
export const MAX_BYTES_TOTAL = 20 * 1024 * 1024;

export type ResultadoValidacao = { ok: true } | { ok: false; motivo: string };

const ASSINATURA_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

/** Confere a assinatura real do arquivo — um .exe renomeado para .pdf é recusado. */
export function pareceRealmentePdf(bytes: Uint8Array): boolean {
  if (bytes.length < ASSINATURA_PDF.length) return false;
  return ASSINATURA_PDF.every((byte, i) => bytes[i] === byte);
}

export function validarPdf(bytes: Uint8Array, tamanhoDeclarado?: number): ResultadoValidacao {
  if (bytes.length === 0) {
    return { ok: false, motivo: "O arquivo está vazio." };
  }
  if (bytes.length > MAX_BYTES_ARQUIVO) {
    return { ok: false, motivo: "Cada arquivo pode ter no máximo 4 MB." };
  }
  // Divergência entre o tamanho anunciado e o recebido indica adulteração no
  // meio do caminho — recusamos em vez de adivinhar.
  if (tamanhoDeclarado !== undefined && tamanhoDeclarado !== bytes.length) {
    return { ok: false, motivo: "O arquivo chegou incompleto. Tente enviar novamente." };
  }
  if (!pareceRealmentePdf(bytes)) {
    return { ok: false, motivo: "Só aceitamos arquivos PDF." };
  }
  return { ok: true };
}

/**
 * Nome seguro para o anexo: sem caminho, sem caracteres de controle, sem
 * unicode exótico e com extensão .pdf garantida.
 */
export function sanearNomeArquivo(nome: string, indice: number): string {
  const semCaminho = nome.split(/[\\/]/).pop() ?? "";
  // A extensao sai primeiro: assim um nome que se resume a ela (ou que fica
  // vazio apos a limpeza) cai no nome de reserva em vez de virar "pdf.pdf".
  const semExtensao = semCaminho.replace(/\.pdf$/i, "");
  // Lista de permissao: so letras, numeros, hifen, sublinhado, ponto e espaco.
  // Isso ja descarta caracteres de controle, separadores de caminho e emojis.
  const limpo = semExtensao
    .replace(/[^\p{L}\p{N}\-_. ]/gu, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 60)
    .trim();

  return limpo ? `${limpo}.pdf` : `documento-${indice + 1}.pdf`;
}
