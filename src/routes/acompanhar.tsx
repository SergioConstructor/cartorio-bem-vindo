import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Clock, Loader2, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Progress } from "@/components/ui/progress";
import { getEscrituraStatus, type TrackingResult } from "@/lib/api/tracking.functions";
import { demoStageIndex, trackingStages } from "@/content/tracking";

export const Route = createFileRoute("/acompanhar")({
  head: () => ({
    meta: [
      { title: "Acompanhar escritura — CN2O Cartório de Notas de Itabaiana" },
      {
        name: "description",
        content:
          "Acompanhe o andamento da sua escritura no 2º Ofício de Itabaiana/SE. Informe o número de protocolo e veja em qual etapa o processo está.",
      },
      { property: "og:title", content: "Acompanhar escritura — CN2O" },
      {
        property: "og:description",
        content: "Consulte pelo número de protocolo em qual etapa está a sua escritura.",
      },
      { property: "og:url", content: "/acompanhar" },
    ],
    links: [{ rel: "canonical", href: "/acompanhar" }],
  }),
  component: AcompanharPage,
});

const WHATSAPP_URL = "https://wa.me/5579999760702";

const formSchema = z.object({
  protocolo: z
    .string()
    .trim()
    .min(3, "Informe um número de protocolo válido.")
    .max(40, "Protocolo muito longo.")
    .regex(/^[\p{L}\p{N}\-/.]+$/u, "O protocolo contém caracteres inválidos."),
});
type FormValues = z.infer<typeof formSchema>;

const inputClass =
  "w-full rounded-sm border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatUpdatedAt(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(date);
}

function AcompanharPage() {
  const [lastProtocolo, setLastProtocolo] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const mutation = useMutation<TrackingResult, Error, FormValues>({
    mutationFn: (values) => getEscrituraStatus({ data: values }),
  });

  const onSubmit = (values: FormValues) => {
    setLastProtocolo(values.protocolo);
    mutation.mutate(values);
  };

  const result = mutation.data;

  return (
    <>
      <PageHero
        eyebrow="Acompanhar"
        title="Acompanhe o andamento da sua escritura"
        description="Informe o número de protocolo que você recebeu no cartório para ver em qual etapa do processo a sua escritura está. A consulta mostra apenas a etapa — nenhum dado pessoal é exibido."
      />

      <section className="container-tight py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary/70">
                Número de protocolo
              </span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  {...register("protocolo")}
                  placeholder="Ex.: 2025-00123"
                  autoComplete="off"
                  inputMode="text"
                  className={inputClass}
                  aria-invalid={errors.protocolo ? "true" : "false"}
                />
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {mutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" aria-hidden />
                  ) : (
                    <Search size={15} aria-hidden />
                  )}
                  Consultar
                </button>
              </div>
            </label>
            {errors.protocolo && (
              <p className="text-sm text-destructive">{errors.protocolo.message}</p>
            )}
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck size={13} className="text-gold" aria-hidden />
              Consulta segura: exibimos apenas a etapa do processo, sem dados pessoais.
            </p>
          </form>

          <div className="mt-10">
            {mutation.isPending && <ResultSkeleton />}

            {!mutation.isPending && mutation.isError && <ErrorState />}

            {!mutation.isPending && result && (
              <ResultView result={result} protocolo={lastProtocolo} />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ResultView({ result, protocolo }: { result: TrackingResult; protocolo: string }) {
  switch (result.status) {
    case "ok":
      return (
        <Timeline
          currentStageIndex={result.currentStageIndex}
          updatedAt={result.updatedAt}
          protocolo={protocolo}
        />
      );
    case "config_pendente":
      return (
        <Timeline currentStageIndex={demoStageIndex} updatedAt={null} protocolo={protocolo} demo />
      );
    case "nao_encontrado":
      return (
        <NoticeCard
          title="Não encontramos esse protocolo"
          description="Confira o número informado. Se estiver correto, o processo pode ainda não ter sido registrado ou já ter sido concluído. Fale com o cartório para confirmar."
        />
      );
    case "ambiguo":
      return (
        <NoticeCard
          title="Encontramos mais de um processo"
          description="Para sua segurança, não exibimos o andamento quando há mais de uma correspondência. Entre em contato com o cartório para confirmar o protocolo correto."
        />
      );
    case "erro":
    default:
      return <ErrorState />;
  }
}

function Timeline({
  currentStageIndex,
  updatedAt,
  protocolo,
  demo = false,
}: {
  currentStageIndex: number;
  updatedAt: string | null;
  protocolo: string;
  demo?: boolean;
}) {
  const total = trackingStages.length;
  const current = Math.min(Math.max(currentStageIndex, 0), total - 1);
  const percent = Math.round(((current + 1) / total) * 100);
  const formatted = formatUpdatedAt(updatedAt);

  return (
    <div className="border border-border bg-card p-6 md:p-8">
      {demo && (
        <div className="mb-6 rounded-sm border border-gold/40 bg-gold-soft/60 px-4 py-3 text-xs text-secondary/80">
          <strong className="font-semibold">Dados de demonstração.</strong> A integração com o
          Trello ainda não foi configurada, então esta é uma prévia de como o andamento será
          exibido.
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary/70">
            Protocolo {protocolo}
          </div>
          <h2 className="mt-1 font-display text-2xl text-secondary">
            {trackingStages[current].label}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          Etapa {current + 1} de {total}
        </span>
      </div>

      <Progress value={percent} className="mt-4" />

      {formatted && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={13} className="text-gold" aria-hidden />
          Última atualização: {formatted}
        </p>
      )}

      <ol className="mt-8 space-y-0">
        {trackingStages.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          const isLast = i === total - 1;
          return (
            <li key={stage.boardId} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    done && "border-gold bg-gold text-secondary",
                    active && "border-primary bg-primary text-primary-foreground",
                    !done && !active && "border-border bg-card text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden
                >
                  {done ? <Check size={15} /> : i + 1}
                </span>
                {!isLast && (
                  <span
                    className={`w-px flex-1 ${i < current ? "bg-gold" : "bg-border"}`}
                    aria-hidden
                  />
                )}
              </div>
              <div className={`pb-8 ${isLast ? "pb-0" : ""}`}>
                <div
                  className={[
                    "font-medium",
                    active && "text-primary",
                    done && "text-secondary",
                    !done && !active && "text-muted-foreground",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {stage.label}
                  {active && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      Etapa atual
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                  {stage.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 border-t border-border pt-6">
        <SectionHeading
          align="left"
          title="Dúvidas sobre o seu processo?"
          description="Nossa equipe pode dar mais detalhes sobre a etapa atual da sua escritura."
        />
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-sm border border-primary/40 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary transition-colors hover:bg-accent"
        >
          <MessageCircle size={15} aria-hidden />
          Falar com o cartório
        </a>
      </div>
    </div>
  );
}

function NoticeCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl text-secondary">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{description}</p>
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

function ErrorState() {
  return (
    <NoticeCard
      title="Não foi possível consultar agora"
      description="Tivemos um problema ao buscar o andamento. Tente novamente em instantes ou fale com o cartório pelo WhatsApp."
    />
  );
}

function ResultSkeleton() {
  return (
    <div className="border border-border bg-card p-6 md:p-8">
      <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-7 w-2/3 animate-pulse rounded bg-muted" />
      <div className="mt-5 h-2 w-full animate-pulse rounded-full bg-muted" />
      <div className="mt-8 space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
