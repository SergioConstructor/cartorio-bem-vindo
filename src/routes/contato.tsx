import type { FormEvent, MouseEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — CN2O Cartório de Notas de Itabaiana" },
      {
        name: "description",
        content:
          "Endereço, telefone, e-mail e horário de atendimento do 2º Ofício de Notas de Itabaiana/SE.",
      },
      { property: "og:title", content: "Contato — CN2O" },
      { property: "og:description", content: "Como nos encontrar e falar conosco." },
      { property: "og:url", content: "/contato" },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: ContatoPage,
});

const infos = [
  {
    icon: MapPin,
    title: "Endereço",
    lines: ["Avenida Ivo de Carvalho, 441", "Centro · Itabaiana/SE", "CEP 49.500-064"],
  },
  {
    icon: Phone,
    title: "Telefone & WhatsApp",
    lines: ["(79) 99976-0702"],
    href: "tel:+5579999760702",
  },
  {
    icon: Mail,
    title: "E-mail",
    lines: ["contato@cn2oita.com.br"],
    href: "mailto:contato@cn2oita.com.br",
  },
  {
    icon: Clock,
    title: "Horário de atendimento",
    lines: ["Segunda a sexta", "08h às 16h"],
  },
];

const inputClass =
  "w-full rounded-sm border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

// Sem backend: o envio monta a mensagem e abre o e-mail ou o WhatsApp do visitante
function composeMessage(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    subject: String(data.get("assunto") || "Contato pelo site"),
    body: `Nome: ${data.get("nome")}\nE-mail: ${data.get("email")}\n\n${data.get("mensagem")}`,
  };
}

function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const { subject, body } = composeMessage(e.currentTarget);
  window.location.href = `mailto:contato@cn2oita.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function handleWhatsAppSubmit(e: MouseEvent<HTMLButtonElement>) {
  const form = e.currentTarget.form;
  if (!form || !form.reportValidity()) return;
  const { subject, body } = composeMessage(form);
  window.open(
    `https://wa.me/5579999760702?text=${encodeURIComponent(`${subject}\n\n${body}`)}`,
    "_blank",
    "noreferrer",
  );
}

function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Contato"
        title="Estamos prontos para atender você."
        description="Visite-nos no Centro de Itabaiana, ligue, mande um WhatsApp ou nos envie um e-mail. Responderemos o mais breve possível."
      />

      <section className="container-tight py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr]">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {infos.map(({ icon: Icon, title, lines, href }) => (
                <div key={title} className="card-lift border border-border bg-card p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-gold-soft text-primary">
                    <Icon size={20} aria-hidden />
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-secondary/70">
                    {title}
                  </div>
                  {href ? (
                    <a
                      href={href}
                      className="mt-2 block font-display text-lg text-secondary transition-colors hover:text-primary"
                    >
                      {lines[0]}
                    </a>
                  ) : (
                    <div className="mt-2 text-sm leading-relaxed text-foreground/80">
                      {lines.map((l) => (
                        <div key={l}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary-soft"
            >
              <MessageCircle size={15} aria-hidden />
              Falar pelo WhatsApp
            </a>
          </div>

          <div className="overflow-hidden border border-border shadow-sm">
            <iframe
              title="Localização do CN2O — 2º Ofício de Itabaiana"
              src="https://www.google.com/maps?q=Avenida+Ivo+de+Carvalho+441+Itabaiana+Sergipe&output=embed"
              className="h-full min-h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <section className="bg-accent/30">
        <div className="container-tight py-20">
          <div className="mx-auto max-w-2xl">
            <SectionHeading
              align="center"
              eyebrow="Envie uma mensagem"
              title="Prefere escrever? Conte com a gente."
              description="Preencha os campos e escolha como enviar: abrimos seu aplicativo de e-mail ou o WhatsApp com a mensagem já pronta."
            />
            <form onSubmit={handleEmailSubmit} className="mt-10 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary/70">
                    Seu nome
                  </span>
                  <input required name="nome" autoComplete="name" className={inputClass} />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary/70">
                    Seu e-mail
                  </span>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    className={inputClass}
                  />
                </label>
              </div>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary/70">
                  Assunto
                </span>
                <input name="assunto" className={inputClass} />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-secondary/70">
                  Sua mensagem
                </span>
                <textarea required name="mensagem" rows={6} className={inputClass} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary-soft"
                >
                  <Mail size={15} aria-hidden />
                  Enviar por e-mail
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppSubmit}
                  className="inline-flex items-center gap-2 rounded-sm border border-primary/40 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-accent"
                >
                  <MessageCircle size={15} aria-hidden />
                  Enviar pelo WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
