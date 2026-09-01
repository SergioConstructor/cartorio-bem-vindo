import { describe, expect, it } from "vitest";

import {
  detectarTipo,
  MAX_BYTES_ARQUIVO,
  sanearNomeArquivo,
  tipoAceito,
  validarArquivo,
} from "./arquivo";
import {
  CODIGO_RE,
  gerarCodigo,
  itensDossie,
  normalizarCodigo,
  perguntasVisiveis,
  tituloCartao,
  visivel,
  type Respostas,
} from "./dossie";
import { sanearMarkdown, sanearTelefone, sanearTexto } from "./texto";
import { criarUploadToken, lerUploadToken } from "./upload-token";
import { dossieBase } from "../../content/protocolo/atos";

const SEGREDO = "segredo-de-teste-1234567890";
const bytesPdf = (extra = 100) =>
  new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, ...new Array(extra).fill(0x41)]);

describe("visibilidade das perguntas", () => {
  it("mostra pergunta sem dependência", () => {
    expect(visivel({ id: "x", titulo: "t" }, {})).toBe(true);
  });

  it("esconde pergunta condicional enquanto a mãe não foi respondida", () => {
    const pergunta = { id: "t_regime", titulo: "t", dependeDe: ["t_civil", "Casado(a)"] as const };
    expect(visivel({ ...pergunta, dependeDe: ["t_civil", "Casado(a)"] }, {})).toBe(false);
    expect(
      visivel({ ...pergunta, dependeDe: ["t_civil", "Casado(a)"] }, { t_civil: "Solteiro(a)" }),
    ).toBe(false);
    expect(
      visivel({ ...pergunta, dependeDe: ["t_civil", "Casado(a)"] }, { t_civil: "Casado(a)" }),
    ).toBe(true);
  });

  it("aceita lista de respostas que satisfazem a dependência", () => {
    const pergunta = {
      id: "pag_local",
      titulo: "t",
      dependeDe: ["pag_momento", ["A", "B"]] as [string, string[]],
    };
    expect(visivel(pergunta, { pag_momento: "B" })).toBe(true);
    expect(visivel(pergunta, { pag_momento: "C" })).toBe(false);
  });

  it("regime de bens só aparece para pessoa física casada (CV-Urbano)", () => {
    const ids = (r: Respostas) => perguntasVisiveis("CV-Urbano", r).map((p) => p.id);
    expect(ids({})).not.toContain("t_regime");
    expect(ids({ t_tipo: "Pessoa física", t_civil: "Casado(a)" })).toContain("t_regime");
    expect(ids({ t_tipo: "Pessoa jurídica" })).not.toContain("t_civil");
  });
});

describe("dossiê do caso concreto", () => {
  it("parte dos documentos base do ato", () => {
    expect(itensDossie("CV-Urbano", {})).toEqual(dossieBase("CV-Urbano"));
  });

  it("acrescenta documentos conforme as respostas", () => {
    const itens = itensDossie("CV-Urbano", { t_tipo: "Pessoa física", t_civil: "Casado(a)" });
    expect(itens).toContain("Certidão de casamento (transmitente)");
  });

  it("ignora resposta de pergunta que deixou de estar visível", () => {
    // t_regime só existe para casado; se o cliente mudar para solteiro, o
    // documento do cônjuge não pode continuar na lista.
    const casado: Respostas = {
      t_tipo: "Pessoa física",
      t_civil: "Casado(a)",
      t_regime: "Comunhão parcial",
    };
    expect(itensDossie("CV-Urbano", casado)).toContain("RG/CPF do cônjuge (vênia)");

    const solteiro: Respostas = { ...casado, t_civil: "Solteiro(a)" };
    expect(itensDossie("CV-Urbano", solteiro)).not.toContain("RG/CPF do cônjuge (vênia)");
  });

  it("não repete documento pedido por duas respostas diferentes", () => {
    const itens = itensDossie("DOA", { menor: "Sim", clausulas: ["Incomunicabilidade"] });
    expect(new Set(itens).size).toBe(itens.length);
  });

  it("aceita perguntas de múltipla escolha", () => {
    const itens = itensDossie("DOA", { clausulas: ["Incomunicabilidade", "Inalienabilidade"] });
    expect(itens.length).toBeGreaterThan(0);
  });
});

describe("código de solicitação", () => {
  it("gera no formato esperado e sem caracteres confusos", () => {
    for (let i = 0; i < 200; i++) {
      const codigo = gerarCodigo();
      expect(codigo).toMatch(CODIGO_RE);
      expect(codigo.slice(2)).not.toMatch(/[ILOU]/);
    }
  });

  it("gera códigos distintos", () => {
    const codigos = new Set(Array.from({ length: 300 }, gerarCodigo));
    expect(codigos.size).toBeGreaterThan(290);
  });

  it("normaliza entrada do usuário", () => {
    expect(normalizarCodigo("s-xk4m2p")).toBe("S-XK4M2P");
    expect(normalizarCodigo("XK4M2P")).toBe("S-XK4M2P");
    expect(normalizarCodigo(" S-XK4M2P ")).toBe("S-XK4M2P");
    expect(normalizarCodigo("0988")).toBeNull();
    expect(normalizarCodigo("S-XK4M2")).toBeNull();
    // I, L, O e U não pertencem ao alfabeto do código.
    expect(normalizarCodigo("S-XKIM2P")).toBeNull();
  });
});

describe("nome do cartão", () => {
  it("põe o código entre colchetes, sem dígito logo após ') -'", () => {
    const titulo = tituloCartao("CV-Urbano", "S-XK4M2P", "joão da silva");
    expect(titulo).toBe("Prot. (CV-Urbano) - [S-XK4M2P] JOÃO DA SILVA");
    // Esta é a regra que impede /acompanhar de ler a solicitação como número
    // oficial de protocolo.
    expect(/\)\s*[-–—]\s*0*(\d+)/u.exec(titulo)).toBeNull();
  });

  it("funciona sem nome informado", () => {
    expect(tituloCartao("DOA", "S-AAAAAA", "  ")).toBe("Prot. (DOA) - [S-AAAAAA]");
  });
});

describe("validação de arquivo", () => {
  const bytesJpg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const bytesPng = () =>
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

  it("aceita PDF, JPG e PNG de verdade", () => {
    expect(validarArquivo(bytesPdf())).toEqual({
      ok: true,
      tipo: { extensao: "pdf", mime: "application/pdf" },
    });
    expect(validarArquivo(bytesJpg())).toEqual({
      ok: true,
      tipo: { extensao: "jpg", mime: "image/jpeg" },
    });
    expect(validarArquivo(bytesPng())).toEqual({
      ok: true,
      tipo: { extensao: "png", mime: "image/png" },
    });
  });

  it("recusa executável renomeado para .pdf", () => {
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // "MZ" — PE do Windows
    expect(tipoAceito(exe)).toBe(false);
    expect(validarArquivo(exe)).toEqual({
      ok: false,
      motivo: "Aceitamos apenas PDF, JPG ou PNG.",
    });
  });

  it("recusa outros formatos que não estão na lista", () => {
    // GIF e ZIP são arquivos legítimos, mas fora do que o cartório aceita.
    expect(detectarTipo(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBeNull();
    expect(detectarTipo(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBeNull();
  });

  it("recusa arquivo vazio e arquivo grande demais", () => {
    expect(validarArquivo(new Uint8Array(0)).ok).toBe(false);
    const grande = new Uint8Array(MAX_BYTES_ARQUIVO + 1);
    grande.set([0x25, 0x50, 0x44, 0x46, 0x2d]);
    expect(validarArquivo(grande).ok).toBe(false);
  });

  it("recusa quando o tamanho declarado não bate com o recebido", () => {
    expect(validarArquivo(bytesPdf(), 999_999).ok).toBe(false);
    expect(validarArquivo(bytesPdf(), bytesPdf().length).ok).toBe(true);
  });

  it("recusa arquivo curto demais para ter assinatura", () => {
    expect(tipoAceito(new Uint8Array([0x25, 0x50]))).toBe(false);
    // Prefixo de PNG truncado não pode passar como PNG.
    expect(tipoAceito(new Uint8Array([0x89, 0x50, 0x4e]))).toBe(false);
  });
});

describe("saneamento do nome do arquivo", () => {
  it("remove caminho e mantém a extensão", () => {
    expect(sanearNomeArquivo("../../etc/passwd.pdf", 0)).toBe("passwd.pdf");
    expect(sanearNomeArquivo("C:\\Users\\eu\\rg.pdf", 0)).toBe("rg.pdf");
  });

  it("descarta caracteres perigosos e de controle", () => {
    expect(sanearNomeArquivo("rg\u0000<script>.pdf", 0)).toBe("rgscript.pdf");
    expect(sanearNomeArquivo("nota;rm -rf.pdf", 0)).toBe("notarm -rf.pdf");
  });

  it("gera nome quando não sobra nada de útil", () => {
    expect(sanearNomeArquivo("...", 0)).toBe("documento-1.pdf");
    expect(sanearNomeArquivo("🙂🙂.pdf", 2)).toBe("documento-3.pdf");
    expect(sanearNomeArquivo("🙂.jpg", 0, "jpg")).toBe("documento-1.jpg");
  });

  it("usa a extensão do formato detectado, não a declarada", () => {
    // Cliente manda "rg.pdf" mas o conteúdo é uma foto: o anexo vira rg.jpg.
    expect(sanearNomeArquivo("rg.pdf", 0, "jpg")).toBe("rg.jpg");
    expect(sanearNomeArquivo("certidao.JPEG", 0, "png")).toBe("certidao.png");
  });

  it("preserva acentos e limita o tamanho", () => {
    expect(sanearNomeArquivo("certidão de casamento.pdf", 0)).toBe("certidão de casamento.pdf");
    expect(sanearNomeArquivo(`${"a".repeat(200)}.pdf`, 0).length).toBeLessThanOrEqual(64);
  });
});

describe("saneamento de texto", () => {
  it("neutraliza markdown na DESCRIÇÃO do cartão", () => {
    expect(sanearMarkdown("![img](http://x)", "nome")).not.toContain("](");
    expect(sanearMarkdown("**negrito**", "nome")).toBe("\\*\\*negrito\\*\\*");
  });

  it("NÃO escapa markdown fora da descrição (nome do cartão, campos)", () => {
    // O nome do cartão e os campos personalizados não são markdown no Trello:
    // escapar ali encheria "MARIA (SILVA)" de contrabarras.
    expect(sanearTexto("MARIA (SILVA) DE SOUZA", "nome")).toBe("MARIA (SILVA) DE SOUZA");
    expect(sanearTexto("**negrito**", "nome")).toBe("**negrito**");
  });

  it("remove caracteres de controle e colapsa espaços", () => {
    expect(sanearTexto("João\u0000  \n da Silva", "nome")).toBe("João da Silva");
  });

  it("corta no limite do campo", () => {
    expect(sanearTexto("a".repeat(500), "nome").length).toBeLessThanOrEqual(120);
    expect(sanearTexto("a".repeat(5000), "observacoes").length).toBeLessThanOrEqual(1500);
  });

  it("telefone mantém só dígitos e separadores", () => {
    expect(sanearTelefone("(79) 99976-0702")).toBe("(79) 99976-0702");
    // Letras também caem: um telefone não tem letras, e isso descarta
    // qualquer tentativa de injetar texto pelo campo.
    expect(sanearTelefone("79<script>999")).toBe("79999");
  });
});

describe("token de upload", () => {
  it("aceita token válido e devolve o cartão autorizado", async () => {
    const token = await criarUploadToken("card123", 5, SEGREDO);
    const conteudo = await lerUploadToken(token, SEGREDO);
    expect(conteudo?.c).toBe("card123");
    expect(conteudo?.n).toBe(5);
  });

  it("recusa token assinado com outro segredo", async () => {
    const token = await criarUploadToken("card123", 5, SEGREDO);
    expect(await lerUploadToken(token, "outro-segredo")).toBeNull();
  });

  it("recusa token adulterado", async () => {
    const token = await criarUploadToken("card123", 5, SEGREDO);
    const [corpo, assinatura] = token.split(".");
    // Troca o cartão mantendo a assinatura original.
    const falso = btoa(JSON.stringify({ c: "cardVITIMA", exp: 9_999_999_999, n: 99 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await lerUploadToken(`${falso}.${assinatura}`, SEGREDO)).toBeNull();
    expect(await lerUploadToken(`${corpo}.${assinatura}x`, SEGREDO)).toBeNull();
  });

  it("recusa token expirado", async () => {
    const agora = Date.now();
    const token = await criarUploadToken("card123", 5, SEGREDO, agora);
    expect(await lerUploadToken(token, SEGREDO, agora + 14 * 60 * 1000)).not.toBeNull();
    expect(await lerUploadToken(token, SEGREDO, agora + 16 * 60 * 1000)).toBeNull();
  });

  it("recusa formatos inválidos", async () => {
    expect(await lerUploadToken("", SEGREDO)).toBeNull();
    expect(await lerUploadToken("sem-ponto", SEGREDO)).toBeNull();
    expect(await lerUploadToken("a.b.c", SEGREDO)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Regressões vindas da revisão adversarial
// ---------------------------------------------------------------------------

describe("regressões da revisão", () => {
  it("sanear a resposta ANTES de calcular o dossiê quebraria o casamento", () => {
    // A revisão pegou isto: sanearMarkdown escapa parênteses, e as opções da
    // triagem têm parênteses ("Casado(a)"). Se o servidor saneasse antes de
    // chamar itensDossie, nenhuma opção casaria e os documentos condicionais
    // sumiriam do cartão em silêncio.
    const cru = "Casado(a)";
    const escapado = sanearMarkdown(cru, "resposta");
    expect(escapado).not.toBe(cru);

    const comCru = itensDossie("CV-Urbano", { t_tipo: "Pessoa física", t_civil: cru });
    const comEscapado = itensDossie("CV-Urbano", {
      t_tipo: "Pessoa física",
      t_civil: escapado,
    });
    expect(comCru).toContain("Certidão de casamento (transmitente)");
    expect(comEscapado).not.toContain("Certidão de casamento (transmitente)");
  });

  it("o nome do cartão não ganha contrabarras", () => {
    const titulo = tituloCartao("CV-Urbano", "S-XK4M2P", sanearTexto("Maria (Silva)", "nome"));
    expect(titulo).not.toContain("\\");
    expect(titulo).toContain("MARIA (SILVA)");
  });

  it("respostas órfãs não entram na contagem de perguntas visíveis", () => {
    // Cliente respondeu regime de bens e depois mudou para solteiro: a
    // resposta continua no estado, mas não pode aparecer no cartão.
    const respostas: Respostas = {
      t_tipo: "Pessoa física",
      t_civil: "Solteiro(a)",
      t_regime: "Comunhão parcial",
    };
    const visiveis = perguntasVisiveis("CV-Urbano", respostas).map((p) => p.id);
    expect(visiveis).not.toContain("t_regime");
    expect(respostas.t_regime).toBeDefined();
  });

  it("o código gerado sempre passa pela regex do formulário de acompanhamento", () => {
    const regexFormulario = /^(\d{1,10}|[Ss]-?[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{6})$/u;
    for (let i = 0; i < 100; i++) {
      expect(gerarCodigo()).toMatch(regexFormulario);
    }
    // E um código com letra ambígua é recusado pelos dois lados.
    expect(regexFormulario.test("S-XKIM2P")).toBe(false);
    expect(normalizarCodigo("S-XKIM2P")).toBeNull();
  });
});
