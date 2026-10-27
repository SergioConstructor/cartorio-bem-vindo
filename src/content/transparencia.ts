// Transparência — para onde vai o valor pago no cartório.
//
// Fonte: os mesmos números que o cartório declara ao CNJ no Sistema Justiça
// Aberta (Provimento CNJ 218/2026), a cada semestre. Não há API pública desses
// dados, então eles entram aqui à mão.
//
// ROTINA (janeiro e julho): depois de enviar a declaração ao Justiça Aberta,
// acrescente um item em `semestres` com os valores declarados e abra um PR.
// O teste src/content/transparencia.test.ts valida cada lançamento — um valor
// negativo ou repasses maiores que a receita quebram o build em vez de irem
// ao ar.
//
// Nunca preencha com estimativas: sem declaração, a página mostra um aviso
// de "em breve" em vez de números.

/** Nome do fundo do Judiciário de Sergipe que recebe parte dos emolumentos. */
export const NOME_FUNDO_JUDICIARIO = "Fundo do Poder Judiciário de Sergipe";

export type Semestre = {
  /** Ano e semestre, ex.: "2026-1" (jan–jun) ou "2026-2" (jul–dez). */
  periodo: `${number}-${1 | 2}`;
  /** Data do envio ao Justiça Aberta (AAAA-MM-DD). */
  declaradoEm: string;
  /** Receita bruta de emolumentos do semestre, em reais. */
  emolumentosBrutos: number;
  repasses: {
    /** Parcela dos emolumentos repassada ao fundo do Judiciário de Sergipe. */
    fundoJudiciario: number;
    /** ISS recolhido ao Município de Itabaiana. */
    iss: number;
    /** Tributos federais recolhidos (IR, INSS patronal etc.). */
    tributosFederais: number;
  };
  /** Despesas de funcionamento: folha e encargos, aluguel, sistemas, materiais. */
  custeio: number;
  /** Atos praticados no semestre (opcional, também consta do Justiça Aberta). */
  atosPraticados?: number;
};

export const semestres: Semestre[] = [
  // Ex.: { periodo: "2026-1", declaradoEm: "2026-07-14", emolumentosBrutos: 0,
  //        repasses: { fundoJudiciario: 0, iss: 0, tributosFederais: 0 },
  //        custeio: 0, atosPraticados: 0 },
];

export type Destino = {
  chave: "fundo" | "iss" | "federais" | "custeio" | "remuneracao";
  rotulo: string;
  descricao: string;
  valor: number;
  /** Percentual sobre os emolumentos brutos (0–100). */
  percentual: number;
};

/**
 * Divide os emolumentos brutos entre os destinos. O que sobra depois dos
 * repasses e do custeio é a remuneração do tabelião e as reservas da
 * serventia — mostrada agregada, sem detalhar renda pessoal.
 */
export function destinoPorCem(s: Semestre): Destino[] {
  const { fundoJudiciario, iss, tributosFederais } = s.repasses;
  const residual = s.emolumentosBrutos - fundoJudiciario - iss - tributosFederais - s.custeio;
  const pct = (valor: number) =>
    s.emolumentosBrutos > 0 ? (valor / s.emolumentosBrutos) * 100 : 0;

  const itens: Omit<Destino, "percentual">[] = [
    {
      chave: "fundo",
      rotulo: NOME_FUNDO_JUDICIARIO,
      descricao: "Parcela fixada em lei estadual, destinada ao Judiciário.",
      valor: fundoJudiciario,
    },
    {
      chave: "iss",
      rotulo: "ISS — Município de Itabaiana",
      descricao: "Imposto sobre serviços, recolhido à prefeitura.",
      valor: iss,
    },
    {
      chave: "federais",
      rotulo: "Tributos federais",
      descricao: "Imposto de renda e contribuições previdenciárias.",
      valor: tributosFederais,
    },
    {
      chave: "custeio",
      rotulo: "Funcionamento do cartório",
      descricao: "Equipe e encargos, estrutura, sistemas e segurança dos acervos.",
      valor: s.custeio,
    },
    {
      chave: "remuneracao",
      rotulo: "Remuneração do tabelião e reservas",
      descricao: "O que resta após repasses e despesas.",
      valor: residual,
    },
  ];
  return itens.map((item) => ({ ...item, percentual: pct(item.valor) }));
}

/** Lista os problemas de um lançamento; vazio = válido. */
export function validarSemestre(s: Semestre): string[] {
  const erros: string[] = [];
  const valores = [
    s.emolumentosBrutos,
    s.repasses.fundoJudiciario,
    s.repasses.iss,
    s.repasses.tributosFederais,
    s.custeio,
  ];
  if (!/^\d{4}-[12]$/.test(s.periodo)) erros.push(`período inválido: ${s.periodo}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.declaradoEm) || Number.isNaN(Date.parse(s.declaradoEm))) {
    erros.push(`data de declaração inválida: ${s.declaradoEm}`);
  }
  if (valores.some((v) => !Number.isFinite(v) || v < 0)) erros.push("valor negativo ou inválido");
  if (s.emolumentosBrutos <= 0) erros.push("emolumentos brutos devem ser maiores que zero");
  const saidas = valores.slice(1).reduce((a, b) => a + b, 0);
  if (saidas > s.emolumentosBrutos + 0.01) {
    erros.push("repasses e custeio somam mais que os emolumentos brutos");
  }
  if (
    s.atosPraticados !== undefined &&
    (!Number.isInteger(s.atosPraticados) || s.atosPraticados < 0)
  ) {
    erros.push("atos praticados deve ser inteiro não negativo");
  }
  return erros;
}

/** "2026-1" → "1º semestre de 2026". */
export function rotuloPeriodo(periodo: string): string {
  const [ano, sem] = periodo.split("-");
  return `${sem}º semestre de ${ano}`;
}

/** Semestres do mais recente para o mais antigo. */
export function semestresOrdenados(lista: Semestre[] = semestres): Semestre[] {
  return [...lista].sort((a, b) => b.periodo.localeCompare(a.periodo));
}
