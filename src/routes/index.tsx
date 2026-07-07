import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import logo from "@/assets/cn2o-logo-white.png";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PostCard } from "@/components/site/PostCard";
import { serviceIcons } from "@/components/site/serviceIcons";
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

const pillars = [
  {
    icon: ShieldCheck,
    title: "Fé pública",
    text: "Atos com plena segurança jurídica e validade nacional.",
  },
  {
    icon: Clock,
    title: "Atendimento ágil",
    text: "Processos modernizados para resolver com rapidez.",
  },
  {
    icon: MapPin,
    title: "No coração de Itabaiana",
    text: "Avenida Ivo de Carvalho, 441 — Centro.",
  },
];

function Home() {
  const featured = services.slice(0, 6);
  const latest = posts.slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="hero-gradient relative overflow-hidden text-primary-foreground">
        <div className="topo-lines absolute inset-0 text-primary-foreground/10" aria-hidden />
        <div className="container-tight relative grid gap-12 py-20 md:grid-cols-[1.2fr_1fr] md:py-28">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              <span className="h-px w-10 bg-gold/60" aria-hidden />
              2º Ofício · Itabaiana / Sergipe
            </div>
            <h1 className="font-display text-4xl leading-[1.05] !text-primary-foreground md:text-6xl">
              Tradição que se <em className="font-display italic text-gold">moderniza</em> para
              servir você.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              O Cartório de Notas — 2º Ofício de Itabaiana presta serviços notariais com fé pública,
              agilidade e atendimento humano. Aqui, sua segurança jurídica está em primeiro lugar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/servicos"
                className="inline-flex items-center gap-2 rounded-sm bg-primary-foreground px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary shadow-lg transition-colors hover:bg-primary-foreground/90"
              >
                Conheça nossos serviços <ArrowRight size={16} aria-hidden />
              </Link>
              <Link
                to="/contato"
                className="inline-flex items-center gap-2 rounded-sm border border-gold/50 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Fale com o cartório
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/70">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-gold" aria-hidden />
                Segunda a sexta · 08h às 16h
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-gold" aria-hidden />
                Av. Ivo de Carvalho, 441 — Centro
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative aspect-square w-full max-w-sm p-8">
              {/* Cantos dourados — moldura de selo */}
              <span
                className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-gold"
                aria-hidden
              />
              <span
                className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-gold"
                aria-hidden
              />
              <span
                className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-gold"
                aria-hidden
              />
              <span
                className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-gold"
                aria-hidden
              />
              <div className="h-full w-full border border-primary-foreground/15 p-8">
                <img src={logo} alt="Logo CN2O" className="h-full w-full object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILARES */}
      <section className="border-b border-border bg-background">
        <div className="container-tight grid gap-8 py-12 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-primary">
                <Icon size={24} aria-hidden />
              </div>
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
          {featured.map((s, i) => {
            const Icon = serviceIcons[s.slug];
            return (
              <Link
                key={s.slug}
                to="/servicos"
                hash={s.slug}
                className="group relative flex flex-col gap-4 bg-background p-8 transition-colors hover:bg-accent/60"
              >
                <span
                  className="absolute right-6 top-6 font-display text-2xl text-gold/50 transition-colors group-hover:text-gold"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {Icon && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon size={24} aria-hidden />
                  </div>
                )}
                <div className="font-display text-xl text-secondary">{s.title}</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.short}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Saiba mais{" "}
                  <ArrowRight
                    size={14}
                    className="text-gold transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
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
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary-soft"
            >
              Conheça nossa história <ArrowRight size={16} className="text-gold" aria-hidden />
            </Link>
          </div>
          <div className="relative">
            <div className="navy-gradient relative aspect-[4/5] overflow-hidden p-8 text-secondary-foreground md:p-10">
              <div
                className="topo-lines absolute inset-0 text-secondary-foreground/10"
                aria-hidden
              />
              <div className="relative flex h-full flex-col justify-between">
                <span className="font-display text-7xl leading-none text-gold/60" aria-hidden>
                  &ldquo;
                </span>
                <div className="font-display text-2xl leading-tight !text-secondary-foreground md:text-3xl">
                  Servir com seriedade é honrar a confiança de cada cidadão que cruza nossa porta.
                </div>
                <div className="border-t border-gold/30 pt-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    César Bravo
                  </div>
                  <div className="text-sm text-secondary-foreground/70">
                    Tabelião — 2º Ofício de Itabaiana
                  </div>
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
            className="hidden shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary-soft md:inline-flex"
          >
            Ver todas <ArrowRight size={16} className="text-gold" aria-hidden />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {latest.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary"
          >
            Ver todas as publicações <ArrowRight size={16} className="text-gold" aria-hidden />
          </Link>
        </div>
      </section>

      {/* CONTATO RÁPIDO */}
      <section className="navy-gradient relative overflow-hidden text-secondary-foreground">
        <div className="topo-lines absolute inset-0 text-secondary-foreground/5" aria-hidden />
        <div className="container-tight relative grid gap-10 py-20 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
              <span className="h-px w-10 bg-gold/50" aria-hidden />
              Estamos prontos para atender
            </div>
            <h2 className="!text-secondary-foreground font-display text-3xl md:text-4xl">
              Tire suas dúvidas ou agende seu atendimento.
            </h2>
            <p className="mt-4 max-w-xl text-secondary-foreground/70">
              Atendemos de segunda a sexta, das 08h às 16h, na Avenida Ivo de Carvalho, 441, Centro
              de Itabaiana/SE. Você também pode falar conosco pelos canais abaixo.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-gold px-6 py-4 text-sm font-bold uppercase tracking-wider text-secondary shadow-lg transition-colors hover:bg-gold/90"
            >
              <MessageCircle size={16} aria-hidden /> WhatsApp (79) 99976-0702
            </a>
            <Link
              to="/contato"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-secondary-foreground/30 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-secondary-foreground transition-colors hover:bg-secondary-foreground/5"
            >
              Ver localização e contatos
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
