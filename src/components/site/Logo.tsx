import logo from "@/assets/cn2o-logo-vinho.jpg";

type Props = {
  variant?: "default" | "compact";
  className?: string;
};

export function Logo({ variant = "default", className = "" }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logo}
        alt="CN2O — Cartório de Notas 2º Ofício de Itabaiana/SE"
        className="h-12 w-12 rounded-full border-2 border-primary/20 object-cover shadow-sm transition-transform duration-300 hover:scale-105"
        loading="eager"
      />
      {variant === "default" && (
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold text-secondary">
            Cartório de Notas
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            2º Ofício · Itabaiana/SE
          </div>
        </div>
      )}
    </div>
  );
}
