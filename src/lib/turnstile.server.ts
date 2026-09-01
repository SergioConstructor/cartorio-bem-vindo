// Verificação do Cloudflare Turnstile — o portão principal contra robôs na
// página pública de protocolo.
//
// O token do widget vale uma única vez e é validado aqui, no servidor. Sem a
// chave secreta configurada a página inteira fica em modo demonstração, então
// nunca aceitamos um envio "porque o captcha não estava ligado".

import { getServerConfig } from "./config.server";

const URL_VERIFICACAO = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 8000;

export async function verificarTurnstile(token: string, ip: string | null): Promise<boolean> {
  const { turnstileSecretKey } = getServerConfig();
  if (!turnstileSecretKey) return false;

  const corpo = new URLSearchParams({ secret: turnstileSecretKey, response: token });
  if (ip) corpo.set("remoteip", ip);

  try {
    const resposta = await fetch(URL_VERIFICACAO, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!resposta.ok) return false;
    const resultado = (await resposta.json()) as { success?: boolean };
    return resultado.success === true;
  } catch (erro) {
    console.error("Falha ao verificar o Turnstile:", erro);
    return false;
  }
}
