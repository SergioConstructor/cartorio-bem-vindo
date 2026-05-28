import { createFileRoute } from "@tanstack/react-router";

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

function SobrePage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="container-tight py-20">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Sobre o cartório
          </div>
          <h1 className="mt-4 font-display text-4xl text-primary-foreground md:text-5xl">
            Tradição local, postura moderna.
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            O Cartório de Notas — 2º Ofício de Itabaiana/SE une seriedade institucional,
            atendimento humano e a modernização que o cidadão de hoje espera.
          </p>
        </div>
      </section>

      <section className="container-tight grid gap-16 py-24 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Identidade
          </div>
          <h2 className="mt-3 font-display text-3xl">A marca CN2O</h2>
        </div>
        <div className="space-y-4 text-foreground/80">
          <p>
            A identidade visual do 2º Ofício de Itabaiana foi construída para refletir três
            valores: tradição, modernidade e conexão com o território local. O símbolo CN2O é
            formado pelas iniciais do nome em extenso — Cartório de Notas, 2º Ofício —
            transmitindo solidez e profissionalismo.
          </p>
          <p>
            A tipografia carrega inclinações inspiradas na topografia serrana de Itabaiana,
            reforçando o vínculo com a cidade. Já a letra "O", em forma de barra de
            atualização, simboliza renovação e o novo momento vivido pelo cartório — marcado
            por modernização contínua dos processos e do atendimento.
          </p>
        </div>
      </section>

      <section className="bg-accent/30">
        <div className="container-tight grid gap-16 py-24 md:grid-cols-[1fr_1.2fr]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Tabelião
            </div>
            <h2 className="mt-3 font-display text-3xl">César Bravo</h2>
            <p className="mt-4 text-sm text-muted-foreground">
              À frente do 2º Ofício de Itabaiana/SE.
            </p>
          </div>
          <div className="space-y-4 text-foreground/80">
            <p>
              Comprometido com a evolução constante dos serviços notariais, César Bravo
              conduz o cartório com foco em segurança jurídica, agilidade e tratamento
              respeitoso a cada pessoa atendida.
            </p>
            <p>
              "Nosso papel é dar tranquilidade ao cidadão em momentos importantes da vida.
              Cada escritura, cada procuração, cada reconhecimento de firma é tratado com a
              seriedade que a fé pública exige."
            </p>
          </div>
        </div>
      </section>

      <section className="container-tight py-24">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          Nossos valores
        </div>
        <h2 className="mt-3 font-display text-3xl">O que nos guia</h2>
        <div className="mt-10 grid gap-px border border-border bg-border md:grid-cols-3">
          {[
            { title: "Segurança jurídica", text: "Cada ato lavrado tem rigor técnico, garantindo validade e proteção às partes envolvidas." },
            { title: "Atendimento humano", text: "Escutamos com atenção e explicamos cada etapa. Atrás de cada documento, há uma pessoa." },
            { title: "Modernização contínua", text: "Investimos em processos e tecnologia para reduzir tempo de espera e tornar tudo mais simples." },
          ].map((v) => (
            <div key={v.title} className="bg-background p-8">
              <h3 className="font-display text-xl">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
