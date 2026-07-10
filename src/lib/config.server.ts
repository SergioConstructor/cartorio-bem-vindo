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
    // Opcional: id do workspace do Trello. Se definido, o site só considera os
    // quadros desse espaço ao descobrir as etapas (evita pegar quadros de
    // outros assuntos da conta).
    trelloOrganizationId: process.env.TRELLO_ORGANIZATION_ID,
  };
}
