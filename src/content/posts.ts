export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  author: string;
  category: string;
  readingTime: string;
  content: { heading?: string; body: string }[];
};

export const posts: Post[] = [
  {
    slug: "quando-preciso-reconhecer-firma",
    title: "Quando preciso reconhecer firma em um documento?",
    excerpt:
      "Entenda em quais situações o reconhecimento de firma é obrigatório, a diferença entre 'por semelhança' e 'por autenticidade' e como preparar seus documentos.",
    date: "2026-05-12",
    dateLabel: "12 de maio de 2026",
    author: "Equipe CN2O",
    category: "Guias práticos",
    readingTime: "4 min de leitura",
    content: [
      {
        body: "O reconhecimento de firma é um dos atos mais procurados em um cartório de notas. Ele atesta que a assinatura presente em um documento é, de fato, da pessoa indicada — conferindo segurança jurídica para transações, autorizações e contratos.",
      },
      {
        heading: "Por semelhança ou por autenticidade?",
        body: "No reconhecimento por semelhança, o tabelião compara a assinatura do documento com a ficha-padrão arquivada no cartório. Já o reconhecimento por autenticidade exige que o signatário compareça pessoalmente e assine na presença do tabelião, garantindo grau máximo de segurança — exigido em transferências de veículos e em determinados contratos.",
      },
      {
        heading: "Quando é obrigatório?",
        body: "Operações de compra e venda de veículos, autorizações de viagem de menores, procurações particulares com poderes especiais e diversos contratos imobiliários costumam exigir reconhecimento de firma. Sempre confirme com o órgão destinatário a modalidade necessária antes de comparecer.",
      },
      {
        heading: "O que levar ao cartório",
        body: "Documento original a ser reconhecido, documento de identidade com foto e, no caso de primeira vez no cartório, será aberta uma ficha de assinatura — processo rápido e único.",
      },
    ],
  },
  {
    slug: "procuracao-tipos-e-quando-usar",
    title: "Procuração pública: tipos e quando utilizá-la",
    excerpt:
      "Procurações dão poderes para que outra pessoa atue em seu nome. Saiba quais existem, quando uma procuração pública é exigida e quais cuidados tomar.",
    date: "2026-04-28",
    dateLabel: "28 de abril de 2026",
    author: "César Bravo, Tabelião",
    category: "Atos notariais",
    readingTime: "5 min de leitura",
    content: [
      {
        body: "A procuração é o instrumento pelo qual alguém (outorgante) confere poderes a outra pessoa (outorgado) para representá-lo em determinados atos da vida civil. Lavrada em cartório, ela se chama procuração pública — e em diversas situações é a única forma aceita.",
      },
      {
        heading: "Quando a procuração pública é obrigatória",
        body: "Sempre que o ato principal exigir escritura pública — como venda de imóvel, partilha de bens, doação ou renúncia de herança — a procuração também deverá ser pública. Bancos e órgãos públicos costumam exigi-la para movimentações de maior valor.",
      },
      {
        heading: "Poderes gerais vs. poderes específicos",
        body: "Recomenda-se que o outorgante descreva com precisão os poderes concedidos. Procurações em causa própria, com cláusula de irrevogabilidade, ou para alienação de bens devem ter os poderes detalhados — protegendo o outorgante de uso indevido.",
      },
      {
        heading: "Prazo de validade",
        body: "Não há prazo legal único, mas é prática comum exigir procurações com menos de 90 dias para atos sensíveis. O outorgante pode revogá-la a qualquer momento mediante novo ato notarial.",
      },
    ],
  },
  {
    slug: "escritura-publica-de-imovel-passo-a-passo",
    title: "Escritura pública de imóvel: passo a passo completo",
    excerpt:
      "Comprou ou vai vender um imóvel? Veja como funciona a lavratura da escritura, documentos necessários, custos envolvidos e o que acontece depois.",
    date: "2026-04-10",
    dateLabel: "10 de abril de 2026",
    author: "Equipe CN2O",
    category: "Imóveis",
    readingTime: "7 min de leitura",
    content: [
      {
        body: "A escritura pública é o ato que formaliza a transferência de um imóvel entre vendedor e comprador. Sem ela — e sem o posterior registro no Cartório de Imóveis — a propriedade não muda de titular perante a lei.",
      },
      {
        heading: "1. Reunir a documentação",
        body: "Das partes: RG, CPF, certidão de estado civil atualizada e comprovante de residência. Do imóvel: matrícula atualizada, certidões negativas municipais (IPTU) e, conforme o caso, certidões trabalhistas e fiscais do vendedor.",
      },
      {
        heading: "2. Recolhimento do ITBI",
        body: "O Imposto de Transmissão de Bens Imóveis é municipal e deve ser recolhido antes da lavratura. Em Itabaiana, a guia é emitida pela Prefeitura, com base no valor da transação ou no valor venal — o que for maior.",
      },
      {
        heading: "3. Lavratura no tabelionato",
        body: "Com tudo em mãos, vendedor e comprador comparecem ao cartório, leem a minuta e assinam a escritura na presença do tabelião. Procurações públicas são aceitas, desde que com poderes específicos para o ato.",
      },
      {
        heading: "4. Registro no Cartório de Imóveis",
        body: "A escritura por si só não transfere a propriedade — é preciso levá-la ao Cartório de Registro de Imóveis da circunscrição do bem para que a transferência seja averbada na matrícula. Só então o comprador se torna, de fato, proprietário.",
      },
    ],
  },
  {
    slug: "testamento-garantindo-sua-vontade",
    title: "Testamento: garantindo que sua vontade seja respeitada",
    excerpt:
      "O testamento público é uma forma segura e flexível de organizar a destinação do seu patrimônio. Conheça as modalidades e mitos comuns sobre o tema.",
    date: "2026-03-22",
    dateLabel: "22 de março de 2026",
    author: "César Bravo, Tabelião",
    category: "Planejamento",
    readingTime: "6 min de leitura",
    content: [
      {
        body: "Diferente do que muitos imaginam, o testamento não é instrumento exclusivo de quem tem grande patrimônio. Ele permite organizar a sucessão, contemplar pessoas queridas fora da linha sucessória obrigatória e evitar disputas familiares.",
      },
      {
        heading: "Modalidades previstas em lei",
        body: "Existem três tipos ordinários: público (lavrado em cartório, com força máxima de prova), cerrado (escrito pelo testador e aprovado pelo tabelião em sigilo) e particular (escrito e assinado pelo testador, exigindo testemunhas). O testamento público é o mais utilizado por sua segurança.",
      },
      {
        heading: "Limites: a parte legítima",
        body: "Quem possui herdeiros necessários (descendentes, ascendentes e cônjuge) só pode dispor livremente de até 50% do patrimônio — a chamada parte disponível. Os outros 50% são reservados aos herdeiros por força de lei.",
      },
      {
        heading: "Pode ser alterado a qualquer momento",
        body: "Um testamento não é definitivo: o testador pode revogá-lo ou modificá-lo quantas vezes quiser, sempre por meio de novo ato notarial. Isso garante flexibilidade para adaptar a vontade ao longo da vida.",
      },
    ],
  },
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
