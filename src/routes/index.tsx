import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Clock, MapPin, Phone } from "lucide-react";
import logo from "@/assets/cn2o-logo-vinho.jpg";
import { SectionHeading } from "@/components/site/SectionHeading";
import { services } from "@/content/services";
import { posts } from "@/content/posts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cartório de Notas — 2º Ofício de Itabaiana/SE" },
      {
        name: "description",
        content:
          "Escrituras, procurações, reconhecimento de firma, autenticações e testamentos no 2º Ofício de Notas de Itabaiana/SE. Tradição que se moderniza para servir você.",
      },
      { property: "og:title", content: "Cartório de Notas — 2º Ofício de Itabaiana/SE" },
      {
        property: "og:description",
        content: "Tradição e modernidade a serviço dos cidadãos de Itabaiana e região.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const featured = services.slice(0, 6);
  const latest = posts.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="topo-lines absolute inset-0 text-primary-foreground/10" aria-hidden />
        <div className="container-tight relative grid gap-12 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div>
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
              <span className="h-px w-10 bg-primary-foreground/40" />
              2º Ofício · Itabaiana / Sergipe
            </div>
            <h1 className="font-display text-4xl leading-[1.05] text-primary-foreground md:text-6xl">
              Tradição que se moderniza para servir você.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              O Cartório de Notas — 2º Ofício de Itabaiana presta serviços notariais
              com fé pública, agilidade e atendimento humano. Aqui, sua segurança
              jurídica está em primeiro lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/servicos"
                className="inline-flex items-center gap-2 rounded-sm bg-primary-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-primary-foreground/90"
              >
                Conheça nossos serviços <ArrowRight size={16} />
              </Link>
              <Link
                to="/contato"
                className="inline-flex items-center gap-2 rounded-sm border border-primary-foreground/40 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-foreground/10"
              >
                Fale com o cartório
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="aspect-square w-full max-w-sm border border-primary-foreground/20 p-8">
              <img src={logo} alt="Logo CN2O" className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="border-b border-border bg-background">
        <div className="container-tight grid gap-8 py-12 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Fé pública", text: "Atos com plena segurança jurídica e validade nacional." },
            { icon: Clock, title: "Atendimento ágil", text: "Processos modernizados para resolver com rapidez." },
            { icon: MapPin, title: "No coração de Itabaiana", text: "Avenida Ivo de Carvalho, 441 — Centro." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <Icon size={28} className="shrink-0 text-primary" />
              <div>
                <div className="font-display text-lg">{title}</div>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="container-tight py-24">
        <SectionHeading
          eyebrow="Serviços"
          title="O que fazemos por você"
          description="Reunimos em um só lugar os principais atos notariais necessários para a vida civil, patrimonial e empresarial."
        />
        <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <Link
              key={s.slug}
              to="/servicos"
              hash={s.slug}
              className="group flex flex-col gap-3 bg-background p-8 transition-colors hover:bg-accent"
            >
              <div className="font-display text-xl text-secondary">{s.title}</div>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.short}</p>
              <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Saiba mais <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* SOBRE TEASER */}
      <section className="bg-accent/40">
        <div className="container-tight grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div>
            <SectionHeading
              eyebrow="Sobre o cartório"
              title="Uma instituição moderna que honra suas raízes"
              description="O símbolo CN2O é formado pelas iniciais do nome em extenso. Sua tipografia carrega as inclinações da topografia serrana de Itabaiana, e a letra 'O', em forma de barra de atualização, simboliza o novo momento do cartório — marcado por modernização e melhoria contínua."
            />
            <Link
              to="/sobre"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary hover:text-primary-soft"
            >
              Conheça nossa história <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] border-2 border-primary/20 bg-background p-6">
              <div className="flex h-full flex-col justify-between">
                <div className="font-display text-2xl leading-tight text-secondary">
                  "Servir com seriedade é honrar a confiança de cada cidadão que cruza nossa porta."
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    César Bravo
                  </div>
                  <div className="text-sm text-muted-foreground">Tabelião — 2º Ofício de Itabaiana</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="container-tight py-24">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Publicações"
            title="Do nosso blog"
            description="Orientações práticas e esclarecimentos sobre os atos mais procurados no cartório."
          />
          <Link
            to="/blog"
            className="hidden shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary hover:text-primary-soft md:inline-flex"
          >
            Ver todas <ArrowRight size={16} />
          </Link>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {latest.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col gap-3 border-t-2 border-primary pt-5 transition-colors hover:border-primary-soft"
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="text-primary">{p.category}</span>
                <span>·</span>
                <span>{p.readingTime}</span>
              </div>
              <h3 className="font-display text-xl leading-snug group-hover:text-primary">
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
              <span className="mt-auto pt-3 text-xs font-semibold uppercase tracking-wider text-primary">
                Ler artigo →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CONTATO RÁPIDO */}
      <section className="bg-secondary text-secondary-foreground">
        <div className="container-tight grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-secondary-foreground/60">
              <span className="h-px w-10 bg-secondary-foreground/30" />
              Estamos prontos para atender
            </div>
            <h2 className="!text-secondary-foreground font-display text-3xl md:text-4xl">
              Tire suas dúvidas ou agende seu atendimento.
            </h2>
            <p className="mt-4 max-w-xl text-secondary-foreground/70">
              Atendemos de segunda a sexta, das 08h às 16h, na Avenida Ivo de Carvalho, 441,
              Centro de Itabaiana/SE. Você também pode falar conosco pelos canais abaixo.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-soft"
            >
              <Phone size={16} /> WhatsApp (79) 99976-0702
            </a>
            <Link
              to="/contato"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-secondary-foreground/30 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground hover:bg-secondary-foreground/5"
            >
              Ver localização e contatos
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
