import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  MessageCircle,
  Send,
} from "lucide-react";

import { PageHero } from "@/components/site/PageHero";
import { DossieRail } from "@/components/protocolo/DossieRail";
import { TriagemPerguntas } from "@/components/protocolo/TriagemPerguntas";
import {
  UploadDocumentos,
  validarNoNavegador,
  type ArquivoSelecionado,
} from "@/components/protocolo/UploadDocumentos";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/protocolo/Turnstile";
import {
  ATOS,
  ATO_NOME,
  ESCREVENTES,
  PAPEIS,
  PARCEIROS,
  type AtoId,
} from "@/content/protocolo/atos";
import {
  itensDossie,
  perguntasVisiveis,
  tituloCartao,
  type Respostas,
} from "@/lib/protocolo/dossie";
import {
  anexarDocumento,
  enviarProtocolo,
  obterModoProtocolo,
} from "@/lib/api/protocolo.functions";

export const Route = createFileRoute("/protocolo")({
  head: () => ({
    meta: [
      { title: "Iniciar protocolo online — CN2O Cartório de Notas de Itabaiana" },
      {
        name: "description",
        content:
          "Monte o protocolo da sua escritura pela internet: escolha o tipo de ato, descubra exatamente quais documentos são necessários e envie os PDFs ao 2º Ofício de Itabaiana/SE.",
      },
      { property: "og:title", content: "Iniciar protocolo online — CN2O" },
      {
        property: "og:description",
        content:
          "Descubra os documentos do seu caso e adiante a entrada da escritura pela internet.",
      },
      { property: "og:url", content: "/protocolo" },
    ],
    links: [{ rel: "canonical", href: "/protocolo" }],
  }),
  component: ProtocoloPage,
});

const WHATSAPP_URL = "https://wa.me/5579999760702";

const PASSOS = ["Ato", "Seus dados", "Perguntas", "Documentos", "Revisão"] as const;

// Rascunho guardado no próprio navegador: o formulário tem 5 passos e dezenas
// de perguntas, e no celular basta atender uma ligação para perder tudo.
// Ficam de fora os arquivos (não são serializáveis) e o aceite da LGPD, que
// deve ser dado conscientemente a cada envio.
const CHAVE_RASCUNHO = "cn2o:protocolo:rascunho";

type Rascunho = {
  passo: number;
  ato: AtoId | null;
  respostas: Respostas;
  emMaos: string[];
  apresentanteNome: string;
  apresentanteTelefone: string;
  parteNome: string;
  parteTelefone: string;
  escrevente: string;
  urgente: boolean;
  observacoes: string;
};

function lerRascunho(): Partial<Rascunho> | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_RASCUNHO);
    return bruto ? (JSON.parse(bruto) as Partial<Rascunho>) : null;
  } catch {
    return null;
  }
}

const inputClass =
  "w-full rounded-sm border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";
const rotuloClass = "mb-1.5 block text-[11px] uppercase tracking-wider text-muted-foreground";

type Etapa = "formulario" | "enviando" | "concluido";

type Conclusao = {
  codigo: string;
  demonstracao: boolean;
  anexosEnviados: number;
  anexosFalhos: string[];
};

function ProtocoloPage() {
  const [passo, setPasso] = useState(0);
  const [ato, setAto] = useState<AtoId | null>(null);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [emMaos, setEmMaos] = useState<Set<string>>(new Set());
  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([]);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);

  const [apresentanteNome, setApresentanteNome] = useState("");
  const [apresentanteTelefone, setApresentanteTelefone] = useState("");
  const [parteNome, setParteNome] = useState("");
  const [parteTelefone, setParteTelefone] = useState("");
  const [escrevente, setEscrevente] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [observacoes, setObservacoes] = useState("");
  const [aceite, setAceite] = useState(false);

  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // O token do Turnstile vale UMA vez: toda falha de envio precisa pedir outro,
  // senão a retentativa cai em "captcha inválido" e o botão trava de vez.
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [armadilha, setArmadilha] = useState("");
  const abertoEm = useRef(Date.now());

  // Quem decide se a página está ativa é o SERVIDOR (ele conhece as chaves do
  // Trello e do captcha). O cliente só reflete — antes ele adivinhava pela
  // chave pública e podia divergir.
  const modo = useQuery({
    queryKey: ["protocolo", "modo"],
    queryFn: () => obterModoProtocolo(),
    staleTime: 5 * 60 * 1000,
  });
  const modoDemonstracao = modo.data === "demonstracao";
  const modoCarregando = modo.isPending;

  const [etapa, setEtapa] = useState<Etapa>("formulario");
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [conclusao, setConclusao] = useState<Conclusao | null>(null);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  // Restaura o rascunho uma única vez, ao abrir a página.
  useEffect(() => {
    const salvo = lerRascunho();
    if (!salvo?.ato) return;
    setAto(salvo.ato);
    setPasso(salvo.passo ?? 1);
    setRespostas(salvo.respostas ?? {});
    setEmMaos(new Set(salvo.emMaos ?? []));
    setApresentanteNome(salvo.apresentanteNome ?? "");
    setApresentanteTelefone(salvo.apresentanteTelefone ?? "");
    setParteNome(salvo.parteNome ?? "");
    setParteTelefone(salvo.parteTelefone ?? "");
    setEscrevente(salvo.escrevente ?? "");
    setUrgente(salvo.urgente ?? false);
    setObservacoes(salvo.observacoes ?? "");
  }, []);

  // Guarda o rascunho a cada mudança (sem os arquivos e sem o aceite LGPD).
  useEffect(() => {
    if (!ato) return;
    try {
      const rascunho: Rascunho = {
        passo,
        ato,
        respostas,
        emMaos: [...emMaos],
        apresentanteNome,
        apresentanteTelefone,
        parteNome,
        parteTelefone,
        escrevente,
        urgente,
        observacoes,
      };
      sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(rascunho));
    } catch {
      // Navegador sem armazenamento (aba anônima, cota cheia): seguir sem rascunho.
    }
  }, [
    passo,
    ato,
    respostas,
    emMaos,
    apresentanteNome,
    apresentanteTelefone,
    parteNome,
    parteTelefone,
    escrevente,
    urgente,
    observacoes,
  ]);

  const perguntas = useMemo(() => (ato ? perguntasVisiveis(ato, respostas) : []), [ato, respostas]);
  const itens = useMemo(() => (ato ? itensDossie(ato, respostas) : []), [ato, respostas]);

  const dadosPreenchidos =
    apresentanteNome.trim().length >= 3 &&
    apresentanteTelefone.trim().length >= 8 &&
    parteNome.trim().length >= 3;

  const podeEnviar =
    dadosPreenchidos && aceite && !modoCarregando && (modoDemonstracao || Boolean(captchaToken));

  // Explica por que o botão está desabilitado — antes o cliente só via cinza.
  const motivoBloqueio = !dadosPreenchidos
    ? "Volte ao passo “Seus dados” e preencha nome e telefone."
    : !aceite
      ? "Marque a autorização acima para enviar."
      : modoCarregando
        ? "Carregando…"
        : !modoDemonstracao && !captchaToken
          ? "Conclua a verificação de segurança acima. Se ela não aparecer, seu navegador pode estar bloqueando a Cloudflare — fale conosco pelo WhatsApp."
          : null;

  function responder(id: string, valor: string | string[] | undefined) {
    setRespostas((atual) => {
      const novo = { ...atual };
      if (valor === undefined) delete novo[id];
      else novo[id] = valor;
      return novo;
    });
  }

  function alternarDocumento(item: string) {
    setEmMaos((atual) => {
      const novo = new Set(atual);
      if (novo.has(item)) novo.delete(item);
      else novo.add(item);
      return novo;
    });
  }

  async function adicionarArquivos(lista: FileList) {
    setErroArquivo(null);
    const aceitos: ArquivoSelecionado[] = [];

    // Um arquivo recusado não pode descartar os outros da mesma seleção:
    // avaliamos todos e listamos os problemas no fim.
    const problemas: string[] = [];
    for (const file of Array.from(lista)) {
      const erro = await validarNoNavegador(file, [...arquivos, ...aceitos]);
      if (erro) {
        problemas.push(erro);
        continue;
      }
      aceitos.push({ file, id: `${file.name}-${file.size}-${crypto.randomUUID()}` });
    }
    if (problemas.length) setErroArquivo(problemas.join(" "));

    if (aceitos.length) setArquivos((atual) => [...atual, ...aceitos]);
  }

  async function enviar() {
    if (!ato || !podeEnviar) return;
    setEtapa("enviando");
    setErroEnvio(null);
    setProgresso({ atual: 0, total: arquivos.length });

    try {
      const resultado = await enviarProtocolo({
        data: {
          ato,
          apresentanteNome,
          apresentanteTelefone,
          parteNome,
          parteTelefone,
          escrevente,
          urgente,
          respostas: respostas as Record<string, string | string[]>,
          documentosEmMaos: itens.filter((item) => emMaos.has(item)),
          observacoes,
          quantidadeArquivos: arquivos.length,
          aceiteLgpd: true as const,
          captchaToken: captchaToken ?? "",
          armadilha,
          duracaoMs: Date.now() - abertoEm.current,
        },
      });

      if (resultado.status === "demonstracao") {
        try {
          sessionStorage.removeItem(CHAVE_RASCUNHO);
        } catch {
          // sem armazenamento: nada a limpar
        }
        setConclusao({
          codigo: resultado.codigo,
          demonstracao: true,
          anexosEnviados: 0,
          anexosFalhos: [],
        });
        setEtapa("concluido");
        return;
      }

      if (resultado.status !== "ok") {
        const mensagens: Record<string, string> = {
          captcha: "A verificação de segurança falhou. Recarregue a página e tente de novo.",
          limite: "Recebemos muitos envios agora há pouco. Aguarde alguns minutos e tente de novo.",
          config_pendente:
            "O envio online ainda não está liberado. Fale conosco pelo WhatsApp que protocolamos para você.",
          erro: "Não foi possível concluir o envio. Tente novamente em instantes.",
        };
        setErroEnvio(mensagens[resultado.status] ?? mensagens.erro);
        setCaptchaToken(null);
        setCaptchaResetKey((k) => k + 1);
        setEtapa("formulario");
        return;
      }

      // O cartão já existe: daqui em diante nenhuma falha de anexo pode
      // "perder" a solicitação — só listamos o que não subiu.
      const falhos: string[] = [];
      let enviados = 0;

      if (resultado.uploadToken) {
        for (let i = 0; i < arquivos.length; i++) {
          const { file } = arquivos[i];
          setProgresso({ atual: i, total: arquivos.length });
          try {
            const corpo = new FormData();
            corpo.append("token", resultado.uploadToken);
            corpo.append("tamanho", String(file.size));
            corpo.append("arquivo", file, file.name);
            const anexo = await anexarDocumento({ data: corpo });
            if (anexo.status === "ok") enviados += 1;
            else falhos.push(file.name);
          } catch {
            falhos.push(file.name);
          }
        }
      }

      setProgresso({ atual: arquivos.length, total: arquivos.length });
      try {
        sessionStorage.removeItem(CHAVE_RASCUNHO);
      } catch {
        // sem armazenamento: nada a limpar
      }
      setConclusao({
        codigo: resultado.codigo,
        demonstracao: false,
        anexosEnviados: enviados,
        anexosFalhos: falhos,
      });
      setEtapa("concluido");
    } catch (erro) {
      console.error(erro);
      setErroEnvio("Não foi possível concluir o envio. Tente novamente em instantes.");
      setCaptchaToken(null);
      setCaptchaResetKey((k) => k + 1);
      setEtapa("formulario");
    }
  }

  if (etapa === "concluido" && conclusao) {
    return <TelaConclusao conclusao={conclusao} />;
  }

  const enviando = etapa === "enviando";

  return (
    <>
      <PageHero
        eyebrow="Protocolo online"
        title="Monte o protocolo da sua escritura"
        description="Responda algumas perguntas, descubra exatamente quais documentos o seu caso exige e já envie o que tiver em PDF. Você recebe um código para acompanhar."
      />

      <section className="container-tight grid gap-7 py-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0">
          <Passos atual={passo} habilitado={Boolean(ato) && !enviando} onIr={setPasso} />

          <div className="mt-6 space-y-6">
            {passo === 0 && (
              <PassoAto
                ato={ato}
                onEscolher={(a) => {
                  // Só zera a triagem quando o ato REALMENTE muda: reclicar no
                  // mesmo ato apagaria silenciosamente tudo o que foi respondido.
                  if (a !== ato) {
                    setAto(a);
                    setRespostas({});
                    setEmMaos(new Set());
                  }
                  setPasso(1);
                }}
              />
            )}

            {passo === 1 && ato && (
              <PassoIdentificacao
                ato={ato}
                apresentanteNome={apresentanteNome}
                setApresentanteNome={setApresentanteNome}
                apresentanteTelefone={apresentanteTelefone}
                setApresentanteTelefone={setApresentanteTelefone}
                parteNome={parteNome}
                setParteNome={setParteNome}
                parteTelefone={parteTelefone}
                setParteTelefone={setParteTelefone}
                escrevente={escrevente}
                setEscrevente={setEscrevente}
                urgente={urgente}
                setUrgente={setUrgente}
              />
            )}

            {passo === 2 && ato && (
              <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
                <h2 className="font-display text-lg text-secondary">Sobre o negócio</h2>
                <p className="mt-1 mb-5 text-sm text-muted-foreground">
                  Todas as perguntas são opcionais. Se não souber, deixe em branco — o cartório
                  confere no atendimento. Cada resposta ajuda a montar a lista de documentos.
                </p>
                <TriagemPerguntas
                  perguntas={perguntas}
                  respostas={respostas}
                  onResponder={responder}
                />
              </section>
            )}

            {passo === 3 && ato && (
              <div className="lg:hidden">
                <DossieRail
                  titulo=""
                  itens={itens}
                  emMaos={emMaos}
                  onAlternar={alternarDocumento}
                />
                <p className="mt-2 mb-6 text-xs text-muted-foreground">
                  Marque o que você já tem em mãos. Não precisa ter tudo para enviar.
                </p>
              </div>
            )}

            {passo === 3 && (
              <PassoDocumentos
                arquivos={arquivos}
                erroArquivo={erroArquivo}
                onAdicionar={adicionarArquivos}
                onRemover={(id) => setArquivos((a) => a.filter((x) => x.id !== id))}
                observacoes={observacoes}
                setObservacoes={setObservacoes}
              />
            )}

            {passo === 4 && ato && (
              <PassoRevisao
                ato={ato}
                parteNome={parteNome}
                itens={itens}
                emMaos={emMaos}
                arquivos={arquivos}
                aceite={aceite}
                setAceite={setAceite}
                modoDemonstracao={modoDemonstracao}
                onToken={setCaptchaToken}
                captchaResetKey={captchaResetKey}
                armadilha={armadilha}
                setArmadilha={setArmadilha}
                erroEnvio={erroEnvio}
                dadosPreenchidos={dadosPreenchidos}
              />
            )}
          </div>

          <Navegacao
            passo={passo}
            total={PASSOS.length}
            habilitado={Boolean(ato) && (passo !== 1 || dadosPreenchidos)}
            avisoPasso={
              passo === 1 && !dadosPreenchidos ? "Preencha nome e telefone para continuar." : null
            }
            podeEnviar={podeEnviar}
            motivoBloqueio={motivoBloqueio}
            enviando={enviando}
            progresso={progresso}
            onVoltar={() => setPasso((p) => Math.max(0, p - 1))}
            onAvancar={() => setPasso((p) => Math.min(PASSOS.length - 1, p + 1))}
            onEnviar={enviar}
          />
        </div>

        <aside className="hidden lg:sticky lg:top-28 lg:block">
          <DossieRail
            titulo={ato ? tituloCartao(ato, "…", parteNome).replace(" - […]", "") : ""}
            itens={itens}
            emMaos={emMaos}
            onAlternar={alternarDocumento}
          />
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <Lock size={13} className="mt-0.5 flex-none text-primary" aria-hidden />
            Marque o que você já tem em mãos. A lista muda conforme suas respostas.
          </p>
        </aside>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------

function Passos({
  atual,
  habilitado,
  onIr,
}: {
  atual: number;
  habilitado: boolean;
  onIr: (n: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Etapas do protocolo">
      {PASSOS.map((nome, i) => {
        const ativo = i === atual;
        const concluido = i < atual;
        return (
          <li key={nome}>
            <button
              type="button"
              onClick={() => (i === 0 || habilitado) && onIr(i)}
              disabled={i > 0 && !habilitado}
              aria-current={ativo ? "step" : undefined}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                ativo
                  ? "bg-primary text-primary-foreground"
                  : concluido
                    ? "bg-accent text-primary"
                    : "bg-muted text-muted-foreground hover:text-primary"
              }`}
            >
              <span className="tabular-nums">{i + 1}.</span> {nome}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function PassoAto({ ato, onEscolher }: { ato: AtoId | null; onEscolher: (a: AtoId) => void }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg text-secondary">Que ato você precisa?</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Não tem certeza? Escolha o mais próximo — o cartório confirma no atendimento.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {ATOS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onEscolher(item.id)}
            aria-pressed={ato === item.id}
            className={`rounded-sm border p-4 text-left transition-colors ${
              ato === item.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-card hover:border-primary"
            }`}
          >
            <span className="block font-display text-sm">{item.rotulo}</span>
            <span
              className={`mt-0.5 block text-xs ${
                ato === item.id ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              {item.descricao}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PassoIdentificacao(props: {
  ato: AtoId;
  apresentanteNome: string;
  setApresentanteNome: (v: string) => void;
  apresentanteTelefone: string;
  setApresentanteTelefone: (v: string) => void;
  parteNome: string;
  setParteNome: (v: string) => void;
  parteTelefone: string;
  setParteTelefone: (v: string) => void;
  escrevente: string;
  setEscrevente: (v: string) => void;
  urgente: boolean;
  setUrgente: (v: boolean) => void;
}) {
  const papel = PAPEIS[props.ato];

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg text-secondary">Seus dados</h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Precisamos saber com quem falar sobre este protocolo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={rotuloClass} htmlFor="apresNome">
            Quem está enviando <span className="text-primary">*</span>
          </label>
          <input
            id="apresNome"
            list="parceiros"
            className={inputClass}
            autoComplete="name"
            placeholder="Seu nome completo"
            value={props.apresentanteNome}
            onChange={(e) => props.setApresentanteNome(e.target.value)}
          />
          <datalist id="parceiros">
            {PARCEIROS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <div>
          <label className={rotuloClass} htmlFor="apresTel">
            Telefone / WhatsApp <span className="text-primary">*</span>
          </label>
          <input
            id="apresTel"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder="(79) 9____-____"
            value={props.apresentanteTelefone}
            onChange={(e) => props.setApresentanteTelefone(e.target.value)}
          />
        </div>

        <div>
          <label className={rotuloClass} htmlFor="parteNome">
            {papel.parte} <span className="text-primary">*</span>
          </label>
          <input
            id="parteNome"
            className={inputClass}
            placeholder="Nome completo"
            value={props.parteNome}
            onChange={(e) => props.setParteNome(e.target.value)}
          />
        </div>

        <div>
          <label className={rotuloClass} htmlFor="parteTel">
            Telefone da parte (se houver)
          </label>
          <input
            id="parteTel"
            type="tel"
            inputMode="tel"
            className={inputClass}
            placeholder="(79) 9____-____"
            value={props.parteTelefone}
            onChange={(e) => props.setParteTelefone(e.target.value)}
          />
        </div>

        <div>
          <label className={rotuloClass} htmlFor="escrevente">
            Já é atendido por alguém? (opcional)
          </label>
          <select
            id="escrevente"
            className={inputClass}
            value={props.escrevente}
            onChange={(e) => props.setEscrevente(e.target.value)}
          >
            <option value="">Não sei / primeira vez</option>
            {ESCREVENTES.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => props.setUrgente(!props.urgente)}
            aria-pressed={props.urgente}
            className={`rounded-sm border px-4 py-3 text-sm transition-colors ${
              props.urgente
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-input bg-card hover:border-primary"
            }`}
          >
            ⚑ É urgente
          </button>
        </div>
      </div>
    </section>
  );
}

function PassoDocumentos(props: {
  arquivos: ArquivoSelecionado[];
  erroArquivo: string | null;
  onAdicionar: (files: FileList) => void;
  onRemover: (id: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
}) {
  return (
    <>
      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg text-secondary">Envie os documentos que já tem</h2>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Só PDF. Isso é opcional: você pode enviar agora, depois, ou levar tudo impresso ao balcão.
          O que enviar já adianta a conferência.
        </p>

        <UploadDocumentos
          arquivos={props.arquivos}
          onAdicionar={props.onAdicionar}
          onRemover={props.onRemover}
        />

        {props.erroArquivo && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-sm border border-primary/30 bg-accent/60 px-3 py-2 text-sm text-secondary"
          >
            <AlertTriangle size={15} className="mt-0.5 flex-none text-primary" aria-hidden />
            {props.erroArquivo}
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h2 className="font-display text-lg text-secondary">Quer contar mais alguma coisa?</h2>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Combinados verbais, condições específicas, algo que não está em documento nenhum.
        </p>
        <textarea
          rows={3}
          className={`${inputClass} min-h-20 resize-y`}
          maxLength={1500}
          placeholder="Ex.: vou trazer a matrícula na sexta-feira…"
          value={props.observacoes}
          onChange={(e) => props.setObservacoes(e.target.value)}
        />
      </section>
    </>
  );
}

function PassoRevisao(props: {
  ato: AtoId;
  parteNome: string;
  itens: string[];
  emMaos: Set<string>;
  arquivos: ArquivoSelecionado[];
  aceite: boolean;
  setAceite: (v: boolean) => void;
  modoDemonstracao: boolean;
  onToken: (t: string | null) => void;
  captchaResetKey: number;
  armadilha: string;
  setArmadilha: (v: string) => void;
  erroEnvio: string | null;
  dadosPreenchidos: boolean;
}) {
  const faltando = props.itens.filter((i) => !props.emMaos.has(i));

  return (
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="font-display text-lg text-secondary">Confira antes de enviar</h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Ato:</dt>
          <dd className="font-medium text-secondary">{ATO_NOME[props.ato]}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{PAPEIS[props.ato].ra}:</dt>
          <dd className="font-medium text-secondary">{props.parteNome || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Documentos em mãos:</dt>
          <dd className="font-medium text-secondary">
            {props.itens.length - faltando.length} de {props.itens.length}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted-foreground">Arquivos anexados:</dt>
          <dd className="font-medium text-secondary">{props.arquivos.length}</dd>
        </div>
      </dl>

      {faltando.length > 0 && (
        <div className="mt-4 rounded-r-sm border-l-[3px] border-primary bg-accent/60 px-3 py-2.5">
          <p className="text-[13px] font-semibold text-secondary">
            Ainda faltam {faltando.length} documento{faltando.length > 1 ? "s" : ""}:
          </p>
          <ul className="mt-1 list-inside list-disc text-[12.5px] text-secondary/80">
            {faltando.slice(0, 5).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {faltando.length > 5 && <li>e mais {faltando.length - 5}…</li>}
          </ul>
          <p className="mt-1.5 text-[12.5px] text-secondary/80">
            Pode enviar assim mesmo — o cartório orienta o que falta.
          </p>
        </div>
      )}

      {/* Campo-armadilha: invisível para pessoas, tentador para robôs. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="site-web">Não preencha este campo</label>
        <input
          id="site-web"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={props.armadilha}
          onChange={(e) => props.setArmadilha(e.target.value)}
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[13px] text-secondary">
        <input
          type="checkbox"
          className="mt-0.5 size-4 flex-none accent-[var(--primary)]"
          checked={props.aceite}
          onChange={(e) => props.setAceite(e.target.checked)}
        />
        <span>
          Autorizo o 2º Ofício de Itabaiana a receber e guardar estes dados e documentos para
          preparar meu ato notarial, conforme a Lei Geral de Proteção de Dados.
        </span>
      </label>

      {!props.modoDemonstracao && (
        <div className="mt-5">
          <Turnstile onToken={props.onToken} resetKey={props.captchaResetKey} />
        </div>
      )}

      {props.modoDemonstracao && (
        <p className="mt-5 flex items-start gap-2 rounded-sm border border-border bg-muted px-3 py-2.5 text-[13px] text-muted-foreground">
          <AlertTriangle size={15} className="mt-0.5 flex-none text-primary" aria-hidden />
          <span>
            <strong className="text-secondary">Modo demonstração.</strong> O envio online ainda não
            foi liberado neste site — nada será enviado ao cartório.
          </span>
        </p>
      )}

      {!props.dadosPreenchidos && (
        <p className="mt-4 text-[13px] text-primary">
          Volte ao passo <strong>Seus dados</strong> e preencha nome e telefone.
        </p>
      )}

      {props.erroEnvio && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-sm border border-primary/30 bg-accent/60 px-3 py-2.5 text-sm text-secondary"
        >
          <AlertTriangle size={15} className="mt-0.5 flex-none text-primary" aria-hidden />
          {props.erroEnvio}
        </p>
      )}
    </section>
  );
}

function Navegacao(props: {
  passo: number;
  total: number;
  habilitado: boolean;
  avisoPasso?: string | null;
  motivoBloqueio?: string | null;
  podeEnviar: boolean;
  enviando: boolean;
  progresso: { atual: number; total: number };
  onVoltar: () => void;
  onAvancar: () => void;
  onEnviar: () => void;
}) {
  const ultimo = props.passo === props.total - 1;

  return (
    <div className="mt-6">
      {props.avisoPasso && (
        <p role="alert" className="mb-3 text-[13px] text-primary">
          {props.avisoPasso}
        </p>
      )}
      {ultimo && props.motivoBloqueio && !props.enviando && (
        <p role="alert" className="mb-3 text-[13px] text-primary">
          {props.motivoBloqueio}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        {props.passo > 0 && (
          <button
            type="button"
            onClick={props.onVoltar}
            disabled={props.enviando}
            className="inline-flex items-center gap-2 rounded-sm border border-input bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary disabled:opacity-50"
          >
            <ArrowLeft size={15} aria-hidden />
            Voltar
          </button>
        )}

        {!ultimo ? (
          <button
            type="button"
            onClick={props.onAvancar}
            disabled={!props.habilitado}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuar
            <ArrowRight size={15} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={props.onEnviar}
            disabled={!props.podeEnviar || props.enviando}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.enviando ? (
              <>
                <Loader2 size={15} className="animate-spin" aria-hidden />
                {props.progresso.total > 0
                  ? `Enviando ${props.progresso.atual + 1} de ${props.progresso.total}…`
                  : "Enviando…"}
              </>
            ) : (
              <>
                <Send size={15} aria-hidden />
                Enviar protocolo
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function TelaConclusao({ conclusao }: { conclusao: Conclusao }) {
  const [copiado, setCopiado] = useState(false);

  return (
    <section className="container-tight py-16">
      <div className="mx-auto max-w-xl text-center">
        <CheckCircle2 size={44} className="mx-auto text-primary" aria-hidden />
        <h1 className="mt-4 font-display text-3xl text-secondary">
          {conclusao.demonstracao ? "Simulação concluída" : "Protocolo enviado!"}
        </h1>

        {conclusao.demonstracao ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Esta é uma demonstração — nada foi enviado ao cartório. Assim que o envio online for
            liberado, você receberá um código como o abaixo.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Recebemos sua solicitação. Guarde o código abaixo: é por ele que o cartório identifica
            seu envio e é ele que você informa ao consultar o andamento. Assim que uma escrevente
            conferir os documentos, você recebe o número oficial do protocolo.
          </p>
        )}

        <div className="mt-6 rounded-lg border-t-4 border-primary bg-secondary px-6 py-6 text-secondary-foreground">
          <p className="text-[11px] uppercase tracking-[0.16em] text-secondary-foreground/65">
            Seu código
          </p>
          <p className="mt-1.5 font-display text-3xl tracking-wider">{conclusao.codigo}</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(conclusao.codigo);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-sm border border-white/25 px-3 py-1.5 text-xs transition-colors hover:border-white/60"
          >
            <Copy size={13} aria-hidden />
            {copiado ? "Copiado!" : "Copiar código"}
          </button>
        </div>

        {conclusao.anexosEnviados > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {conclusao.anexosEnviados} arquivo{conclusao.anexosEnviados > 1 ? "s" : ""} enviado
            {conclusao.anexosEnviados > 1 ? "s" : ""} com sucesso.
          </p>
        )}

        {conclusao.anexosFalhos.length > 0 && (
          <div className="mt-4 rounded-sm border border-primary/30 bg-accent/60 px-4 py-3 text-left text-[13px] text-secondary">
            <p className="font-semibold">
              Sua solicitação foi registrada, mas {conclusao.anexosFalhos.length} arquivo
              {conclusao.anexosFalhos.length > 1 ? "s" : ""} não subiu:
            </p>
            <ul className="mt-1 list-inside list-disc">
              {conclusao.anexosFalhos.map((nome) => (
                <li key={nome}>{nome}</li>
              ))}
            </ul>
            <p className="mt-1.5">Leve esses documentos ao balcão ou envie pelo WhatsApp.</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/acompanhar"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-soft"
          >
            Acompanhar
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-input bg-card px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-primary"
          >
            <MessageCircle size={15} aria-hidden />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
