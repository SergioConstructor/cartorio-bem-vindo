import { createFileRoute } from "@tanstack/react-router";
import logoWhite from "@/assets/cn2o-logo-white.png";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — CN2O 2º Ofício de Itabaiana/SE" },
      {
        name: "description",
        content:
          "Conheça a história, valores e o tabelião César Bravo, à frente do 2º Ofício de Notas de Itabaiana/SE.",
      },
      { property: "og:title", content: "Sobre o CN2O — 2º Ofício de Itabaiana" },
      { property: "og:description", content: "Tradição local e modernização contínua." },
      { property: "og:url", content: "/sobre" },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: SobrePage,
});

const brandLetters = [
  { letter: "C", meaning: "Cartório" },
  { letter: "N", meaning: "de Notas" },
  { letter: "2", meaning: "2º Ofício" },
  { letter: "O", meaning: "Renovação contínua" },
];

const values = [
  {
    title: "Segurança jurídica",
    text: "Cada ato lavrado tem rigor técnico, garantindo validade e proteção às partes envolvidas.",
  },
  {
    title: "Atendimento humano",
    text: "Escutamos com atenção e explicamos cada etapa. Atrás de cada documento, há uma pessoa.",
  },
  {
    title: "Modernização contínua",
    text: "Investimos em processos e tecnologia para reduzir tempo de espera e tornar tudo mais simples.",
  },
];

function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre o cartório"
        title="Tradição local, postura moderna."
        description="O Cartório de Notas — 2º Ofício de Itabaiana/SE une seriedade institucional, atendimento humano e a modernização que o cidadão de hoje espera."
      />

      {/* IDENTIDADE */}
      <section className="container-tight grid gap-12 py-24 md:grid-cols-[1fr_1.2fr] md:items-start">
        <div>
          <SectionHeading eyebrow="Identidade" title="A marca CN2O" />

          <div className="hero-gradient relative mt-8 flex aspect-square max-w-xs items-center justify-center overflow-hidden p-10">
            <div className="topo-lines absolute inset-0 text-primary-foreground/10" aria-hidden />
            <img
              src={logoWhite}
              alt="Símbolo CN2O"
              className="relative h-full w-full object-contain"
            />
          </div>
        </div>
        <div>
          <div className="space-y-4 text-foreground/80">
            <p>
              A identidade visual do 2º Ofício de Itabaiana foi construída para refletir três
              valores: tradição, modernidade e conexão com o território local. O símbolo CN2O é
              formado pelas iniciais do nome em extenso — Cartório de Notas, 2º Ofício —
              transmitindo solidez e profissionalismo.
            </p>
            <p>
              A tipografia carrega inclinações inspiradas na topografia serrana de Itabaiana,
              reforçando o vínculo com a cidade. Já a letra &ldquo;O&rdquo;, em forma de barra de
              atualização, simboliza renovação e o novo momento vivido pelo cartório — marcado por
              modernização contínua dos processos e do atendimento.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
            {brandLetters.map(({ letter, meaning }) => (
              <div
                key={letter}
                className="flex flex-col items-center gap-1 bg-card p-6 text-center"
              >
                <span className="font-display text-4xl font-semibold text-primary">{letter}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {meaning}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TABELIÃO */}
      <section className="bg-accent/30">
        <div className="container-tight grid gap-16 py-24 md:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              eyebrow="Tabelião"
              title="César Bravo"
              description="À frente do 2º Ofício de Itabaiana/SE."
            />
          </div>
          <div className="space-y-6 text-foreground/80">
            <p>
              Comprometido com a evolução constante dos serviços notariais, César Bravo conduz o
              cartório com foco em segurança jurídica, agilidade e tratamento respeitoso a cada
              pessoa atendida.
            </p>
            <blockquote className="border-l-2 border-gold bg-card p-6 font-display text-xl italic leading-relaxed text-secondary">
              &ldquo;Nosso papel é dar tranquilidade ao cidadão em momentos importantes da vida.
              Cada escritura, cada procuração, cada reconhecimento de firma é tratado com a
              seriedade que a fé pública exige.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* VALORES */}
      <section className="container-tight py-24">
        <SectionHeading eyebrow="Nossos valores" title="O que nos guia" />
        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
          {values.map((v, i) => (
            <div key={v.title} className="bg-card p-8">
              <div className="font-display text-3xl text-gold/70" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-3 font-display text-xl">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
