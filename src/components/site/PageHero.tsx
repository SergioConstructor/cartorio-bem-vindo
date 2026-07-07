import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, description, children }: Props) {
  return (
    <section className="hero-gradient relative overflow-hidden text-primary-foreground">
      <div className="topo-lines absolute inset-0 text-primary-foreground/10" aria-hidden />
      <div className="container-tight relative py-16 md:py-20">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-gold">
          <span className="h-px w-10 bg-gold/60" aria-hidden />
          {eyebrow}
        </div>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.08] text-primary-foreground md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl leading-relaxed text-primary-foreground/80">{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}
