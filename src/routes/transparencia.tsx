import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileCheck2, Landmark, MessageCircle } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import {
  destinoPorCem,
  NOME_FUNDO_JUDICIARIO,
  rotuloPeriodo,
  semestresOrdenados,
  type Destino,
} from "@/content/transparencia";

export const Route = createFileRoute("/transparencia")({
  head: () => ({
    meta: [
      { title: "Transparência — CN2O Cartório de Notas de Itabaiana" },
      {
        name: "description",
        content:
          "Para onde vai o valor pago no Cartório de Notas do 2º Ofício de Itabaiana/SE: repasses ao Judiciário, ISS, tributos federais e custeio, conforme declarado ao CNJ.",
      },
      { property: "og:title", content: "Transparência — CN2O" },
      {
        property: "og:description",
        content: "De cada R$ 100 pagos no cartório, quanto vai para impostos, fundos e custeio.",
      },
      { property: "og:url", content: "/transparencia" },
    ],
    links: [{ rel: "canonical", href: "/transparencia" }],
  }),
  component: TransparenciaPage,
});

const WHATSAPP_URL = "https://wa.me/5579999760702";

// Uma cor por destino, dos tokens da identidade. A ordem segue destinoPorCem.
const COR: Record<Destino["chave"], string> = {
  fundo: "bg-primary",
  iss: "bg-gold",
  federais: "bg-secondary",
  custeio: "bg-secondary/45",
  remuneracao: "bg-muted-foreground/40",
};

const reais = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const inteiro = new Intl.NumberFormat("pt-BR");

function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function TransparenciaPage() {
  const lista = semestresOrdenados();
  const [periodo, setPeriodo] = useState(lista[0]?.periodo);
  const atual = lista.find((s) => s.periodo === periodo) ?? lista[0];

  return (
    <>
      <PageHero
        eyebrow="Transparência"
        title="Para onde vai o valor pago no cartório"
        description="Os emolumentos são fixados em lei estadual. Uma parte é repassada ao Judiciário e ao Município, outra paga tributos federais e o funcionamento do cartório. Aqui mostramos essa divisão com os números declarados ao CNJ."
      />

      <section className="container-tight py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          {!atual ? (
            <EmBreve />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <SectionHeading
                  eyebrow={rotuloPeriodo(atual.periodo)}
                  title="De cada R$ 100 pagos"
                />
                {lista.length > 1 && (
                  <label className="grid gap-1 text-xs font-semibold uppercase tracking-wider text-secondary/70">
                    Semestre
                    <select
                      value={atual.periodo}
                      onChange={(e) => setPeriodo(e.target.value as typeof atual.periodo)}
                      className="rounded-sm border border-input bg-card px-3 py-2 text-sm font-normal normal-case tracking-normal text-foreground"
                    >
                      {lista.map((s) => (
                        <option key={s.periodo} value={s.periodo}>
                          {rotuloPeriodo(s.periodo)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <Distribuicao destinos={destinoPorCem(atual)} />

              <div className="mt-10 overflow-x-auto border border-border bg-card">
                <table className="w-full min-w-[28rem] text-sm">
                  <caption className="sr-only">
                    Valores do {rotuloPeriodo(atual.periodo)} em reais
                  </caption>
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-secondary/70">
                      <th className="px-4 py-3 font-semibold">Destino</th>
                      <th className="px-4 py-3 text-right font-semibold">Valor</th>
                      <th className="px-4 py-3 text-right font-semibold">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {destinoPorCem(atual).map((d) => (
                      <tr key={d.chave} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">{d.rotulo}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {reais.format(d.valor)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {pct.format(d.percentual)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 font-semibold">
                      <td className="px-4 py-3">Emolumentos recebidos no semestre</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {reais.format(atual.emolumentosBrutos)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <FileCheck2 size={14} className="mt-0.5 shrink-0 text-gold" aria-hidden />
                <span>
                  Valores declarados ao CNJ no Sistema Justiça Aberta em{" "}
                  {formatarData(atual.declaradoEm)}
                  {atual.atosPraticados !== undefined &&
                    ` · ${inteiro.format(atual.atosPraticados)} atos praticados no semestre`}
                  . Atualizado a cada semestre.
                </span>
              </p>
            </>
          )}

          <ComoFunciona />
        </div>
      </section>
    </>
  );
}

function Distribuicao({ destinos }: { destinos: Destino[] }) {
  const visiveis = destinos.filter((d) => d.percentual > 0);
  return (
    <div className="mt-8">
      <div
        className="flex h-6 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={visiveis.map((d) => `${d.rotulo}: ${pct.format(d.percentual)}%`).join("; ")}
      >
        {visiveis.map((d) => (
          <div key={d.chave} className={COR[d.chave]} style={{ width: `${d.percentual}%` }} />
        ))}
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {destinos.map((d) => (
          <li key={d.chave} className="flex gap-3">
            <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${COR[d.chave]}`} aria-hidden />
            <div>
              <div className="text-sm font-medium text-secondary">
                {reais.format(d.percentual)}{" "}
                <span className="font-normal text-muted-foreground">— {d.rotulo}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{d.descricao}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmBreve() {
  return (
    <div className="border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl text-secondary">Dados em preparação</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">
        Estamos organizando os números declarados ao CNJ para publicá-los aqui. Enquanto isso, a
        tabela oficial de emolumentos está disponível no balcão e pode ser solicitada pelo WhatsApp.
      </p>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-soft"
      >
        <MessageCircle size={15} aria-hidden />
        Falar com o cartório
      </a>
    </div>
  );
}

function ComoFunciona() {
  return (
    <div className="mt-16 border-t border-border pt-12">
      <SectionHeading eyebrow="Entenda" title="Como funciona a cobrança" />
      <div className="mt-6 grid gap-6 text-sm leading-relaxed text-foreground/75">
        <p>
          <strong className="text-secondary">Emolumentos</strong> são o valor pago por cada ato
          (escritura, procuração, reconhecimento de firma). Em Sergipe, eles são definidos pela Lei
          Estadual nº 8.639/2019 — o cartório não escolhe quanto cobra.
        </p>
        <p>
          <strong className="text-secondary">{NOME_FUNDO_JUDICIARIO}:</strong> parte de cada
          cobrança é destinada ao Judiciário, que fiscaliza os cartórios.
        </p>
        <p>
          <strong className="text-secondary">ISS:</strong> os serviços notariais pagam o Imposto
          Sobre Serviços ao Município de Itabaiana (Lei Complementar nº 116/2003, item 21.01).
        </p>
        <p className="flex items-start gap-2">
          <Landmark size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <span>
            Todo semestre, o cartório declara receitas e despesas ao Conselho Nacional de Justiça no
            Sistema Justiça Aberta. Os números desta página são os mesmos dessa declaração.
          </span>
        </p>
      </div>
    </div>
  );
}
