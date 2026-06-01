import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-24 bg-secondary text-secondary-foreground">
      <div className="container-tight grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="[&_*]:!text-secondary-foreground">
            <Logo />
          </div>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-secondary-foreground/70">
            Tradição e modernidade a serviço dos cidadãos de Itabaiana e região.
            Atos notariais com fé pública, agilidade e atendimento humano.
          </p>
        </div>

        <div>
          <h4 className="!text-secondary-foreground text-sm font-semibold uppercase tracking-[0.18em]">
            Navegação
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-secondary-foreground/70">
            <li><Link to="/" className="hover:text-secondary-foreground">Início</Link></li>
            <li><Link to="/servicos" className="hover:text-secondary-foreground">Serviços</Link></li>
            <li><Link to="/sobre" className="hover:text-secondary-foreground">Sobre</Link></li>
            <li><Link to="/blog" className="hover:text-secondary-foreground">Blog</Link></li>
            <li><Link to="/contato" className="hover:text-secondary-foreground">Contato</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="!text-secondary-foreground text-sm font-semibold uppercase tracking-[0.18em]">
            Contato
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-secondary-foreground/70">
            <li className="flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary-foreground/80" />
              <span>Av. Ivo de Carvalho, 441 — Centro<br />Itabaiana/SE · CEP 49.500-064</span>
            </li>
            <li className="flex gap-2">
              <Phone size={16} className="mt-0.5 shrink-0 text-primary-foreground/80" />
              <a href="tel:+5579999440969" className="hover:text-secondary-foreground">(79) 99944-0969</a>
            </li>
            <li className="flex gap-2">
              <Mail size={16} className="mt-0.5 shrink-0 text-primary-foreground/80" />
              <a href="mailto:contato@cn2oita.com.br" className="hover:text-secondary-foreground">
                contato@cn2oita.com.br
              </a>
            </li>
            <li className="flex gap-2">
              <Clock size={16} className="mt-0.5 shrink-0 text-primary-foreground/80" />
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
