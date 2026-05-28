import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SectionHeading } from "@/components/site/SectionHeading";
import { services } from "@/content/services";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — CN2O Cartório de Notas de Itabaiana" },
      {
        name: "description",
        content:
          "Escrituras, procurações, reconhecimento de firma, autenticações, testamentos e atas notariais no 2º Ofício de Itabaiana/SE.",
      },
      { property: "og:title", content: "Serviços — CN2O Cartório de Notas" },
      { property: "og:description", content: "Atos notariais com fé pública em Itabaiana/SE." },
      { property: "og:url", content: "/servicos" },
    ],
    links: [{ rel: "canonical", href: "/servicos" }],
  }),
  component: ServicosPage,
});

function ServicosPage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="container-tight py-20">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Serviços
          </div>
          <h1 className="mt-4 font-display text-4xl text-primary-foreground md:text-5xl">
            Atos notariais com fé pública
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Conheça em detalhes os serviços que prestamos. Para cada ato, listamos os
            documentos normalmente exigidos — em caso de dúvida, entre em contato antes
            de comparecer ao cartório.
          </p>
        </div>
      </section>

      <section className="container-tight py-20">
        <div className="space-y-16">
          {services.map((s, i) => (
            <article
              key={s.slug}
              id={s.slug}
              className="grid scroll-mt-24 gap-8 border-t border-border pt-12 md:grid-cols-[1fr_1.4fr]"
            >
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {String(i + 1).padStart(2, "0")} · {s.short.split(".")[0]}
                </div>
                <h2 className="mt-3 font-display text-3xl">{s.title}</h2>
              </div>
              <div>
                <p className="text-base leading-relaxed text-foreground/80">{s.description}</p>
                <div className="mt-6">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary/70">
                    Documentos geralmente exigidos
                  </div>
                  <ul className="space-y-2">
                    {s.documents.map((d) => (
                      <li key={d} className="flex gap-3 text-sm text-foreground/80">
                        <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-20 border border-border bg-accent/30 p-10 text-center">
          <SectionHeading
            align="center"
            title="Não encontrou o que procurava?"
            description="Nossa equipe ajuda você a identificar o ato adequado e prepara um checklist personalizado."
          />
          <a
            href="https://wa.me/5579999440969"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-soft"
          >
            Falar com o cartório
          </a>
        </div>
      </section>
    </>
  );
}
