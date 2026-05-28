import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

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
    lines: ["(79) 99944-0969"],
    href: "tel:+5579999440969",
  },
  {
    icon: Mail,
    title: "E-mail",
    lines: ["cesar.bravo@cn2oita.com.br"],
    href: "mailto:cesar.bravo@cn2oita.com.br",
  },
  {
    icon: Clock,
    title: "Horário de atendimento",
    lines: ["Segunda a sexta", "08h às 17h"],
  },
];

function ContatoPage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="container-tight py-20">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Contato
          </div>
          <h1 className="mt-4 font-display text-4xl text-primary-foreground md:text-5xl">
            Estamos prontos para atender você.
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Visite-nos no Centro de Itabaiana, ligue, mande um WhatsApp ou nos envie um
            e-mail. Responderemos o mais breve possível.
          </p>
        </div>
      </section>

      <section className="container-tight py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <div className="space-y-8">
            {infos.map(({ icon: Icon, title, lines, href }) => (
              <div key={title} className="flex gap-4 border-b border-border pb-6">
                <Icon size={22} className="mt-1 shrink-0 text-primary" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary/70">
                    {title}
                  </div>
                  {href ? (
                    <a
                      href={href}
                      className="mt-1 block font-display text-lg text-secondary hover:text-primary"
                    >
                      {lines[0]}
                    </a>
                  ) : (
                    <div className="mt-1 text-foreground/80">
                      {lines.map((l) => (
                        <div key={l}>{l}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <a
              href="https://wa.me/5579999440969"
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-soft"
            >
              Falar pelo WhatsApp
            </a>
          </div>

          <div className="overflow-hidden border border-border">
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
            <div className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Envie uma mensagem
            </div>
            <h2 className="mt-3 text-center font-display text-3xl">
              Prefere escrever? Conte com a gente.
            </h2>
            <form
              action="mailto:cesar.bravo@cn2oita.com.br"
              method="post"
              encType="text/plain"
              className="mt-10 grid gap-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  required
                  name="nome"
                  placeholder="Seu nome"
                  className="border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <input
                  required
                  type="email"
                  name="email"
                  placeholder="Seu e-mail"
                  className="border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <input
                name="assunto"
                placeholder="Assunto"
                className="border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <textarea
                required
                name="mensagem"
                rows={6}
                placeholder="Sua mensagem"
                className="border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="justify-self-start rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-soft"
              >
                Enviar mensagem
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
