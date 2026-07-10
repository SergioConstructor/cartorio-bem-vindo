import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Menu, MessageCircle, Phone, X } from "lucide-react";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/acompanhar", label: "Acompanhar" },
  { to: "/sobre", label: "Sobre" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
] as const;

const linkBase =
  "relative py-1 text-sm font-medium tracking-wide text-secondary/80 transition-colors hover:text-primary " +
  "after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      {/* Barra institucional */}
      <div className="navy-gradient hidden text-secondary-foreground md:block">
        <div className="container-tight flex h-9 items-center justify-between text-[12px]">
          <div className="flex items-center gap-6 text-secondary-foreground/75">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={13} className="text-gold" aria-hidden />
              Av. Ivo de Carvalho, 441 — Centro, Itabaiana/SE
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} className="text-gold" aria-hidden />
              Segunda a sexta · 08h às 16h
            </span>
          </div>
          <a
            href="tel:+5579999760702"
            className="inline-flex items-center gap-1.5 font-semibold text-secondary-foreground/90 transition-colors hover:text-gold"
          >
            <Phone size={13} className="text-gold" aria-hidden />
            (79) 99976-0702
          </a>
        </div>
      </div>

      <div className="container-tight flex h-20 items-center justify-between">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkBase}
              activeProps={{ className: "text-primary after:scale-x-100" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://wa.me/5579999760702"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground shadow-sm transition-colors hover:bg-primary-soft"
          >
            <MessageCircle size={15} aria-hidden />
            Fale conosco
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-secondary"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div
          id="menu-mobile"
          className="animate-in fade-in slide-in-from-top-2 border-t border-border/70 bg-background duration-200 md:hidden"
        >
          <nav className="container-tight flex flex-col py-4" aria-label="Navegação principal">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/40 py-3 text-sm font-medium text-secondary/80"
                activeProps={{ className: "text-primary" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-gold" aria-hidden />
                Segunda a sexta · 08h às 16h
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} className="text-gold" aria-hidden />
                Av. Ivo de Carvalho, 441 — Centro
              </span>
            </div>
            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider text-primary-foreground"
            >
              <MessageCircle size={15} aria-hidden />
              Fale conosco
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
