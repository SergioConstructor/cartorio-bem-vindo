import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="navy-gradient mt-24 text-secondary-foreground">
      <div className="h-1 bg-gradient-to-r from-primary via-gold to-primary-deep" aria-hidden />
      <div className="container-tight grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-5 max-w-md text-sm leading-relaxed text-secondary-foreground/70">
            Tradição e modernidade a serviço dos cidadãos de Itabaiana e região. Atos notariais com
            fé pública, agilidade e atendimento humano.
          </p>
          <a
            href="https://wa.me/5579999760702"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-sm border border-gold/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-secondary"
          >
            <MessageCircle size={14} aria-hidden />
            Falar pelo WhatsApp
          </a>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] !text-gold">Navegação</h4>
          <ul className="mt-4 space-y-2 text-sm text-secondary-foreground/70">
            <li>
              <Link to="/" className="transition-colors hover:text-secondary-foreground">
                Início
              </Link>
            </li>
            <li>
              <Link to="/servicos" className="transition-colors hover:text-secondary-foreground">
                Serviços
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="transition-colors hover:text-secondary-foreground">
                Sobre
              </Link>
            </li>
            <li>
              <Link to="/blog" className="transition-colors hover:text-secondary-foreground">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/contato" className="transition-colors hover:text-secondary-foreground">
                Contato
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] !text-gold">Contato</h4>
          <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-gold/80" aria-hidden />
              <span>
                Av. Ivo de Carvalho, 441 — Centro
                <br />
                Itabaiana/SE · CEP 49.500-064
              </span>
            </li>
            <li className="flex gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-gold/80" aria-hidden />
              <a
                href="tel:+5579999760702"
                className="transition-colors hover:text-secondary-foreground"
              >
                (79) 99976-0702
              </a>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-gold/80" aria-hidden />
              <a
                href="mailto:contato@cn2oita.com.br"
                className="transition-colors hover:text-secondary-foreground"
              >
                contato@cn2oita.com.br
              </a>
            </li>
            <li className="flex gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-gold/80" aria-hidden />
              <span>Segunda a sexta · 08h às 16h</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-secondary-foreground/10">
        <div className="container-tight flex flex-col items-center justify-between gap-2 py-6 text-xs text-secondary-foreground/50 md:flex-row">
          <span>© {new Date().getFullYear()} Cartório de Notas — 2º Ofício de Itabaiana/SE</span>
          <span>Tabelião César Bravo</span>
        </div>
      </div>
    </footer>
  );
}
