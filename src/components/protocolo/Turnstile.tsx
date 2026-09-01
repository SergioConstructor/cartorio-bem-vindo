import { useEffect, useRef } from "react";

// Widget do Cloudflare Turnstile. A chave do site é pública por natureza
// (VITE_), e a validação real acontece no servidor.
//
// Sem a chave configurada o widget não é renderizado e a página segue em modo
// demonstração — o servidor também recusa qualquer envio nessa situação.

declare global {
  interface Window {
    turnstile?: {
      render: (
        alvo: HTMLElement,
        opcoes: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          language?: string;
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

const URL_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const TURNSTILE_SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY;

function carregarScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  const existente = document.querySelector<HTMLScriptElement>(`script[src="${URL_SCRIPT}"]`);
  if (existente) {
    return new Promise((resolve) => existente.addEventListener("load", () => resolve()));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = URL_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o Turnstile"));
    document.head.appendChild(script);
  });
}

export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const alvo = useRef<HTMLDivElement>(null);
  const aoToken = useRef(onToken);
  aoToken.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !alvo.current) return;

    let widgetId: string | undefined;
    let cancelado = false;

    carregarScript()
      .then(() => {
        if (cancelado || !alvo.current || !window.turnstile) return;
        widgetId = window.turnstile.render(alvo.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: "pt-br",
          theme: "light",
          callback: (token) => aoToken.current(token),
          "expired-callback": () => aoToken.current(null),
          "error-callback": () => aoToken.current(null),
        });
      })
      .catch(() => aoToken.current(null));

    return () => {
      cancelado = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={alvo} className="flex justify-center" />;
}
