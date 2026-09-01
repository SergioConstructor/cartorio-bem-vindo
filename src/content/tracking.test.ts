import { describe, expect, it } from "vitest";

import { escreventeDoQuadro } from "./tracking";

describe("escrevente do quadro", () => {
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

  it("devolve null para quadros que não são de escrevente", () => {
    expect(escreventeDoQuadro("00. Protocolo/Cadastro")).toBeNull();
    expect(escreventeDoQuadro("01. TABELIÃO")).toBeNull();
    expect(escreventeDoQuadro("04. Certidões/Traslado")).toBeNull();
    expect(escreventeDoQuadro("")).toBeNull();
  });

  it("não confunde a palavra 'escrevente' sem nome depois", () => {
    expect(escreventeDoQuadro("02. ESCREVENTE")).toBeNull();
    expect(escreventeDoQuadro("02. ESCREVENTE   ")).toBeNull();
  });
});
