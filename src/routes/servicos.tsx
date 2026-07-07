import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { serviceIcons } from "@/components/site/serviceIcons";
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
      <PageHero
        eyebrow="Serviços"
        title="Atos notariais com fé pública"
        description="Conheça em detalhes os serviços que prestamos. Para cada ato, listamos os documentos normalmente exigidos — em caso de dúvida, entre em contato antes de comparecer ao cartório."
      >
        {/* Navegação rápida por âncoras */}
        <nav aria-label="Ir para um serviço" className="mt-8 flex flex-wrap gap-2">
          {services.map((s) => {
            const Icon = serviceIcons[s.slug];
            return (
              <a
                key={s.slug}
                href={`#${s.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground/85 transition-colors hover:border-gold hover:text-gold"
              >
                {Icon && <Icon size={13} aria-hidden />}
                {s.title}
              </a>
            );
          })}
        </nav>
      </PageHero>

      <section className="container-tight py-20">
        <div className="space-y-16">
          {services.map((s, i) => {
            const Icon = serviceIcons[s.slug];
            return (
              <article
                key={s.slug}
                id={s.slug}
                className="grid scroll-mt-28 gap-8 border-t border-border pt-12 md:grid-cols-[1fr_1.4fr]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    {Icon && (
                      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-gold-soft text-primary">
                        <Icon size={24} aria-hidden />
                      </div>
                    )}
                    <span className="font-display text-3xl text-gold/60" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-3xl">{s.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{s.short}</p>
                </div>
                <div>
                  <p className="text-base leading-relaxed text-foreground/80">{s.description}</p>
                  <div className="mt-6 border border-border bg-card p-6">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary/70">
                      Documentos geralmente exigidos
                    </div>
                    <ul className="space-y-2">
                      {s.documents.map((d) => (
                        <li key={d} className="flex gap-3 text-sm text-foreground/80">
                          <Check size={16} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="navy-gradient relative mt-20 overflow-hidden p-10 text-center text-secondary-foreground md:p-14">
          <div className="topo-lines absolute inset-0 text-secondary-foreground/10" aria-hidden />
          <div className="relative">
            <div className="[&_h2]:!text-secondary-foreground [&_p]:text-secondary-foreground/70">
              <SectionHeading
                align="center"
                title="Não encontrou o que procurava?"
                description="Nossa equipe ajuda você a identificar o ato adequado e prepara um checklist personalizado."
              />
            </div>
            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-gold/90"
            >
              <MessageCircle size={15} aria-hidden />
              Falar com o cartório
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
