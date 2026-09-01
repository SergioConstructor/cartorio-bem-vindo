import { Check } from "lucide-react";

// Trilho do dossiê: a lista de documentos que o caso concreto exige, montada
// ao vivo conforme o cliente responde a triagem. O cliente marca o que já tem
// em mãos — isso vira a lista de pendências no cartão do cartório.

export function DossieRail({
  titulo,
  itens,
  emMaos,
  onAlternar,
}: {
  titulo: string;
  itens: string[];
  emMaos: Set<string>;
  onAlternar: (item: string) => void;
}) {
  const marcados = itens.filter((item) => emMaos.has(item)).length;

  return (
    <div className="rounded-lg border-t-4 border-primary bg-secondary p-5 text-secondary-foreground">
      <h3 className="font-display text-[11px] uppercase tracking-[0.16em] text-secondary-foreground/65">
        Documentos deste caso
      </h3>
      {titulo && <p className="mt-1 font-display text-[13px] break-words">{titulo}</p>}
      <div className="mb-4" />

      {itens.length === 0 ? (
        <p className="text-sm text-secondary-foreground/70">
          Escolha o tipo de ato para montar a lista.
        </p>
      ) : (
        <ul>
          {itens.map((item) => {
            const marcado = emMaos.has(item);
            return (
              <li key={item} className="border-b border-white/10 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onAlternar(item)}
                  aria-pressed={marcado}
                  className="flex w-full items-start gap-2.5 py-2 text-left text-[13.5px] transition-colors"
                >
                  <span
                    className={`mt-0.5 flex size-[17px] flex-none items-center justify-center rounded-[4px] border ${
                      marcado
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-white/45"
                    }`}
                  >
                    {marcado && <Check size={11} strokeWidth={3} aria-hidden />}
                  </span>
                  <span className={marcado ? "" : "text-secondary-foreground/70"}>{item}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {itens.length > 0 && (
        <p className="mt-3.5 text-xs tracking-wider text-secondary-foreground/65">
          {marcados} de {itens.length} documentos já em mãos
        </p>
      )}
    </div>
  );
}
