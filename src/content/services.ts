export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  documents: string[];
};

export const services: Service[] = [
  {
    slug: "escrituras",
    title: "Escrituras Públicas",
    short: "Compra e venda, doação, permuta e dissolução.",
    description:
      "Lavratura de escrituras públicas de compra e venda, doação, permuta, dissolução de união estável, divórcio e inventário extrajudiciais, entre outros atos de transmissão e organização patrimonial.",
    documents: [
      "Documentos pessoais das partes (RG e CPF)",
      "Certidão de estado civil atualizada",
      "Matrícula atualizada do imóvel (quando aplicável)",
      "Comprovante de pagamento do ITBI",
      "Certidões negativas conforme o ato",
    ],
  },
  {
    slug: "procuracoes",
    title: "Procurações",
    short: "Concessão de poderes para representação.",
    description:
      "Lavratura de procurações públicas, com poderes gerais ou específicos, para representação em atos da vida civil, bancária, previdenciária e judicial. Inclui revogação e substabelecimento.",
    documents: [
      "Documento de identidade com foto do outorgante",
      "CPF",
      "Dados completos do outorgado (nome, CPF, endereço)",
      "Descrição dos poderes desejados",
    ],
  },
  {
    slug: "reconhecimento-de-firma",
    title: "Reconhecimento de Firma",
    short: "Por semelhança ou por autenticidade.",
    description:
      "Conferência da autenticidade de assinaturas em documentos, nas modalidades por semelhança (comparação com ficha-padrão) ou por autenticidade (assinatura na presença do tabelião).",
    documents: [
      "Documento original a ser reconhecido",
      "Documento de identidade do signatário",
      "Abertura de ficha (na primeira vez)",
    ],
  },
  {
    slug: "autenticacoes",
    title: "Autenticação de Cópias",
    short: "Cópias com fé pública.",
    description:
      "Conferência e autenticação de cópias reprográficas a partir do documento original, conferindo-lhes a mesma validade legal do original perante repartições e órgãos.",
    documents: ["Documento original", "Cópias a serem autenticadas"],
  },
  {
    slug: "testamentos",
    title: "Testamentos Públicos",
    short: "Disposição da vontade com segurança jurídica.",
    description:
      "Lavratura de testamento público, instrumento que organiza a destinação do patrimônio respeitando a vontade do testador e a parte legítima dos herdeiros necessários.",
    documents: [
      "Documento de identidade e CPF do testador",
      "Certidão de estado civil",
      "Relação de bens e beneficiários",
      "Duas testemunhas idôneas",
    ],
  },
  {
    slug: "atas-notariais",
    title: "Atas Notariais",
    short: "Prova de fatos com fé pública.",
    description:
      "Documento em que o tabelião atesta a existência e o modo de existir de um fato — utilizado para constatar conteúdo de páginas, conversas, ocorrências e situações que possam servir de prova.",
    documents: [
      "Documento de identidade do solicitante",
      "Indicação clara do fato a ser constatado",
      "Material complementar (links, imagens, documentos)",
    ],
  },
];
