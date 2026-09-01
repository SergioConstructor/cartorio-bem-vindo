import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { getServerConfig, getUploadSecret } from "../config.server";
import {
  normalizarNome,
  QUADRO_FLUXO_RE,
  trelloAnexar,
  trelloGet,
  TrelloError,
  trelloWriteJson,
} from "../trello.server";
import { verificarTurnstile } from "../turnstile.server";
import {
  gerarCodigo,
  itensDossie,
  tituloCartao,
  visivel,
  type Respostas,
} from "../protocolo/dossie";
import { criarUploadToken, lerUploadToken } from "../protocolo/upload-token";
import { sanearMarkdown, sanearTelefone, sanearTexto } from "../protocolo/texto";
import {
  MAX_ARQUIVOS,
  MAX_BYTES_ARQUIVO,
  sanearNomeArquivo,
  validarArquivo,
} from "../protocolo/arquivo";
import { ATO_NOME, PAPEIS, type AtoId } from "../../content/protocolo/atos";
import { perguntasDoAto } from "../../content/protocolo/triagem";

// Protocolo online: cria no Trello a solicitação enviada pelo cliente e recebe
// os PDFs anexados.
//
// Diferente de /acompanhar (só leitura), esta é uma superfície pública de
// ESCRITA. As proteções, na ordem em que rodam:
//   1. heurísticas baratas (campo-armadilha, tempo mínimo de preenchimento)
//   2. Cloudflare Turnstile — obrigatório, e ANTES de consumir qualquer cota,
//      para que um robô sem captcha não consiga esgotar o teto do dia
//   3. limite por IP e teto diário global
//   4. formato conferido por assinatura de arquivo, não por extensão
//   5. token HMAC de curta duração no lugar do id do cartão, e o número de
//      anexos conferido no PRÓPRIO cartão (fonte de verdade), não no token
//
// O cartão nasce como cópia do cartão-modelo do ato: herda a checklist do
// modelo e a descrição padrão é preservada acima do bloco do envio.

const NOME_LISTA_ENTRADA_PADRAO = "Pré-protocolo (site)";
const MIN_SEGUNDOS_PREENCHIMENTO = 10;
const MAX_CARACTERES_DESC = 12_000;
// A varredura do quadro é a chamada mais pesada: merece mais fôlego que as
// demais, mesmo já pedindo só os campos mínimos.
const DESCOBERTA_TIMEOUT_MS = 20_000;

export type ResultadoEnvio =
  | { status: "ok"; codigo: string; uploadToken: string | null; maxArquivos: number }
  | { status: "demonstracao"; codigo: string }
  | { status: "captcha" }
  | { status: "limite" }
  | { status: "config_pendente" }
  // Token do Trello sem permissão de escrita (ou expirado): retentar não
  // adianta, é configuração. Merece mensagem própria, não "tente de novo".
  | { status: "sem_permissao" }
  | { status: "erro" };

export type ResultadoAnexo =
  | { status: "ok"; nome: string }
  | { status: "recusado"; motivo: string }
  | { status: "expirado" }
  | { status: "limite" }
  | { status: "erro" };

/** Modo de operação da página, decidido pelo SERVIDOR (o cliente só reflete). */
export type ModoPagina = "ativo" | "demonstracao";

// ---------------------------------------------------------------------------
// Limites da superfície pública
// ---------------------------------------------------------------------------

// Em memória, por instância: no serverless há várias instâncias em paralelo,
// então isto é a SEGUNDA linha de defesa (o Turnstile é a primeira). Para um
// limite realmente durável, trocar por Upstash/Vercel KV.
const JANELA_MS = 10 * 60 * 1000;
const MAX_ENVIOS_POR_IP = 5;
const MAX_ANEXOS_POR_IP = 60;
const MAX_ENVIOS_POR_DIA = 200;

const porIp = new Map<string, { envios: number[]; anexos: number[] }>();
let diaAtual = "";
let enviosNoDia = 0;

function registrar(ip: string, tipo: "envios" | "anexos", maximo: number): boolean {
  const agora = Date.now();
  // Descarta só os registros já vencidos — limpar o mapa inteiro zeraria o
  // limite de todo mundo e daria ao atacante um jeito barato de se livrar dele.
  if (porIp.size > 5000) {
    for (const [chave, registro] of porIp) {
      const vivo =
        registro.envios.some((t) => agora - t < JANELA_MS) ||
        registro.anexos.some((t) => agora - t < JANELA_MS);
      if (!vivo) porIp.delete(chave);
    }
  }

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
  // Dia no fuso do cartório: virar a contagem às 21h locais (meia-noite UTC)
  // deixaria o expediente seguinte refém do teto queimado na véspera.
  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "America/Maceio" });
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

type Modelo = { id: string };

type Estrutura = {
  listaEntradaId: string;
  modelosPorAto: Record<string, Modelo>;
  campos: TrelloCampo[];
};

const CACHE_MS = 5 * 60 * 1000;
let estruturaCache: { valor: Estrutura; expiraEm: number } | null = null;

/** Acha o quadro "00. …" e, dentro dele, a lista de entrada, os modelos e os campos. */
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
  //
  // Este quadro acumula MILHARES de cartões (passa de 2.500), cada um com uma
  // descrição longa. Pedir "todos os cartões com desc" devolvia megabytes e
  // estourava o tempo limite, derrubando o envio inteiro. Duas medidas:
  //   - só os campos mínimos e só cartões abertos (modelo nunca é arquivado);
  //   - a descrição do modelo é buscada depois, sob demanda, só a do ato usado.
  const modelosPorAto: Record<string, Modelo> = {};
  try {
    const cartoes = await trelloGet<TrelloCartao[]>(
      `/boards/${quadro.id}/cards`,
      { fields: "name,isTemplate", filter: "open" },
      DESCOBERTA_TIMEOUT_MS,
    );
    for (const cartao of cartoes) {
      if (!cartao.isTemplate) continue;
      const ato = /^\s*prot\.?\s*\(([^)]+)\)/i.exec(cartao.name)?.[1];
      if (!ato) continue;
      const chave = normalizarNome(ato);
      if (!(chave in modelosPorAto)) modelosPorAto[chave] = { id: cartao.id };
    }
  } catch (erro) {
    // Sem os modelos o cartão ainda é criado — só não herda a checklist.
    // Perder a solicitação do cliente por causa disso seria bem pior.
    console.error("Não foi possível ler os cartões-modelo do quadro:", erro);
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
    // Este endpoint é exceção na API do Trello: exige corpo JSON com o valor
    // aninhado, e não um parâmetro de query.
    await trelloWriteJson(
      `/cards/${cardId}/customField/${campo.id}/item`,
      { value: { text: valor.slice(0, 200) } },
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
  const texto = (valor: string) => sanearMarkdown(valor, "resposta");

  const linhas: string[] = [
    "---",
    "",
    `## 🌐 ENVIADO PELO SITE — ${codigo}`,
    "",
    `**Recebido em:** ${agora}`,
    `**Ato declarado:** ${ATO_NOME[dados.ato]}`,
    `**Apresentante:** ${texto(dados.apresentanteNome)} — ${dados.apresentanteTelefone}`,
    `**${P.ra}:** ${texto(dados.parteNome)}${
      dados.parteTelefone ? ` — ${dados.parteTelefone}` : ""
    }`,
    `**Autorização LGPD:** aceita pelo cliente em ${agora}`,
  ];

  if (dados.escrevente) {
    linhas.push(`**Escrevente indicado pelo cliente:** ${texto(dados.escrevente)}`);
  }
  if (dados.urgente) linhas.push("**⚑ Marcado como urgente pelo cliente**");

  linhas.push(
    "",
    "> ⚠️ **Respostas declaradas pelo cliente — conferir no atendimento.**",
    "> Nada aqui foi validado pelo cartório.",
    "",
    "### Triagem declarada",
    "",
  );

  // Só as perguntas que estavam VISÍVEIS para o cliente: uma resposta órfã
  // (de pergunta que sumiu quando ele mudou outra) contradiria o cartão.
  let respondidas = 0;
  for (const pergunta of perguntasDoAto(dados.ato)) {
    if (!visivel(pergunta, dados.respostas)) continue;
    const resposta = dados.respostas[pergunta.id];
    if (!resposta) continue;
    const valor = Array.isArray(resposta) ? resposta.join(", ") : resposta;
    linhas.push(`- **${pergunta.titulo}** ${texto(valor)}`);
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
    linhas.push(
      "",
      "### Observações do cliente",
      "",
      sanearMarkdown(dados.observacoes, "observacoes"),
    );
  }

  return linhas.join("\n");
}

// ---------------------------------------------------------------------------
// Estado da configuração (o cliente pergunta ao servidor, não adivinha)
// ---------------------------------------------------------------------------

export const obterModoProtocolo = createServerFn({ method: "GET" }).handler(
  async (): Promise<ModoPagina> => {
    const { trelloApiKey, trelloApiToken, turnstileSecretKey } = getServerConfig();
    return trelloApiKey && trelloApiToken && turnstileSecretKey ? "ativo" : "demonstracao";
  },
);

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
  // Teto de chaves: sem isso, um payload com milhares de respostas inflaria a
  // descrição do cartão e a requisição ao Trello.
  respostas: z
    .record(
      z.string().max(60),
      z.union([z.string().max(200), z.array(z.string().max(200)).max(20)]),
    )
    .refine((r) => Object.keys(r).length <= 60, "Triagem inválida."),
  documentosEmMaos: z.array(z.string().max(200)).max(80).optional().default([]),
  observacoes: z.string().trim().max(1500).optional().default(""),
  quantidadeArquivos: z.number().int().min(0).max(MAX_ARQUIVOS).optional().default(0),
  // O aceite da LGPD é condição do tratamento dos dados: exigido no servidor,
  // não só no navegador.
  aceiteLgpd: z.literal(true),
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

    // Armadilhas silenciosas: respondemos com "limite" para não ensinar o robô.
    if (data.armadilha.trim() !== "" || data.duracaoMs < MIN_SEGUNDOS_PREENCHIMENTO * 1000) {
      console.warn("Envio bloqueado por heurística anti-robô.");
      return { status: "limite" };
    }

    const ip = ipDoCliente();

    // O captcha vem ANTES de consumir cota: se as cotas fossem debitadas
    // primeiro, bastaria um robô sem captcha nenhum para esgotar o teto do dia
    // e derrubar o formulário para os clientes de verdade.
    if (!data.captchaToken || !(await verificarTurnstile(data.captchaToken, ip))) {
      return { status: "captcha" };
    }

    if (!registrar(ip, "envios", MAX_ENVIOS_POR_IP) || !dentroDoTetoDiario()) {
      return { status: "limite" };
    }

    // As respostas seguem CRUAS para a lógica: o dossiê e a visibilidade
    // comparam com os valores literais de triagem.ts, e sanear antes quebraria
    // esse casamento (parênteses viram "\(", nada bate, documentos somem).
    const dados: EnvioValidado = {
      ato: data.ato,
      apresentanteNome: sanearTexto(data.apresentanteNome, "nome"),
      apresentanteTelefone: sanearTelefone(data.apresentanteTelefone),
      parteNome: sanearTexto(data.parteNome, "nome"),
      parteTelefone: sanearTelefone(data.parteTelefone),
      escrevente: sanearTexto(data.escrevente, "nome"),
      urgente: data.urgente,
      respostas: data.respostas,
      documentosEmMaos: [],
      observacoes: sanearTexto(data.observacoes, "observacoes"),
    };

    try {
      const estrutura = await obterEstrutura();
      if (!estrutura) return { status: "config_pendente" };

      const codigo = gerarCodigo();
      // O dossiê é recalculado no servidor: a lista que veio do cliente serve
      // só para sabermos o que ele marcou.
      const itens = itensDossie(dados.ato, dados.respostas);
      const marcados = new Set(data.documentosEmMaos);
      dados.documentosEmMaos = itens.filter((item) => marcados.has(item));

      const modelo = estrutura.modelosPorAto[normalizarNome(dados.ato)];

      // Preservamos a descrição do modelo acima do bloco do envio: o `desc`
      // explícito do POST substituiria a descrição herdada de idCardSource.
      // Buscamos só a do modelo deste ato — varrer o quadro inteiro atrás de
      // todas as descrições era o que estourava o tempo limite.
      const descModelo = modelo
        ? await trelloGet<{ desc?: string }>(`/cards/${modelo.id}`, { fields: "desc" })
            .then((c) => c.desc ?? "")
            .catch((erro) => {
              console.error("Não foi possível ler a descrição do modelo:", erro);
              return "";
            })
        : "";

      const bloco = blocoDoEnvio(dados, codigo, itens);
      const desc = (descModelo ? `${descModelo}\n\n${bloco}` : bloco).slice(0, MAX_CARACTERES_DESC);

      // Corpo JSON, não query string: a descrição carrega o formulário do
      // modelo e passa de 3 KB — na URL isso se aproxima do limite de tamanho
      // da linha de requisição.
      const cartao = await trelloWriteJson<{ id: string }>(
        "/cards",
        {
          idList: estrutura.listaEntradaId,
          name: tituloCartao(dados.ato, codigo, dados.parteNome),
          desc,
          pos: "top",
          ...(modelo ? { idCardSource: modelo.id, keepFromSource: "checklists,labels" } : {}),
        },
        "POST",
      );

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
      if (erro instanceof TrelloError && erro.semPermissao) {
        console.error(
          "O token do Trello não tem permissão de ESCRITA. Gere outro com " +
            "scope=read,write e atualize TRELLO_API_TOKEN na Vercel.",
        );
        return { status: "sem_permissao" };
      }
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
    const tamanhoDeclarado = Number(data.get("tamanho"));

    if (typeof token !== "string" || !(arquivo instanceof File)) {
      return { status: "recusado", motivo: "Envio inválido." };
    }

    const conteudo = await lerUploadToken(token, segredo);
    if (!conteudo) return { status: "expirado" };

    const ip = ipDoCliente();
    if (!registrar(ip, "anexos", MAX_ANEXOS_POR_IP)) return { status: "limite" };

    // Recusa pelo tamanho anunciado antes de ler os bytes para a memória.
    if (arquivo.size > MAX_BYTES_ARQUIVO) {
      return { status: "recusado", motivo: "Cada arquivo pode ter no máximo 4 MB." };
    }

    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const validacao = validarArquivo(
      bytes,
      Number.isFinite(tamanhoDeclarado) ? tamanhoDeclarado : undefined,
    );
    if (!validacao.ok) return { status: "recusado", motivo: validacao.motivo };

    // Nome e Content-Type saem do formato REALMENTE detectado, não do que o
    // navegador declarou.
    const nome = sanearNomeArquivo(arquivo.name, 0, validacao.tipo.extensao);

    try {
      // Quantos anexos o cartão JÁ tem é a única fonte de verdade confiável: o
      // token diz quantos foram autorizados, mas ele é sem estado e poderia ser
      // reapresentado à vontade dentro da validade.
      const existentes = await trelloGet<{ id: string }[]>(`/cards/${conteudo.c}/attachments`, {
        fields: "id",
      });
      if (existentes.length >= Math.min(conteudo.n, MAX_ARQUIVOS)) {
        return { status: "limite" };
      }

      await trelloAnexar(conteudo.c, { nome, bytes, tipo: validacao.tipo.mime });
      return { status: "ok", nome };
    } catch (erro) {
      console.error("Erro ao anexar documento:", erro);
      return { status: "erro" };
    }
  });
