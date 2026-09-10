import { describe, expect, it } from "vitest";

import {
  classificarLista,
  defaultStages,
  escreventeDoQuadro,
  normalizarNome,
  parseStagesConfig,
  prioridade,
  responsavelDoQuadro,
  type Classificacao,
} from "./tracking";

const rotulo = (lista: string): string => {
  const c = classificarLista(defaultStages, lista);
  return c.tipo === "etapa" ? defaultStages[c.indice].label : c.tipo;
};

// Nomes EXATOS das listas dos nove quadros da conta em 10/09/2026. Se o
// cartório renomear uma coluna, este teste é o primeiro lugar a mostrar.
describe("classificação das listas reais do Trello", () => {
  it("00. Protocolo/Cadastro", () => {
    expect(rotulo("Pré-protocolo (Site)")).toBe("pre_protocolo");
    expect(rotulo("Triagem")).toBe("Triagem");
    expect(rotulo("Protocolo/Entrada")).toBe("Protocolo/Entrada");
    expect(rotulo("Em Digitalização")).toBe("Digitalização");
    expect(rotulo("Cadastro Extradigital")).toBe("Cadastro extradigital");
    expect(rotulo("Em Conferência")).toBe("Conferência do cadastro");
    expect(rotulo("Escrituras Sem Efeito")).toBe("sem_efeito");
    expect(rotulo("Arquivo Geral")).toBe("Finalizado");
    expect(rotulo("Arquivo (Livros 888<)")).toBe("Finalizado");
    expect(rotulo("Arquivo Geral 2 (Cartões identificados)")).toBe("Finalizado");
    expect(rotulo("Arquivado ✔")).toBe("Finalizado");
    expect(rotulo("Arquivamento • revisar (anexo grande)")).toBe("Finalizado");
    expect(rotulo("Arquivo de Certidões/Traslado")).toBe("Finalizado");
    expect(rotulo("Arquivamento • refazer (PDF trocado)")).toBe("Finalizado");
  });

  it("01. TABELIÃO — era todo invisível antes", () => {
    expect(rotulo("🤖 Gerar Minuta")).toBe("Elaboração da minuta");
    expect(rotulo("Aguarda Auditoria")).toBe("Conferência da minuta");
    expect(rotulo("Conferir Minuta")).toBe("Conferência da minuta");
    expect(rotulo("MESA TABELIÃO")).toBe("Análise do tabelião");
    expect(rotulo("AGUARDA")).toBe("pendencia");
    expect(rotulo("PENDÊNCIAS")).toBe("pendencia");
  });

  it("02. ESCREVENTE … (colunas iguais em todos)", () => {
    expect(rotulo("PENDÊNCIAS")).toBe("pendencia");
    expect(rotulo("Revisar Minuta")).toBe("Elaboração da minuta");
    expect(rotulo("Conferência de Minuta")).toBe("Conferência da minuta");
    expect(rotulo("Ajuste/Retorno")).toBe("Ajustes/retorno");
    expect(rotulo("Agendar Assinatura")).toBe("Agendamento da assinatura");
    expect(rotulo("Aguardando Assinatura")).toBe("Aguardando assinatura");
    expect(rotulo("Finalizado")).toBe("Finalizado");
    expect(rotulo("Arquivar")).toBe("Finalizado");
    expect(rotulo("Enotariado/Onr")).toBe("Aguardando assinatura");
  });

  it("nome antigo da primeira coluna da escrevente continua valendo", () => {
    expect(rotulo("A Fazer (Minuta)")).toBe("Elaboração da minuta");
  });

  it("lista desconhecida não some: vira 'em andamento'", () => {
    expect(rotulo("⚙ Advogados")).toBe("desconhecida");
    expect(rotulo("Coluna nova que ninguém avisou")).toBe("desconhecida");
  });

  it("as etapas seguem a ordem real do processo", () => {
    const ordem = [
      "Triagem",
      "Em Conferência",
      "🤖 Gerar Minuta",
      "Conferir Minuta",
      "MESA TABELIÃO",
      "Ajuste/Retorno",
      "Agendar Assinatura",
      "Aguardando Assinatura",
      "Arquivo Geral",
    ].map((lista) => {
      const c = classificarLista(defaultStages, lista);
      return c.tipo === "etapa" ? c.indice : -1;
    });
    expect(ordem).toEqual([...ordem].sort((a, b) => a - b));
    expect(ordem).not.toContain(-1);
  });
});

describe("normalizarNome", () => {
  it("ignora acento, caixa, emoji e pontuação", () => {
    expect(normalizarNome("🤖 Gerar Minuta")).toBe("gerar minuta");
    expect(normalizarNome("MESA TABELIÃO")).toBe("mesa tabeliao");
    expect(normalizarNome("Arquivado ✔")).toBe("arquivado");
    expect(normalizarNome("Ajuste/Retorno")).toBe("ajuste retorno");
  });
});

describe("TRELLO_STAGE_LISTS", () => {
  it("aceita prefixo com * e rótulo próprio", () => {
    const stages = parseStagesConfig("Recebido | Triagem, Pronto | Finalizado | Arquiv*");
    expect(stages).not.toBeNull();
    expect(classificarLista(stages!, "Arquivado ✔")).toEqual({ tipo: "etapa", indice: 1 });
    expect(classificarLista(stages!, "Triagem")).toEqual({ tipo: "etapa", indice: 0 });
    expect(stages![1].label).toBe("Pronto");
  });

  it("vazia ou inválida cai no padrão", () => {
    expect(parseStagesConfig(undefined)).toBeNull();
    expect(parseStagesConfig("  ,  , ")).toBeNull();
  });
});

describe("prioridade entre cartões com o mesmo número", () => {
  const p = (c: Classificacao) => prioridade(c, defaultStages);
  const ultima = defaultStages.length - 1;

  it("em andamento vale mais que arquivado ou sem efeito", () => {
    expect(p({ tipo: "etapa", indice: 6 })).toBeLessThan(p({ tipo: "etapa", indice: ultima }));
    expect(p({ tipo: "pendencia" })).toBeLessThan(p({ tipo: "etapa", indice: ultima }));
    expect(p({ tipo: "etapa", indice: ultima })).toBeLessThan(p({ tipo: "sem_efeito" }));
  });

  it("lista desconhecida ainda vale mais que arquivado", () => {
    expect(p({ tipo: "desconhecida" })).toBeLessThan(p({ tipo: "etapa", indice: ultima }));
  });
});

describe("responsável pelo quadro", () => {
  it("extrai o nome dos quadros reais das escreventes", () => {
    expect(escreventeDoQuadro("02. ESCREVENTE LARA")).toBe("Lara");
    expect(escreventeDoQuadro("02. ESCREVENTE JOSILENE")).toBe("Josilene");
    expect(escreventeDoQuadro("02. ESCREVENTE CAMILY")).toBe("Camily");
    expect(escreventeDoQuadro("02. ESCREVENTE JONAS")).toBe("Jonas");
  });

  it("devolve a grafia com acento, mesmo o quadro vindo sem", () => {
    // O quadro se chama "02. ESCREVENTE ROMENIA", sem o circunflexo.
    expect(escreventeDoQuadro("02. ESCREVENTE ROMENIA")).toBe("Romênia");
  });

  it("capitaliza nome ainda não cadastrado, sem exigir deploy", () => {
    expect(escreventeDoQuadro("02. ESCREVENTE SUZANA MARIA")).toBe("Suzana Maria");
  });

  it("reconhece o quadro do tabelião", () => {
    expect(responsavelDoQuadro("01. TABELIÃO")).toEqual({ tipo: "tabeliao" });
    expect(responsavelDoQuadro("02. ESCREVENTE LARA")).toEqual({
      tipo: "escrevente",
      nome: "Lara",
    });
  });

  it("devolve null para quadros sem responsável nomeado", () => {
    expect(escreventeDoQuadro("00. Protocolo/Cadastro")).toBeNull();
    expect(responsavelDoQuadro("00. Protocolo/Cadastro")).toBeNull();
    expect(responsavelDoQuadro("03. ENOTARIADO/ONR")).toBeNull();
    expect(responsavelDoQuadro("04. Certidões/Traslado")).toBeNull();
    expect(escreventeDoQuadro("")).toBeNull();
  });

  it("não confunde a palavra 'escrevente' sem nome depois", () => {
    expect(escreventeDoQuadro("02. ESCREVENTE")).toBeNull();
    expect(escreventeDoQuadro("02. ESCREVENTE   ")).toBeNull();
  });
});
