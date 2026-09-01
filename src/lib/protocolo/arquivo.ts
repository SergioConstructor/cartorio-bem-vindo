// Validação e saneamento dos documentos enviados pelo cliente.
//
// A extensão e o Content-Type vêm do navegador e são forjáveis, então o que
// vale é o conteúdo: o arquivo precisa começar com a assinatura de um dos
// formatos aceitos.
//
// Aceitamos PDF e fotos (JPG/PNG): a maior parte dos clientes fotografa RG,
// matrícula e certidões pelo celular e não tem como gerar PDF.

/** Limite de corpo de requisição da Vercel é 4,5 MB — ficamos abaixo dele. */
export const MAX_BYTES_ARQUIVO = 4 * 1024 * 1024;
export const MAX_ARQUIVOS = 10;
export const MAX_BYTES_TOTAL = 20 * 1024 * 1024;

export type TipoArquivo = { extensao: "pdf" | "jpg" | "png"; mime: string };

export type ResultadoValidacao = { ok: true; tipo: TipoArquivo } | { ok: false; motivo: string };

// Assinaturas de arquivo (magic bytes). Um .exe renomeado para .pdf falha aqui.
const ASSINATURAS: { bytes: number[]; tipo: TipoArquivo }[] = [
  { bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], tipo: { extensao: "pdf", mime: "application/pdf" } }, // %PDF-
  { bytes: [0xff, 0xd8, 0xff], tipo: { extensao: "jpg", mime: "image/jpeg" } },
  {
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    tipo: { extensao: "png", mime: "image/png" },
  },
];

/** Identifica o formato pelo conteúdo; null se não for um dos aceitos. */
export function detectarTipo(bytes: Uint8Array): TipoArquivo | null {
  for (const { bytes: assinatura, tipo } of ASSINATURAS) {
    if (bytes.length < assinatura.length) continue;
    if (assinatura.every((byte, i) => bytes[i] === byte)) return tipo;
  }
  return null;
}

/** Mantido por clareza nos testes e no cliente: o arquivo é de um tipo aceito? */
export function tipoAceito(bytes: Uint8Array): boolean {
  return detectarTipo(bytes) !== null;
}

export function validarArquivo(bytes: Uint8Array, tamanhoDeclarado?: number): ResultadoValidacao {
  if (bytes.length === 0) {
    return { ok: false, motivo: "O arquivo está vazio." };
  }
  if (bytes.length > MAX_BYTES_ARQUIVO) {
    return { ok: false, motivo: "Cada arquivo pode ter no máximo 4 MB." };
  }
  // Divergência entre o tamanho anunciado pelo navegador e o recebido indica
  // que o arquivo chegou truncado — recusamos em vez de guardar pela metade.
  if (tamanhoDeclarado !== undefined && tamanhoDeclarado !== bytes.length) {
    return { ok: false, motivo: "O arquivo chegou incompleto. Tente enviar novamente." };
  }

  const tipo = detectarTipo(bytes);
  if (!tipo) {
    return { ok: false, motivo: "Aceitamos apenas PDF, JPG ou PNG." };
  }
  return { ok: true, tipo };
}

/**
 * Nome seguro para o anexo: sem caminho, sem caracteres de controle, sem
 * unicode exótico e com a extensão do formato realmente detectado.
 */
export function sanearNomeArquivo(nome: string, indice: number, extensao = "pdf"): string {
  const semCaminho = nome.split(/[\\/]/).pop() ?? "";
  // A extensão sai primeiro: assim um nome que se resume a ela (ou que fica
  // vazio após a limpeza) cai no nome de reserva em vez de virar "pdf.pdf".
  const semExtensao = semCaminho.replace(/\.(pdf|jpe?g|png)$/i, "");
  // Lista de permissão: só letras, números, hífen, sublinhado, ponto e espaço.
  // Isso já descarta caracteres de controle, separadores de caminho e emojis.
  const limpo = semExtensao
    .replace(/[^\p{L}\p{N}\-_. ]/gu, "")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 60)
    .trim();

  return limpo ? `${limpo}.${extensao}` : `documento-${indice + 1}.${extensao}`;
}
