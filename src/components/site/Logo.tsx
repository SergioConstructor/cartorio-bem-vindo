import logoVinho from "@/assets/cn2o-logo-vinho.jpg";
import logoWhite from "@/assets/cn2o-logo-white.png";

type Props = {
  variant?: "default" | "compact";
  tone?: "dark" | "light";
  className?: string;
};

export function Logo({ variant = "default", tone = "dark", className = "" }: Props) {
  const light = tone === "light";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {light ? (
        <img
          src={logoWhite}
          alt="CN2O — Cartório de Notas 2º Ofício de Itabaiana/SE"
          className="h-12 w-12 object-contain"
          loading="eager"
        />
      ) : (
        <img
          src={logoVinho}
          alt="CN2O — Cartório de Notas 2º Ofício de Itabaiana/SE"
          className="h-12 w-12 rounded-full border-2 border-primary/20 object-cover shadow-sm transition-transform duration-300 hover:scale-105"
          loading="eager"
        />
      )}
      {variant === "default" && (
        <div className="leading-tight">
          <div
            className={`font-display text-lg font-semibold ${light ? "text-secondary-foreground" : "text-secondary"}`}
          >
            Cartório de Notas
          </div>
          <div
            className={`text-[11px] uppercase tracking-[0.18em] ${light ? "text-secondary-foreground/60" : "text-muted-foreground"}`}
          >
            2º Ofício · Itabaiana/SE
          </div>
        </div>
      )}
    </div>
  );
}
