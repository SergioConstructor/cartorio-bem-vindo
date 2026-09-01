// Tipos de ato atendidos pelo protocolo online e os documentos que cada um
// sempre exige. Portado do protótipo "Hub de Protocolo" do cartório.
//
// O dossiê mostrado ao cliente = documentos base do ato (aqui) + documentos
// condicionais injetados pelas respostas da triagem (ver ./triagem.ts).

export type AtoId = "CV-Urbano" | "CV-Rural" | "CDP" | "CDH" | "DOA" | "TEST";

export const ATOS: { id: AtoId; rotulo: string; descricao: string }[] = [
  {
    id: "CV-Urbano",
    rotulo: "Compra e venda · Urbano",
    descricao: "Casa, apartamento ou terreno na cidade",
  },
  {
    id: "CV-Rural",
    rotulo: "Compra e venda · Rural",
    descricao: "Sítio, fazenda ou terreno rural",
  },
  {
    id: "CDP",
    rotulo: "Cessão de posse",
    descricao: "Imóvel sem matrícula, transferido por posse",
  },
  { id: "CDH", rotulo: "Cessão de herança", descricao: "Venda dos direitos sobre uma herança" },
  { id: "DOA", rotulo: "Doação", descricao: "Transferência sem pagamento" },
  { id: "TEST", rotulo: "Testamento", descricao: "Disposição de bens para depois da morte" },
];

/** Nome completo do ato, usado no recibo do cliente. */
export const ATO_NOME: Record<AtoId, string> = {
  "CV-Urbano": "Escritura de Compra e Venda (imóvel urbano)",
  "CV-Rural": "Escritura de Compra e Venda (imóvel rural)",
  CDP: "Escritura de Cessão de Direitos Possessórios",
  CDH: "Escritura de Cessão de Direitos Hereditários",
  DOA: "Escritura de Doação",
  TEST: "Testamento Público",
};

/** Como cada lado do negócio se chama em cada ato. */
export const PAPEIS: Record<AtoId, { t: string; a: string; parte: string; ra: string }> = {
  "CV-Urbano": {
    t: "Vendedor(es)",
    a: "Comprador(es)",
    parte: "Nome do comprador(a)",
    ra: "Comprador(a)",
  },
  "CV-Rural": {
    t: "Vendedor(es)",
    a: "Comprador(es)",
    parte: "Nome do comprador(a)",
    ra: "Comprador(a)",
  },
  CDP: {
    t: "Cedente(s)",
    a: "Cessionário(s)",
    parte: "Nome do cessionário(a)",
    ra: "Cessionário(a)",
  },
  CDH: {
    t: "Cedente(s)",
    a: "Cessionário",
    parte: "Nome do cessionário (o 1º, se mais de um)",
    ra: "Cessionário(a)",
  },
  DOA: { t: "Doador(a)", a: "Donatário(a)", parte: "Nome do donatário(a)", ra: "Donatário(a)" },
  TEST: { t: "Testador(a)", a: "Beneficiário(s)", parte: "Nome do testador(a)", ra: "Testador(a)" },
};

/** Documentos exigidos em todo caso, por tipo de ato. */
export function dossieBase(ato: AtoId): string[] {
  if (ato === "TEST") {
    return [
      "RG/CPF do testador",
      "Comprovante de residência do testador",
      "Qualificação dos beneficiários (RG/CPF)",
      "RG/CPF das 2 testemunhas",
    ];
  }

  const base = [
    "RG/CPF do(s) transmitente(s)",
    "RG/CPF do(s) adquirente(s)",
    "Comprovante de residência",
  ];

  if (ato === "CV-Urbano") {
    base.push(
      "Matrícula atualizada",
      "Guia de ITBI",
      "CND municipal (IPTU)",
      "Inscrição imobiliária",
    );
  }
  if (ato === "CV-Rural") {
    base.push("Matrícula atualizada", "Guia de ITBI", "CCIR", "ITR / CND rural");
  }
  if (ato === "CDP") {
    base.push("Cadastro municipal do imóvel", "ITBI (conforme o município)");
  }
  if (ato === "CDH") {
    base.push(
      "Guia de ITBI/ITCMD (âncora: transmitente = Espólio; adquirente = cessionário)",
      "Certidão de óbito do autor da herança",
      "Certidão de casamento do falecido (com averbações)",
      "Certidões de nascimento/casamento dos herdeiros cedentes",
      "RG/CPF dos cônjuges dos cedentes",
    );
  }
  if (ato === "DOA") {
    base.push("Matrícula atualizada", "Guia de ITCMD", "CND municipal");
  }

  return base;
}

/** Escreventes do cartório — opcional, o cliente indica se já é atendido por alguém. */
export const ESCREVENTES = ["Josilene", "Camily", "Romênia", "Lara", "Jonas"] as const;

/**
 * Parceiros preferenciais (corretoras/construtoras). Lista embutida, como no
 * protótipo — a leitura dinâmica da lista do Trello ficou fora de escopo.
 */
export const PARCEIROS = [
  "ETHOS INCORPORADORA",
  "ATRIO URBANIZADORA",
  "CONSTRUTORA FORTTE",
  "CONSTRUTORA SANTA MÔNICA",
  "J.C. IMÓVEIS",
  "E-21 EMPREENDIMENTOS",
  "JMM CONSTRUTORA",
  "PAIVA CONSTRUTORA",
  "PORTO RESIDENCE",
] as const;
