import { useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";

import {
  MAX_ARQUIVOS,
  MAX_BYTES_ARQUIVO,
  MAX_BYTES_TOTAL,
  pareceRealmentePdf,
} from "@/lib/protocolo/arquivo";

// Seleção dos PDFs. A conferência definitiva é do servidor — aqui validamos
// só para dar erro imediato e não fazer o cliente esperar um envio que já
// sabemos que será recusado.

export type ArquivoSelecionado = { file: File; id: string };

function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function validarNoNavegador(
  file: File,
  jaSelecionados: ArquivoSelecionado[],
): Promise<string | null> {
  if (jaSelecionados.length >= MAX_ARQUIVOS) {
    return `Você pode enviar no máximo ${MAX_ARQUIVOS} arquivos.`;
  }
  if (file.size > MAX_BYTES_ARQUIVO) {
    return `"${file.name}" tem mais de 4 MB. Reduza o arquivo ou leve ao balcão.`;
  }
  const total = jaSelecionados.reduce((soma, a) => soma + a.file.size, 0) + file.size;
  if (total > MAX_BYTES_TOTAL) {
    return "O total de arquivos passou de 20 MB.";
  }
  const inicio = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (!pareceRealmentePdf(inicio)) {
    return `"${file.name}" não é um PDF.`;
  }
  return null;
}

export function UploadDocumentos({
  arquivos,
  onAdicionar,
  onRemover,
  desabilitado,
}: {
  arquivos: ArquivoSelecionado[];
  onAdicionar: (files: FileList) => void;
  onRemover: (id: string) => void;
  desabilitado?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="sr-only"
        disabled={desabilitado}
        onChange={(e) => {
          if (e.target.files?.length) onAdicionar(e.target.files);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={desabilitado || arquivos.length >= MAX_ARQUIVOS}
        className="flex w-full flex-col items-center gap-2 rounded-sm border-2 border-dashed border-input bg-card px-4 py-8 text-center transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload size={22} className="text-primary" aria-hidden />
        <span className="text-sm font-medium text-secondary">Escolher arquivos PDF (opcional)</span>
        <span className="text-xs text-muted-foreground">
          Até {MAX_ARQUIVOS} arquivos, 4 MB cada (20 MB no total). O que faltar você leva ao balcão.
        </span>
      </button>

      {arquivos.length > 0 && (
        <ul className="mt-3 space-y-2">
          {arquivos.map(({ file, id }) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-sm border border-border bg-card px-3 py-2"
            >
              <FileText size={16} className="flex-none text-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <span className="flex-none text-xs text-muted-foreground">
                {formatarTamanho(file.size)}
              </span>
              <button
                type="button"
                onClick={() => onRemover(id)}
                disabled={desabilitado}
                className="flex-none rounded-sm p-2 text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                aria-label={`Remover ${file.name}`}
              >
                <Trash2 size={15} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
