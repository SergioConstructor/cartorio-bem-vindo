import { describe, expect, it } from "vitest";

import {
  destinoPorCem,
  rotuloPeriodo,
  semestres,
  semestresOrdenados,
  validarSemestre,
  type Semestre,
} from "./transparencia";

const exemplo: Semestre = {
  periodo: "2026-1",
  declaradoEm: "2026-07-14",
  emolumentosBrutos: 1000,
  repasses: { fundoJudiciario: 100, iss: 50, tributosFederais: 150 },
  custeio: 400,
  atosPraticados: 1200,
};

describe("lançamentos publicados", () => {
  // Trava real: um número digitado errado quebra o build em vez de ir ao ar.
  it("todos os semestres são válidos", () => {
    for (const s of semestres) expect(validarSemestre(s), s.periodo).toEqual([]);
  });

  it("não há período repetido", () => {
    const periodos = semestres.map((s) => s.periodo);
    expect(new Set(periodos).size).toBe(periodos.length);
  });
});

describe("destinoPorCem", () => {
  it("divide os R$ 100 e o residual vira remuneração/reservas", () => {
    const d = Object.fromEntries(destinoPorCem(exemplo).map((x) => [x.chave, x]));
    expect(d.fundo.percentual).toBeCloseTo(10);
    expect(d.iss.percentual).toBeCloseTo(5);
    expect(d.federais.percentual).toBeCloseTo(15);
    expect(d.custeio.percentual).toBeCloseTo(40);
    expect(d.remuneracao.valor).toBeCloseTo(300);
    expect(d.remuneracao.percentual).toBeCloseTo(30);
  });

  it("os percentuais somam 100", () => {
    const total = destinoPorCem(exemplo).reduce((a, x) => a + x.percentual, 0);
    expect(total).toBeCloseTo(100);
  });
});

describe("validarSemestre", () => {
  it("aceita um lançamento coerente", () => {
    expect(validarSemestre(exemplo)).toEqual([]);
  });

  it("rejeita saídas maiores que a receita", () => {
    expect(validarSemestre({ ...exemplo, custeio: 900 })).toContain(
      "repasses e custeio somam mais que os emolumentos brutos",
    );
  });

  it("rejeita valores negativos e receita zerada", () => {
    expect(validarSemestre({ ...exemplo, custeio: -1 })).toContain("valor negativo ou inválido");
    expect(
      validarSemestre({
        ...exemplo,
        emolumentosBrutos: 0,
        repasses: { fundoJudiciario: 0, iss: 0, tributosFederais: 0 },
        custeio: 0,
      }),
    ).toContain("emolumentos brutos devem ser maiores que zero");
  });

  it("rejeita período e data mal formados", () => {
    const ruim = {
      ...exemplo,
      periodo: "2026-3",
      declaradoEm: "14/07/2026",
    } as unknown as Semestre;
    const erros = validarSemestre(ruim);
    expect(erros.some((e) => e.startsWith("período inválido"))).toBe(true);
    expect(erros.some((e) => e.startsWith("data de declaração inválida"))).toBe(true);
  });
});

describe("ordem e rótulos", () => {
  it("mais recente primeiro", () => {
    const lista = [
      { ...exemplo, periodo: "2025-2" as const },
      { ...exemplo, periodo: "2026-1" as const },
      { ...exemplo, periodo: "2025-1" as const },
    ];
    expect(semestresOrdenados(lista).map((s) => s.periodo)).toEqual(["2026-1", "2025-2", "2025-1"]);
  });

  it("rótulo legível", () => {
    expect(rotuloPeriodo("2026-1")).toBe("1º semestre de 2026");
  });
});
