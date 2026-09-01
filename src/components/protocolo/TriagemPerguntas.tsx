import { AlertTriangle } from "lucide-react";

import type { Pergunta } from "@/content/protocolo/triagem";
import type { Respostas } from "@/lib/protocolo/dossie";

// Renderiza as perguntas visíveis da triagem. Toda pergunta é opcional: quem
// responde é o cliente, e "não sei" é uma resposta legítima — o cartório
// confere tudo no atendimento.

export function TriagemPerguntas({
  perguntas,
  respostas,
  onResponder,
}: {
  perguntas: Pergunta[];
  respostas: Respostas;
  onResponder: (id: string, valor: string | string[] | undefined) => void;
}) {
  return (
    <div className="space-y-6">
      {perguntas.map((pergunta) => {
        const resposta = respostas[pergunta.id];
        const condicional = Boolean(pergunta.dependeDe);

        return (
          <fieldset
            key={pergunta.id}
            className={condicional ? "border-l-[3px] border-border pl-3.5" : undefined}
          >
            <legend className="text-[13px] font-bold text-secondary">{pergunta.titulo}</legend>
            {pergunta.ajuda && (
              <p className="mt-1 text-xs text-muted-foreground">{pergunta.ajuda}</p>
            )}

            {pergunta.tipo === "data" ? (
              <input
                type="date"
                value={typeof resposta === "string" ? resposta : ""}
                onChange={(e) => onResponder(pergunta.id, e.target.value || undefined)}
                className="mt-2 max-w-56 rounded-sm border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {(pergunta.ops ?? []).map((opcao) => {
                  const marcado = pergunta.multi
                    ? Array.isArray(resposta) && resposta.includes(opcao.v)
                    : resposta === opcao.v;

                  return (
                    <button
                      key={opcao.v}
                      type="button"
                      aria-pressed={marcado}
                      onClick={() => {
                        if (pergunta.multi) {
                          const atual = Array.isArray(resposta) ? resposta : [];
                          // "Nenhuma" é exclusiva: escolher limpa as demais.
                          if (opcao.v === "Nenhuma") {
                            onResponder(pergunta.id, marcado ? undefined : ["Nenhuma"]);
                            return;
                          }
                          const semNenhuma = atual.filter((v) => v !== "Nenhuma");
                          const novo = semNenhuma.includes(opcao.v)
                            ? semNenhuma.filter((v) => v !== opcao.v)
                            : [...semNenhuma, opcao.v];
                          onResponder(pergunta.id, novo.length ? novo : undefined);
                        } else {
                          // Clicar de novo na mesma opção desmarca.
                          onResponder(pergunta.id, marcado ? undefined : opcao.v);
                        }
                      }}
                      className={`rounded-sm border px-3 py-2 text-left text-[13.5px] transition-colors ${
                        marcado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-card hover:border-primary"
                      }`}
                    >
                      {opcao.v}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Aviso jurídico da opção escolhida */}
            {!pergunta.multi &&
              typeof resposta === "string" &&
              (() => {
                const aviso = pergunta.ops?.find((o) => o.v === resposta)?.aviso;
                if (!aviso) return null;
                return (
                  <p className="mt-2.5 flex gap-2 rounded-r-sm border-l-[3px] border-primary bg-accent/60 px-3 py-2 text-[12.5px] text-secondary">
                    <AlertTriangle
                      size={14}
                      className="mt-0.5 flex-none text-primary"
                      aria-hidden
                    />
                    <span>{aviso}</span>
                  </p>
                );
              })()}
          </fieldset>
        );
      })}
    </div>
  );
}
