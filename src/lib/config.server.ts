import process from "node:process";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.
//
// On Cloudflare Workers, env binds at REQUEST time. Module-scope reads
// (e.g. `const x = process.env.X`) resolve to undefined — always read
// process.env INSIDE a function or handler.
//
// When to use which env-access pattern:
//   - .server.ts module (this file): server-only helpers reused across
//     handlers. Wrap reads in a function so they run per-request.
//   - inline process.env inside a createServerFn handler: one-off reads
//     not reused elsewhere.
//   - import.meta.env.VITE_FOO: PUBLIC config readable from both client
//     and server (analytics IDs, public URLs). Define in .env with the
//     VITE_ prefix. Never put secrets here — they ship to the browser.

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV,
    // Credenciais do Trello para a página /acompanhar. São SEGREDOS: nunca use
    // o prefixo VITE_ (isso as enviaria ao navegador). Configure na Vercel em
    // Environment Variables e num .env local para desenvolvimento.
    trelloApiKey: process.env.TRELLO_API_KEY,
    trelloApiToken: process.env.TRELLO_API_TOKEN,
    // Opcional: sobrescreve o fluxo de etapas (listas do Trello) sem mexer no
    // código — ver formato em src/content/tracking.ts. Se ausente, vale o
    // fluxo padrão do cartório definido lá.
    trelloStageLists: process.env.TRELLO_STAGE_LISTS,
    // Lista do quadro "00." onde caem os envios do site. Opcional: sem ela vale
    // o nome padrão definido em protocolo.functions.ts.
    trelloIntakeList: process.env.TRELLO_INTAKE_LIST,
    // Cloudflare Turnstile — captcha da página /protocolo. Só a chave secreta
    // fica aqui; a chave pública do widget é VITE_TURNSTILE_SITE_KEY.
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    // Assina o token que autoriza anexar arquivos a um cartão recém-criado.
    // Opcional: sem ela derivamos do token do Trello (também server-only).
    protocoloUploadSecret: process.env.PROTOCOLO_UPLOAD_SECRET,
  };
}

/**
 * Segredo usado para assinar os tokens de upload. Nunca sai do servidor.
 * Sem PROTOCOLO_UPLOAD_SECRET, deriva do token do Trello — funciona sem
 * configuração extra, ao custo de invalidar os tokens em voo se o token do
 * Trello for trocado (janela de 15 minutos, aceitável).
 */
export function getUploadSecret(): string | null {
  const { protocoloUploadSecret, trelloApiToken } = getServerConfig();
  if (protocoloUploadSecret) return protocoloUploadSecret;
  return trelloApiToken ? `derivado:${trelloApiToken}` : null;
}
