type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, description, align = "left" }: Props) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <div className="mb-3 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <span className="h-px w-8 bg-primary" />
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl leading-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
