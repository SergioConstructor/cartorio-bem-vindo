import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { getServerConfig, getUploadSecret } from "../config.server";
import {
  normalizarNome,
  QUADRO_FLUXO_RE,
  trelloAnexar,
  trelloGet,
  trelloWrite,
} from "../trello.server";
import { verificarTurnstile } from "../turnstile.server";
import { gerarCodigo, itensDossie, tituloCartao, type Respostas } from "../protocolo/dossie";
import { criarUploadToken, lerUploadToken } from "../protocolo/upload-token";
import { sanearTelefone, sanearTexto } from "../protocolo/texto";
import {
  MAX_ARQUIVOS,
  MAX_BYTES_ARQUIVO,
  sanearNomeArquivo,
  validarPdf,
} from "../protocolo/arquivo";
import { ATO_NOME, PAPEIS, type AtoId } from "../../content/protocolo/atos";
import { perguntasDoAto } from "../../content/protocolo/triagem";

// Protocolo online: cria no Trello a solicitação enviada pelo cliente e recebe
// os PDFs anexados.
//
// Diferente de /acompanhar (só leitura), esta é uma superfície pública de
// ESCRITA. As proteções, da borda para dentro:
//   1. Cloudflare Turnstile (obrigatório — sem ele nada é criado)
//   2. limite por IP e teto diário global
//   3. tempo mínimo de preenchimento e campo-armadilha
//   4. PDF conferido por assinatura de arquivo, não por extensão
//   5. token HMAC de curta duração no lugar do id do cartão
//
// O cartão nasce como cópia do cartão-modelo do ato — herda a checklist e a
// descrição padrão que o cartório mantém no próprio Trello.

const NOME_LISTA_ENTRADA_PADRAO = "Pré-protocolo (site)";
const MIN_SEGUNDOS_PREENCHIMENTO = 10;

export type ResultadoEnvio =
  | { status: "ok"; codigo: string; uploadToken: string | null; maxArquivos: number }
  | { status: "demonstracao"; codigo: string }
  | { status: "captcha" }
  | { status: "limite" }
  | { status: "config_pendente" }
  | { status: "erro" };

export type ResultadoAnexo =
  | { status: "ok"; nome: string }
  | { status: "recusado"; motivo: string }
  | { status: "expirado" }
  | { status: "limite" }
  | { status: "erro" };

// ---------------------------------------------------------------------------
// Limites da superfície pública
// ---------------------------------------------------------------------------

// Em memória, por instância: no serverless há várias instâncias em paralelo,
// então isto é a SEGUNDA linha de defesa (o Turnstile é a primeira). Para um
// limite realmente durável, trocar por Upstash/Vercel KV.
const JANELA_MS = 10 * 60 * 1000;
const MAX_ENVIOS_POR_IP = 5;
const MAX_ANEXOS_POR_IP = 30;
const MAX_ENVIOS_POR_DIA = 200;

const porIp = new Map<string, { envios: number[]; anexos: number[] }>();
let diaAtual = "";
let enviosNoDia = 0;

function registrar(ip: string, tipo: "envios" | "anexos", maximo: number): boolean {
  const agora = Date.now();
  if (porIp.size > 5000) porIp.clear();

  const registro = porIp.get(ip) ?? { envios: [], anexos: [] };
  const recentes = registro[tipo].filter((t) => agora - t < JANELA_MS);
  if (recentes.length >= maximo) {
    registro[tipo] = recentes;
    porIp.set(ip, registro);
    return false;
  }
  recentes.push(agora);
  registro[tipo] = recentes;
  porIp.set(ip, registro);
  return true;
}

function dentroDoTetoDiario(): boolean {
  const hoje = new Date().toISOString().slice(0, 10);
  if (hoje !== diaAtual) {
    diaAtual = hoje;
    enviosNoDia = 0;
  }
  enviosNoDia += 1;
  return enviosNoDia <= MAX_ENVIOS_POR_DIA;
}

function ipDoCliente(): string {
  try {
    const cabecalhos = getRequest().headers;
    const encaminhado = cabecalhos.get("x-forwarded-for");
    if (encaminhado) return encaminhado.split(",")[0].trim();
    return cabecalhos.get("x-real-ip") ?? "desconhecido";
  } catch {
    return "desconhecido";
  }
}

// ---------------------------------------------------------------------------
// Descoberta da estrutura do Trello (com cache curto)
// ---------------------------------------------------------------------------

type TrelloQuadro = { id: string; name: string };
type TrelloLista = { id: string; name: string };
type TrelloCartao = { id: string; name: string; isTemplate?: boolean };
type TrelloCampo = { id: string; name: string; type: string };

type Estrutura = {
  listaEntradaId: string;
  modelosPorAto: Record<string, string>;
  campos: TrelloCampo[];
};

const CACHE_MS = 5 * 60 * 1000;
let estruturaCache: { valor: Estrutura; expiraEm: number } | null = null;

/** Acha o quadro "00. …" e, dentro dele, a lista de entrada, os cartões-modelo e os campos. */
async function obterEstrutura(): Promise<Estrutura | null> {
  if (estruturaCache && estruturaCache.expiraEm > Date.now()) return estruturaCache.valor;

  const quadros = await trelloGet<TrelloQuadro[]>("/members/me/boards", {
    fields: "name",
    filter: "open",
  });
  const quadro = quadros.find(
    (q) => QUADRO_FLUXO_RE.test(q.name) && normalizarNome(q.name).startsWith("00"),
  );
  if (!quadro) return null;

  const { trelloIntakeList } = getServerConfig();
  const nomeDesejado = normalizarNome(trelloIntakeList || NOME_LISTA_ENTRADA_PADRAO);

  const listas = await trelloGet<TrelloLista[]>(`/boards/${quadro.id}/lists`, { fields: "name" });
  const listaEntrada = listas.find((l) => normalizarNome(l.name) === nomeDesejado);
  if (!listaEntrada) {
    console.error(
      `Lista de entrada "${trelloIntakeList || NOME_LISTA_ENTRADA_PADRAO}" não existe no quadro ${quadro.name}`,
    );
    return null;
  }

  // Cartões-modelo: o cartório mantém um por ato, nomeado "Prot. (CV-Urbano) -".
  const cartoes = await trelloGet<TrelloCartao[]>(`/boards/${quadro.id}/cards`, {
    fields: "name,isTemplate",
    filter: "all",
  });
  const modelosPorAto: Record<string, string> = {};
  for (const cartao of cartoes) {
    if (!cartao.isTemplate) continue;
    const ato = /^\s*prot\.?\s*\(([^)]+)\)/i.exec(cartao.name)?.[1];
    if (!ato) continue;
    const chave = normalizarNome(ato);
    if (!(chave in modelosPorAto)) modelosPorAto[chave] = cartao.id;
  }

  const campos = await trelloGet<TrelloCampo[]>(`/boards/${quadro.id}/customFields`, {}).catch(
    () => [] as TrelloCampo[],
  );

  const valor: Estrutura = { listaEntradaId: listaEntrada.id, modelosPorAto, campos };
  estruturaCache = { valor, expiraEm: Date.now() + CACHE_MS };
  return valor;
}

async function preencherCampo(
  cardId: string,
  campos: TrelloCampo[],
  nomeCampo: string,
  valor: string,
): Promise<void> {
  const alvo = normalizarNome(nomeCampo);
  const campo = campos.find((c) => normalizarNome(c.name) === alvo);
  if (!campo || campo.type !== "text") return;
  try {
    await trelloWrite(
      `/cards/${cardId}/customField/${campo.id}/item`,
      { value: JSON.stringify({ text: valor.slice(0, 200) }) },
      "PUT",
    );
  } catch (erro) {
    // Campo personalizado é conveniência: se falhar, o dado já está na descrição.
    console.error(`Não foi possível preencher o campo "${nomeCampo}":`, erro);
  }
}

// ---------------------------------------------------------------------------
// Descrição do cartão
// ---------------------------------------------------------------------------

function blocoDoEnvio(dados: EnvioValidado, codigo: string, itens: string[]): string {
  const P = PAPEIS[dados.ato];
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Maceio" });

  const linhas: string[] = [
    "---",
    "",
    `## 🌐 ENVIADO PELO SITE — ${codigo}`,
    "",
    `**Recebido em:** ${agora}`,
    `**Ato declarado:** ${ATO_NOME[dados.ato]}`,
    `**Apresentante:** ${dados.apresentanteNome} — ${dados.apresentanteTelefone}`,
    `**${P.ra}:** ${dados.parteNome}${dados.parteTelefone ? ` — ${dados.parteTelefone}` : ""}`,
  ];

  if (dados.escrevente) linhas.push(`**Escrevente indicado pelo cliente:** ${dados.escrevente}`);
  if (dados.urgente) linhas.push("**⚑ Marcado como urgente pelo cliente**");

  linhas.push(
    "",
    "> ⚠️ **Respostas declaradas pelo cliente — conferir no atendimento.**",
    "> Nada aqui foi validado pelo cartório.",
    "",
    "### Triagem declarada",
    "",
  );

  const perguntas = perguntasDoAto(dados.ato);
  let respondidas = 0;
  for (const pergunta of perguntas) {
    const resposta = dados.respostas[pergunta.id];
    if (!resposta) continue;
    const texto = Array.isArray(resposta) ? resposta.join(", ") : resposta;
    linhas.push(`- **${pergunta.titulo}** ${texto}`);
    respondidas += 1;
  }
  if (respondidas === 0) linhas.push("_O cliente não respondeu nenhuma pergunta da triagem._");

  linhas.push("", "### Documentos", "");
  for (const item of itens) {
    const temEmMaos = dados.documentosEmMaos.includes(item);
    linhas.push(`- [${temEmMaos ? "x" : " "}] ${item}`);
  }
  linhas.push(
    "",
    `_${dados.documentosEmMaos.length} de ${itens.length} marcados como já obtidos pelo cliente._`,
  );

  if (dados.observacoes) {
    linhas.push("", "### Observações do cliente", "", dados.observacoes);
  }

  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// Envio do formulário
// ---------------------------------------------------------------------------

const atoSchema = z.enum(["CV-Urbano", "CV-Rural", "CDP", "CDH", "DOA", "TEST"]);

const envioSchema = z.object({
  ato: atoSchema,
  apresentanteNome: z.string().trim().min(3, "Informe quem está enviando.").max(120),
  apresentanteTelefone: z.string().trim().min(8, "Informe um telefone para contato.").max(30),
  parteNome: z.string().trim().min(3, "Informe o nome da parte.").max(120),
  parteTelefone: z.string().trim().max(30).optional().default(""),
  escrevente: z.string().trim().max(40).optional().default(""),
  urgente: z.boolean().optional().default(false),
  respostas: z.record(
    z.string(),
    z.union([z.string().max(200), z.array(z.string().max(200)).max(20)]),
  ),
  documentosEmMaos: z.array(z.string().max(200)).max(80).optional().default([]),
  observacoes: z.string().trim().max(1500).optional().default(""),
  quantidadeArquivos: z.number().int().min(0).max(MAX_ARQUIVOS).optional().default(0),
  captchaToken: z.string().max(4000).optional().default(""),
  // Campo-armadilha: fica escondido no formulário; humano nunca preenche.
  armadilha: z.string().max(200).optional().default(""),
  // Milissegundos desde que a página abriu — robô responde rápido demais.
  duracaoMs: z.number().int().min(0).max(86_400_000).optional().default(0),
});

type EnvioValidado = {
  ato: AtoId;
  apresentanteNome: string;
  apresentanteTelefone: string;
  parteNome: string;
  parteTelefone: string;
  escrevente: string;
  urgente: boolean;
  respostas: Respostas;
  documentosEmMaos: string[];
  observacoes: string;
};

export const enviarProtocolo = createServerFn({ method: "POST" })
  .inputValidator(envioSchema)
  .handler(async ({ data }): Promise<ResultadoEnvio> => {
    const { trelloApiKey, trelloApiToken, turnstileSecretKey } = getServerConfig();

    // Sem credenciais do Trello OU sem captcha configurado, a página inteira
    // fica em demonstração — nunca aceitamos envio com o portão desligado.
    if (!trelloApiKey || !trelloApiToken || !turnstileSecretKey) {
      return { status: "demonstracao", codigo: gerarCodigo() };
    }

    // Armadilhas silenciosas: respondemos "ok" falso para não ensinar o robô.
    if (data.armadilha.trim() !== "" || data.duracaoMs < MIN_SEGUNDOS_PREENCHIMENTO * 1000) {
      console.warn("Envio bloqueado por heurística anti-robô.");
      return { status: "limite" };
    }

    const ip = ipDoCliente();
    if (!registrar(ip, "envios", MAX_ENVIOS_POR_IP) || !dentroDoTetoDiario()) {
      return { status: "limite" };
    }

    if (!data.captchaToken || !(await verificarTurnstile(data.captchaToken, ip))) {
      return { status: "captcha" };
    }

    const dados: EnvioValidado = {
      ato: data.ato,
      apresentanteNome: sanearTexto(data.apresentanteNome, "nome"),
      apresentanteTelefone: sanearTelefone(data.apresentanteTelefone),
      parteNome: sanearTexto(data.parteNome, "nome"),
      parteTelefone: sanearTelefone(data.parteTelefone),
      escrevente: sanearTexto(data.escrevente, "nome"),
      urgente: data.urgente,
      respostas: Object.fromEntries(
        Object.entries(data.respostas).map(([chave, valor]) => [
          chave,
          Array.isArray(valor)
            ? valor.map((v) => sanearTexto(v, "resposta"))
            : sanearTexto(valor, "resposta"),
        ]),
      ),
      documentosEmMaos: data.documentosEmMaos.map((d) => sanearTexto(d, "resposta")),
      observacoes: sanearTexto(data.observacoes, "observacoes"),
    };

    try {
      const estrutura = await obterEstrutura();
      if (!estrutura) return { status: "config_pendente" };

      const codigo = gerarCodigo();
      // Recalculamos o dossiê no servidor: a lista que o cliente mandou é só
      // para sabermos o que ele marcou, nunca a fonte da verdade.
      const itens = itensDossie(dados.ato, dados.respostas);
      const marcados = new Set(dados.documentosEmMaos);
      dados.documentosEmMaos = itens.filter((item) => marcados.has(sanearTexto(item, "resposta")));

      const modeloId = estrutura.modelosPorAto[normalizarNome(dados.ato)];

      const cartao = await trelloWrite<{ id: string }>("/cards", {
        idList: estrutura.listaEntradaId,
        name: tituloCartao(dados.ato, codigo, dados.parteNome),
        desc: blocoDoEnvio(dados, codigo, itens).slice(0, 16_000),
        pos: "top",
        ...(modeloId ? { idCardSource: modeloId, keepFromSource: "checklists,labels" } : {}),
      });

      await preencherCampo(cartao.id, estrutura.campos, "Apresentante", dados.apresentanteNome);
      await preencherCampo(
        cartao.id,
        estrutura.campos,
        "Telefone/WhatsApp",
        dados.apresentanteTelefone,
      );
      await preencherCampo(
        cartao.id,
        estrutura.campos,
        "Data do Protocolo",
        new Date().toLocaleDateString("pt-BR", { timeZone: "America/Maceio" }),
      );

      const segredo = getUploadSecret();
      const uploadToken =
        data.quantidadeArquivos > 0 && segredo
          ? await criarUploadToken(cartao.id, data.quantidadeArquivos, segredo)
          : null;

      return { status: "ok", codigo, uploadToken, maxArquivos: data.quantidadeArquivos };
    } catch (erro) {
      console.error("Erro ao criar a solicitação de protocolo:", erro);
      return { status: "erro" };
    }
  });

// ---------------------------------------------------------------------------
// Anexo de PDF (um por requisição — o limite de corpo da Vercel é 4,5 MB)
// ---------------------------------------------------------------------------

export const anexarDocumento = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Envio inválido.");
    return data;
  })
  .handler(async ({ data }): Promise<ResultadoAnexo> => {
    const segredo = getUploadSecret();
    if (!segredo) return { status: "erro" };

    const token = data.get("token");
    const arquivo = data.get("arquivo");
    const indiceBruto = Number(data.get("indice") ?? 0);
    const indice = Number.isInteger(indiceBruto) && indiceBruto >= 0 ? indiceBruto : 0;

    if (typeof token !== "string" || !(arquivo instanceof File)) {
      return { status: "recusado", motivo: "Envio inválido." };
    }

    const conteudo = await lerUploadToken(token, segredo);
    if (!conteudo) return { status: "expirado" };
    if (indice >= conteudo.n || indice >= MAX_ARQUIVOS) return { status: "limite" };

    const ip = ipDoCliente();
    if (!registrar(ip, "anexos", MAX_ANEXOS_POR_IP)) return { status: "limite" };

    // Recusa pelo tamanho anunciado antes de ler os bytes para a memória.
    if (arquivo.size > MAX_BYTES_ARQUIVO) {
      return { status: "recusado", motivo: "Cada arquivo pode ter no máximo 4 MB." };
    }

    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const validacao = validarPdf(bytes, arquivo.size);
    if (!validacao.ok) return { status: "recusado", motivo: validacao.motivo };

    const nome = sanearNomeArquivo(arquivo.name, indice);

    try {
      await trelloAnexar(conteudo.c, { nome, bytes, tipo: "application/pdf" });
      return { status: "ok", nome };
    } catch (erro) {
      console.error("Erro ao anexar documento:", erro);
      return { status: "erro" };
    }
  });
