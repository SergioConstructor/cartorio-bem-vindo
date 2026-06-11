import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const nav = [
  { to: "/", label: "Início" },
  { to: "/servicos", label: "Serviços" },
  { to: "/sobre", label: "Sobre" },
  { to: "/blog", label: "Blog" },
  { to: "/contato", label: "Contato" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="container-tight flex h-20 items-center justify-between">
        <Link to="/" className="shrink-0" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium tracking-wide text-secondary/80 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://wa.me/5579999760702"
            target="_blank"
            rel="noreferrer"
            className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-soft"
          >
            Fale conosco
          </a>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden text-secondary"
          aria-label="Abrir menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-background md:hidden">
          <nav className="container-tight flex flex-col py-4">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="border-b border-border/40 py-3 text-sm font-medium text-secondary/80"
                activeProps={{ className: "text-primary" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="mt-4 rounded-sm bg-primary px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider text-primary-foreground"
            >
              Fale conosco
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
