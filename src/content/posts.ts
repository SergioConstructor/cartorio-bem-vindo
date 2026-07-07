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
    slug: "ata-notarial-prova-com-fe-publica",
    title: "Ata notarial: transforme fatos e provas digitais em prova com fé pública",
    excerpt:
      "Conversas de WhatsApp, publicações em redes sociais, páginas na internet e situações de fato podem ser preservadas como prova. Entenda como a ata notarial funciona e quando utilizá-la.",
    date: "2026-07-01",
    dateLabel: "1º de julho de 2026",
    author: "César Bravo, Tabelião",
    category: "Atos notariais",
    readingTime: "5 min de leitura",
    content: [
      {
        body: "A ata notarial é o instrumento pelo qual o tabelião atesta, com fé pública, a existência e o modo de existir de um fato. Em um mundo cada vez mais digital — em que conteúdos podem ser apagados ou editados a qualquer momento —, ela se tornou uma das ferramentas mais poderosas para preservar provas.",
      },
      {
        heading: "Para que serve na prática",
        body: "Os usos mais comuns incluem: registrar conversas de WhatsApp e e-mails, constatar publicações ofensivas em redes sociais, comprovar o conteúdo de páginas na internet, documentar o estado de um imóvel na entrega de chaves e atestar fatos ocorridos em reuniões e assembleias. A ata notarial também é requisito para o reconhecimento extrajudicial de usucapião.",
      },
      {
        heading: "Qual o valor como prova?",
        body: "O Código de Processo Civil reconhece expressamente a ata notarial como meio de prova. Por ser lavrada por um agente dotado de fé pública, ela goza de presunção de veracidade: o que o tabelião narra ter visto ou constatado dificilmente será desconstituído — o que dá enorme força ao documento em processos judiciais e negociações.",
      },
      {
        heading: "Como é feita",
        body: "O interessado indica o fato a ser constatado e o tabelião o verifica pessoalmente: acessa o site, lê a conversa no aparelho apresentado, comparece ao local. Em seguida, descreve fielmente o que constatou, sem emitir juízo de valor — a ata narra fatos, não opiniões. Capturas de tela e fotografias podem integrar o documento.",
      },
      {
        heading: "O que levar ao cartório",
        body: "Documento de identidade com foto, a indicação clara do fato a ser constatado e o material de apoio necessário — aparelho celular com a conversa, links das páginas, endereço do local. Em caso de dúvida, fale conosco antes: orientamos sobre a viabilidade e o melhor formato para o seu caso.",
      },
    ],
  },
  {
    slug: "autenticacao-de-copias-quando-e-necessaria",
    title: "Autenticação de cópias: quando é necessária e como funciona",
    excerpt:
      "A cópia autenticada tem a mesma validade legal do documento original. Saiba quando ela é exigida, como o processo funciona no cartório e o que fazer com documentos digitais.",
    date: "2026-06-18",
    dateLabel: "18 de junho de 2026",
    author: "Equipe CN2O",
    category: "Guias práticos",
    readingTime: "4 min de leitura",
    content: [
      {
        body: "Autenticar uma cópia é conferir a ela a mesma validade legal do documento original. O tabelião — ou escrevente autorizado — compara a cópia com o original apresentado e, estando idênticos, apõe o selo de autenticação. A partir daí, a cópia pode substituir o original perante órgãos públicos e instituições privadas.",
      },
      {
        heading: "Quando a cópia autenticada é exigida",
        body: "Matrículas escolares e universitárias, posse em concursos públicos, processos administrativos, habilitação de casamento, contratos e financiamentos são exemplos frequentes. Embora a legislação venha simplificando exigências, muitos órgãos e empresas continuam solicitando cópias autenticadas por segurança.",
      },
      {
        heading: "Como funciona no cartório",
        body: "Basta apresentar o documento original e as cópias desejadas — ou apenas o original, e o próprio cartório providencia a reprodução. A conferência é feita página a página e cada folha autenticada recebe selo e carimbo próprios. O procedimento é rápido e feito na hora.",
      },
      {
        heading: "E os documentos digitais?",
        body: "Também é possível trabalhar com documentos eletrônicos: a materialização transforma um documento digital assinado eletronicamente em papel com fé pública, e a digitalização autenticada faz o caminho inverso. Consulte o cartório sobre o formato do seu documento antes de comparecer.",
      },
      {
        heading: "Dica prática",
        body: "Traga sempre o documento original em bom estado de conservação. Documentos rasurados, plastificados com danos ou ilegíveis podem inviabilizar a autenticação — nesses casos, oriente-se conosco sobre a melhor alternativa, como a segunda via do original.",
      },
    ],
  },
  {
    slug: "divorcio-e-inventario-em-cartorio",
    title: "Divórcio e inventário em cartório: resolva sem processo judicial",
    excerpt:
      "Quando há consenso, o divórcio e o inventário podem ser feitos por escritura pública — em dias, e não em anos. Veja os requisitos, as vantagens e os documentos necessários.",
    date: "2026-06-05",
    dateLabel: "5 de junho de 2026",
    author: "César Bravo, Tabelião",
    category: "Planejamento",
    readingTime: "6 min de leitura",
    content: [
      {
        body: "Desde a Lei nº 11.441/2007, o divórcio e o inventário consensuais podem ser realizados diretamente no cartório de notas, por escritura pública, sem necessidade de processo judicial. É a chamada via extrajudicial: mais rápida, menos custosa e muito menos desgastante para as famílias.",
      },
      {
        heading: "Divórcio em cartório: requisitos",
        body: "O requisito central é o consenso: o casal deve estar de acordo quanto ao fim do casamento, à partilha dos bens e, se for o caso, à pensão entre os cônjuges. É indispensável a assistência de advogado, que pode ser comum às duas partes. Quando há filhos menores ou incapazes, as questões de guarda, convivência e alimentos precisam estar previamente definidas — consulte o cartório sobre os requisitos aplicáveis ao seu caso.",
      },
      {
        heading: "Inventário extrajudicial",
        body: "A partilha dos bens de uma pessoa falecida também pode ser feita por escritura quando os herdeiros são maiores, capazes e estão de acordo com a divisão. Assim como no divórcio, a participação de advogado é obrigatória. A existência de testamento exige análise específica — em determinadas hipóteses, a via extrajudicial permanece possível.",
      },
      {
        heading: "Por que escolher a via extrajudicial",
        body: "O contraste é expressivo: enquanto um processo judicial pode levar anos, a escritura de divórcio ou inventário costuma ser lavrada em dias, assim que a documentação está completa. Os custos são previsíveis (emolumentos tabelados e tributos), e a escritura tem eficácia imediata, servindo para averbações e transferências de bens.",
      },
      {
        heading: "Documentos básicos",
        body: "Documentos pessoais das partes, certidão de casamento atualizada, certidões dos bens (matrículas de imóveis, documentos de veículos), comprovantes de recolhimento dos tributos devidos e, no inventário, certidão de óbito e certidão de inexistência de testamento. Nossa equipe prepara um checklist personalizado para cada caso.",
      },
    ],
  },
  {
    slug: "uniao-estavel-por-que-formalizar-em-cartorio",
    title: "União estável: por que e como formalizar no cartório",
    excerpt:
      "A escritura declaratória de união estável protege o casal no presente e no futuro — do plano de saúde à herança. Entenda os efeitos, o regime de bens e o passo a passo.",
    date: "2026-05-26",
    dateLabel: "26 de maio de 2026",
    author: "Equipe CN2O",
    category: "Atos notariais",
    readingTime: "5 min de leitura",
    content: [
      {
        body: "Muitos casais vivem em união estável sem qualquer documento que a comprove. A escritura pública declaratória de união estável resolve essa fragilidade: formaliza a relação com fé pública, define regras patrimoniais claras e evita disputas dolorosas no futuro.",
      },
      {
        heading: "Por que formalizar",
        body: "Com a escritura, o casal comprova a união perante planos de saúde, INSS, bancos e órgãos públicos — para inclusão de dependentes, pensões e benefícios. Ela também resguarda direitos sucessórios e facilita enormemente a comprovação da relação em momentos delicados, como o falecimento de um dos companheiros.",
      },
      {
        heading: "Regime de bens: vocês escolhem",
        body: "Na ausência de estipulação, aplica-se à união estável o regime da comunhão parcial de bens. Na escritura, porém, o casal pode escolher livremente outro regime — separação total, comunhão universal ou participação final nos aquestos — adequando as regras patrimoniais à realidade da relação.",
      },
      {
        heading: "Como é feito",
        body: "Os companheiros comparecem ao cartório com documentos de identidade, CPF e certidões de estado civil, e declaram a convivência pública, contínua e duradoura, com o objetivo de constituir família. Se desejarem, indicam a data de início da união — informação relevante para efeitos patrimoniais e previdenciários.",
      },
      {
        heading: "E se a união terminar?",
        body: "A dissolução consensual da união estável também pode ser feita por escritura pública, com a partilha dos bens adquiridos. O procedimento segue lógica semelhante à do divórcio extrajudicial, inclusive quanto à assistência obrigatória de advogado.",
      },
    ],
  },
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
