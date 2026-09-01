// Árvore de perguntas da triagem, portada do protótipo "Hub de Protocolo".
//
// Cada opção pode:
//   - injetar documentos no dossiê do cliente (`inj`)
//   - exibir um aviso jurídico ao ser escolhida (`aviso`)
// e cada pergunta pode depender da resposta de outra (`dependeDe`).
//
// TODA pergunta é OPCIONAL. Como quem responde aqui é o cliente (e não a
// escrevente), cada uma traz um texto de ajuda em linguagem simples (`ajuda`)
// e a saída "não sei" é sempre legítima: o cartão marca as respostas como
// declaradas pelo cliente, a conferir no balcão.

import type { AtoId } from "./atos";
import { PAPEIS } from "./atos";

export type Opcao = {
  v: string;
  /** documentos que esta resposta acrescenta ao dossiê */
  inj?: string[];
  /** alerta jurídico exibido ao escolher */
  aviso?: string;
};

export type Pergunta = {
  id: string;
  titulo: string;
  /** explicação em linguagem leiga, exibida abaixo do título */
  ajuda?: string;
  ops?: Opcao[];
  /** campo de data em vez de opções */
  tipo?: "data";
  /** aceita mais de uma resposta */
  multi?: boolean;
  /** só aparece quando a pergunta [0] tiver a resposta [1] */
  dependeDe?: [string, string | string[]];
};

function perguntasTestamento(): Pergunta[] {
  return [
    {
      id: "herd_nec",
      titulo: "Existem herdeiros necessários (descendentes, ascendentes ou cônjuge)?",
      ajuda: "Filhos, netos, pais, avós ou cônjuge do testador.",
      ops: [
        {
          v: "Não",
          aviso: "Sem herdeiros necessários, o testador pode dispor da totalidade dos bens.",
        },
        { v: "Sim", aviso: "Disposição limitada à parte disponível (50% — art. 1.789 CC)." },
      ],
    },
    {
      id: "extensao",
      titulo: "Extensão da disposição",
      ajuda: "Quanto do patrimônio o testamento vai destinar.",
      ops: [
        { v: "Totalidade dos bens", aviso: "Só é válida se não houver herdeiros necessários." },
        { v: "Toda a parte disponível" },
        { v: "Fração da parte disponível" },
        { v: "Bens determinados (legados)" },
      ],
    },
    {
      id: "benef_herdeiro",
      titulo: "Algum beneficiário é herdeiro necessário do testador?",
      ajuda: "Ou seja, algum dos beneficiários é filho, neto, pai, mãe ou cônjuge.",
      ops: [
        { v: "Não" },
        {
          v: "Sim — deixa pela parte disponível",
          aviso: "Consignar dispensa de colação expressa no testamento.",
        },
        {
          v: "Sim — como adiantamento de legítima",
          aviso: "Sujeito a colação no futuro inventário.",
        },
      ],
    },
    {
      id: "legados",
      titulo: "Legados a terceiros ou a empregados?",
      ajuda: "Bens específicos deixados a pessoas fora da família.",
      ops: [{ v: "Não" }, { v: "Sim", inj: ["Qualificação dos legatários (RG/CPF)"] }],
    },
    {
      id: "deserdacao",
      titulo: "Haverá deserdação de herdeiro?",
      ajuda: "Excluir formalmente um herdeiro da herança. É raro e exige motivo previsto em lei.",
      ops: [
        { v: "Não" },
        {
          v: "Sim",
          aviso:
            "Só por causa legal expressamente declarada (arts. 1.961–1.965 CC); o herdeiro poderá impugnar.",
          inj: ["Elementos de prova da causa de deserdação"],
        },
      ],
    },
    {
      id: "acrescer",
      titulo: "Direito de acrescer entre co-beneficiários",
      ajuda: "Se um beneficiário morrer antes ou recusar, a parte dele passa aos outros?",
      ops: [
        { v: "Não se aplica (beneficiário único)" },
        { v: "Consignar (quinhão do faltante acresce aos demais)" },
        { v: "Afastar (quinhões autônomos)" },
      ],
    },
    {
      id: "restritivas",
      titulo: "Cláusulas restritivas (incomunicabilidade, inalienabilidade, impenhorabilidade)?",
      ajuda:
        "Travas sobre o bem deixado: não se comunica com o cônjuge do herdeiro, não pode ser vendido ou penhorado.",
      ops: [
        { v: "Não" },
        { v: "Sim — sobre a parte disponível" },
        {
          v: "Sim — sobre a legítima",
          aviso: "Exige justa causa declarada no próprio testamento (art. 1.848 CC).",
        },
      ],
    },
    {
      id: "substituicao",
      titulo: "Substituição de beneficiário (pré-morte ou renúncia)?",
      ajuda: "Indicar quem fica no lugar caso o beneficiário morra antes ou não aceite.",
      ops: [{ v: "Não" }, { v: "Sim — indicar substituto(s)" }],
    },
    {
      id: "reconhecimento",
      titulo: "Reconhecimento de filho no testamento?",
      ops: [
        { v: "Não" },
        {
          v: "Sim",
          aviso:
            "O reconhecimento de filho é irrevogável, ainda que o testamento venha a ser revogado.",
        },
      ],
    },
    {
      id: "revoga",
      titulo: "Revoga testamento anterior?",
      ops: [
        { v: "Não" },
        { v: "Sim", inj: ["Referência do testamento anterior (serventia/livro/data)"] },
      ],
    },
    {
      id: "testamenteiro",
      titulo: "Nomeação de testamenteiro?",
      ajuda: "Pessoa encarregada de fazer cumprir o testamento.",
      ops: [{ v: "Não" }, { v: "Sim", inj: ["RG/CPF do testamenteiro"] }],
    },
    {
      id: "sanidade",
      titulo: "Testador idoso ou com saúde debilitada?",
      ajuda:
        "Um atestado de sanidade evita questionamentos futuros sobre a validade do testamento.",
      ops: [{ v: "Não" }, { v: "Sim", inj: ["Atestado médico de sanidade (praxe notarial)"] }],
    },
  ];
}

export function perguntasDoAto(ato: AtoId): Pergunta[] {
  if (ato === "TEST") return perguntasTestamento();

  const P = PAPEIS[ato];
  const Q: Pergunta[] = [];

  // Transmitente — no CDH os cedentes são extraídos da documentação, não daqui.
  if (ato !== "CDH") {
    Q.push({
      id: "t_tipo",
      titulo: `${P.t} — pessoa`,
      ajuda: "Quem está transferindo o bem é uma pessoa, uma empresa, ou são várias pessoas?",
      ops: [
        { v: "Pessoa física" },
        {
          v: "Pessoa jurídica",
          inj: ["Contrato social", "RG/CPF do representante", "Certidão simplificada da Junta"],
        },
        {
          v: "Múltiplos transmitentes",
          inj: ["RG/CPF e certidões de estado civil de TODOS os transmitentes (e cônjuges)"],
          aviso:
            "Qualificação individual extraída da documentação no Momento 3 — mesmo princípio do CDH.",
        },
      ],
    });
    Q.push({
      id: "t_civil",
      titulo: `${P.t} — estado civil`,
      dependeDe: ["t_tipo", "Pessoa física"],
      ops: [
        { v: "Solteiro(a)" },
        { v: "Casado(a)", inj: ["Certidão de casamento (transmitente)"] },
        { v: "Divorciado(a)", inj: ["Certidão de casamento com averbação (transmitente)"] },
        {
          v: "Viúvo(a)",
          inj: ["Certidão de casamento com averbação de óbito", "Alerta: verificar meação/herança"],
        },
        { v: "União estável", inj: ["Declaração/escritura de união estável (se houver)"] },
      ],
    });
    Q.push({
      id: "t_regime",
      titulo: `${P.t} — regime de bens`,
      ajuda:
        "Consta na certidão de casamento. Não sabe? Pode pular — o cartório confere na certidão.",
      dependeDe: ["t_civil", "Casado(a)"],
      ops: [
        { v: "Comunhão parcial", inj: ["RG/CPF do cônjuge (vênia)"] },
        { v: "Comunhão universal", inj: ["RG/CPF do cônjuge (participa transmitindo)"] },
        { v: "Separação convencional", inj: ["Pacto antenupcial registrado"] },
        {
          v: "Comunhão (antes da Lei 6.515/77)",
          inj: ["RG/CPF do cônjuge (participa transmitindo)"],
        },
      ],
    });
    Q.push({
      id: "t_origem_bem",
      titulo: "Imóvel — origem na titularidade do transmitente",
      ajuda: "Como quem está vendendo se tornou dono do imóvel.",
      dependeDe: ["t_tipo", "Pessoa física"],
      ops: [
        { v: "Adquirido no casamento" },
        { v: "Bem particular" },
        { v: "Herança", aviso: "Verificar se o caso pede CDH ou inventário prévio." },
      ],
    });
  }

  // Adquirente — no CDH o cessionário sai do campo ADQUIRENTE da guia de ITBI.
  if (ato !== "CDH") {
    Q.push({
      id: "a_civil",
      titulo: `${P.a} — estado civil`,
      ops: [
        { v: "Solteiro(a)" },
        { v: "Casado(a)", inj: ["Certidão de casamento (adquirente)"] },
        { v: "Divorciado(a)" },
        { v: "Viúvo(a)" },
        { v: "União estável" },
        {
          v: "Múltiplos adquirentes",
          inj: ["RG/CPF e certidões de estado civil de TODOS os adquirentes"],
          aviso:
            "Mais de um adquirente: o gerador insere a cláusula de instituição de condomínio voluntário (titularidade condominial); qualificação individual no Momento 3.",
        },
      ],
    });
    Q.push({
      id: "a_ue",
      titulo: `${P.a} — como constará a união estável?`,
      dependeDe: ["a_civil", "União estável"],
      ops: [
        {
          v: "Prova documental existente",
          inj: ["Escritura/declaração de união estável", "RG/CPF do convivente"],
          aviso: "A união estável consta por prova documental; convivente qualificado no ato.",
        },
        {
          v: "Cláusula declaratória no próprio instrumento",
          inj: ["RG/CPF do convivente"],
          aviso:
            "O gerador insere cláusula declaratória de que o adquirente convive em união estável com o convivente, devidamente qualificado.",
        },
      ],
    });
    Q.push({
      id: "a_regime",
      titulo: `${P.a} — regime de bens`,
      ajuda: "Consta na certidão de casamento. Não sabe? Pode pular.",
      dependeDe: ["a_civil", "Casado(a)"],
      ops: [
        { v: "Comunhão parcial" },
        { v: "Comunhão universal" },
        { v: "Separação convencional", inj: ["Pacto antenupcial registrado (adquirente)"] },
      ],
    });
  }

  // Parentesco e representação
  if (ato !== "DOA" && ato !== "CDH") {
    Q.push({
      id: "parentesco",
      titulo: "Transmissão de ascendente para descendente?",
      ajuda:
        "Venda de pai/mãe para filho, ou de avô/avó para neto. Nesse caso a lei exige a concordância dos outros filhos.",
      ops: [
        { v: "Não" },
        {
          v: "Sim",
          inj: [
            "RG/CPF dos demais descendentes (irmãos)",
            "Anuência dos demais descendentes (art. 496 CC)",
          ],
        },
      ],
    });
  }
  Q.push({
    id: "procuracao",
    titulo: "Alguém comparece representado por procuração?",
    ajuda: "Alguém vai assinar no lugar de outra pessoa.",
    ops: [
      { v: "Não" },
      { v: "Sim", inj: ["Procuração com poderes específicos", "RG/CPF do procurador"] },
    ],
  });

  // Pagamento (não se aplica à doação)
  if (ato !== "DOA") {
    Q.push({
      id: "pag_momento",
      titulo: "Momento do pagamento do preço",
      ajuda: "Quando o dinheiro foi ou será entregue.",
      ops: [
        {
          v: "Já pago integralmente (data anterior)",
          aviso:
            "Se por transferência ou cheque, exigir o comprovante DE IMEDIATO, antes de protocolar.",
        },
        { v: "Integralmente no ato da lavratura" },
        {
          v: "Misto — parte já paga, parte no ato",
          aviso: "Discriminar os VALORES de cada parte no campo Observações.",
        },
      ],
    });
    Q.push({
      id: "pag_ant_forma",
      titulo: "Pagamento já realizado — forma",
      dependeDe: ["pag_momento", "Já pago integralmente (data anterior)"],
      ops: [
        {
          v: "Dinheiro em espécie (moeda manual)",
          aviso:
            "Cláusula específica: preço pago em moeda corrente manual, contado e conferido pelo vendedor, na data indicada abaixo.",
        },
        {
          v: "Transferência / depósito / PIX",
          inj: ["Comprovante bancário da transferência"],
          aviso: "Exigir o comprovante DE IMEDIATO.",
        },
        {
          v: "Cheque",
          inj: ["Cópia do cheque (banco, agência, número)"],
          aviso: "Quitação plena só com a compensação — avaliar pro soluto × pro solvendo.",
        },
      ],
    });
    Q.push({
      id: "pag_ant_data",
      tipo: "data",
      titulo: "Data do pagamento realizado",
      dependeDe: ["pag_momento", "Já pago integralmente (data anterior)"],
    });
    Q.push({
      id: "pag_ato_forma",
      titulo: "Pagamento no ato da lavratura — forma",
      dependeDe: ["pag_momento", "Integralmente no ato da lavratura"],
      ops: [
        {
          v: "Dinheiro em espécie (moeda manual)",
          aviso:
            "Cláusula: preço pago em moeda corrente manual, contado e conferido pelo vendedor no ato.",
        },
        {
          v: "Cheque",
          inj: ["Cópia do cheque (banco, agência, número)"],
          aviso: "Consignar banco e número; avaliar pro soluto × pro solvendo.",
        },
        {
          v: "Transferência / PIX",
          inj: ["Comprovante bancário (exibido no ato)"],
          aviso: "Comprovante exibido e conferido no ato; cópia para o arquivamento.",
        },
        {
          v: "Financiamento bancário",
          inj: ["Cédula/contrato de financiamento"],
          aviso: "Consignar a instituição e a parte paga com recursos próprios, se houver.",
        },
      ],
    });
    Q.push({
      id: "pag_m_antes_forma",
      titulo: "Parte JÁ PAGA — forma",
      dependeDe: ["pag_momento", "Misto — parte já paga, parte no ato"],
      ops: [
        {
          v: "Dinheiro em espécie (moeda manual)",
          aviso: "Consignar valor e a data (abaixo) da parte paga em espécie.",
        },
        {
          v: "Transferência / depósito / PIX",
          inj: ["Comprovante bancário da parte já paga"],
          aviso: "Exigir o comprovante DE IMEDIATO.",
        },
        { v: "Cheque", inj: ["Cópia do cheque da parte já paga"] },
      ],
    });
    Q.push({
      id: "pag_m_antes_data",
      tipo: "data",
      titulo: "Parte já paga — data do pagamento",
      dependeDe: ["pag_momento", "Misto — parte já paga, parte no ato"],
    });
    Q.push({
      id: "pag_m_ato_forma",
      titulo: "Parte NO ATO da lavratura — forma",
      dependeDe: ["pag_momento", "Misto — parte já paga, parte no ato"],
      ops: [
        {
          v: "Dinheiro em espécie (moeda manual)",
          aviso:
            "Cláusula: parcela final em moeda corrente manual, contada e conferida pelo vendedor no ato.",
        },
        { v: "Cheque", inj: ["Cópia do cheque (parcela do ato)"] },
        { v: "Transferência / PIX", inj: ["Comprovante bancário (parcela do ato)"] },
        { v: "Financiamento bancário", inj: ["Cédula/contrato de financiamento"] },
      ],
    });
    Q.push({
      id: "pag_local",
      titulo: "Onde ocorrerá o pagamento no ato?",
      dependeDe: [
        "pag_momento",
        ["Integralmente no ato da lavratura", "Misto — parte já paga, parte no ato"],
      ],
      ops: [
        {
          v: "Nas dependências da serventia",
          aviso: "A escritura consigna o pagamento realizado nas dependências da serventia.",
        },
        {
          v: "Fora das dependências da serventia",
          aviso:
            "A escritura consigna que o pagamento se dá fora das dependências da serventia, conforme declarado pelas partes.",
        },
      ],
    });
    Q.push({
      id: "caucao",
      titulo: "Há desconfiança entre as partes quanto ao pagamento?",
      ajuda: "O cartório pode guardar o dinheiro até a assinatura, protegendo os dois lados.",
      ops: [
        { v: "Não" },
        {
          v: "Sim — orientar conta caução notarial",
          aviso:
            "Oriente as partes: o comprador deposita o preço na conta caução do cartório e o valor só é liberado ao vendedor após a assinatura de AMBOS na escritura. Segurança para os dois lados.",
        },
      ],
    });
    Q.push({
      id: "corretor",
      titulo: "Houve intermediação de corretor?",
      ops: [{ v: "Não" }, { v: "Sim", inj: ["Declaração de intermediação (CRECI e valor)"] }],
    });
  }

  // Perguntas específicas de cada ato
  if (ato === "CV-Urbano") {
    Q.push({
      id: "titulo_reg",
      titulo: "Título anterior está registrado na matrícula?",
      ajuda: "Se o dono atual já consta na matrícula do imóvel no cartório de registro.",
      ops: [
        { v: "Sim" },
        { v: "Não", aviso: "O gerador incluirá a cláusula de continuidade registral." },
      ],
    });
  }
  if (ato === "CV-Rural") {
    Q.push({
      id: "adcorpus",
      titulo: "Venda ad corpus?",
      ajuda: "Ad corpus = vende-se o imóvel como um todo, sem garantir a metragem exata.",
      ops: [{ v: "Sim" }, { v: "Não (ad mensuram)" }],
    });
    Q.push({
      id: "geo",
      titulo: "Georreferenciamento",
      ajuda: "Medição oficial dos limites do imóvel rural (SIGEF/CAR).",
      ops: [
        { v: "SIGEF/CAR apresentado", inj: ["Georreferenciamento SIGEF/CAR"] },
        { v: "Dispensado pela área", aviso: "Confirmar limite de área para dispensa." },
      ],
    });
  }
  if (ato === "CDP") {
    Q.push({
      id: "posse_origem",
      titulo: "Origem da posse do cedente",
      ajuda: "Como quem está passando o imóvel chegou à posse dele.",
      ops: [
        { v: "Aquisição anterior", inj: ["Documento da posse anterior (contrato/CDP)"] },
        { v: "Herança", inj: ["Documentação da origem hereditária da posse"] },
        { v: "Ocupação" },
      ],
    });
  }
  if (ato === "CDH") {
    Q.push({
      id: "config",
      titulo: "Configuração do negócio — atenção",
      ajuda: "Se o cônjuge sobrevivente também está vendendo a parte dele (meação).",
      ops: [
        {
          v: "Cessão pura — APENAS os herdeiros cedem direitos hereditários",
          aviso:
            "Só a fração hereditária é objeto do ato; o cônjuge sobrevivente, se existir, não transmite nada aqui.",
        },
        {
          v: "Negócio misto — sobrevivente VENDE a meação + herdeiros CEDEM a herança",
          aviso:
            "Muda a nomenclatura do ato e exige cláusula especial: a meação NÃO é herança — conforme o regime, o sobrevivente já é proprietário de 50% e VENDE essa fração ideal; apenas a metade dos herdeiros é inventariada/partilhada e objeto de cessão. Seguir o padrão próprio do negócio misto (Módulo 3-B).",
        },
      ],
    });
    Q.push({
      id: "origem_meacao",
      titulo: "Origem da meação do sobrevivente",
      dependeDe: [
        "config",
        "Negócio misto — sobrevivente VENDE a meação + herdeiros CEDEM a herança",
      ],
      ops: [
        { v: "Casamento — comunhão universal", aviso: "Meação de 50% sobre todo o acervo." },
        {
          v: "Casamento — comunhão parcial (bem adquirido na constância)",
          aviso:
            "Meação de 50% sobre o bem comum; conferir na matrícula/certidão a aquisição na constância.",
        },
        {
          v: "União estável",
          inj: ["Prova da união estável (Tema 809 STF)"],
          aviso: "O gerador insere a cláusula de legitimação da meeira/meeiro (Tema 809 STF).",
        },
      ],
    });
    Q.push({
      id: "cess_herdeiro",
      titulo: "O cessionário também é herdeiro?",
      ajuda: "Quem está comprando a herança também é um dos herdeiros?",
      ops: [
        {
          v: "Não",
          aviso:
            "Cessão a terceiro: observar o direito de preferência dos coerdeiros (arts. 1.794–1.795 CC) — cláusula própria no modelo.",
        },
        { v: "Sim", aviso: "Ajustar a fração cedida (ex.: 83,34%)." },
      ],
    });
    Q.push({
      id: "objeto",
      titulo: "Objeto da cessão",
      ajuda: "Cede-se toda a parte na herança, ou apenas um bem específico dela.",
      ops: [
        { v: "Quinhão universal" },
        { v: "Bem determinado", inj: ["Matrícula do bem determinado"] },
      ],
    });
    Q.push({
      id: "tributo",
      titulo: "ITCMD/ITBI",
      ops: [{ v: "Recolhido", inj: ["Guia paga (ITCMD/ITBI)"] }, { v: "A recolher" }],
    });
    Q.push({
      id: "anuentes",
      titulo: "Há intervenientes-anuentes prestando vênia?",
      ajuda: "Outras pessoas que precisam assinar concordando com o negócio.",
      ops: [{ v: "Não" }, { v: "Sim", inj: ["RG/CPF dos anuentes"] }],
    });
  }
  if (ato === "DOA") {
    Q.push({
      id: "rel",
      titulo: "Relação entre doador e donatário",
      ajuda: "Qual o parentesco entre quem doa e quem recebe.",
      ops: [
        {
          v: "Ascendente → descendente (pai/mãe → filho; avô/avó → neto)",
          aviso:
            "Art. 544 CC: importa adiantamento de legítima, salvo cláusula expressa em contrário.",
        },
        {
          v: "Cônjuge ou companheiro(a) do doador",
          aviso: "Cônjuge herdeiro necessário: mesma lógica de adiantamento (art. 544 CC).",
        },
        { v: "Outro parente" },
        { v: "Terceiro sem parentesco" },
      ],
    });
    Q.push({
      id: "natureza",
      titulo: "Natureza da doação (se o donatário é herdeiro necessário)",
      ops: [
        {
          v: "Adiantamento de legítima (regra do art. 544 CC)",
          aviso: "Sujeita a colação no futuro inventário.",
        },
        {
          v: "Pela parte disponível, com dispensa de colação",
          aviso: "Consignar cláusula EXPRESSA de dispensa de colação (art. 2.005 CC).",
        },
        { v: "Donatário não é herdeiro necessário" },
      ],
    });
    Q.push({
      id: "patrimonio",
      titulo: "Patrimônio do doador × valor doado",
      ajuda: "A lei impede doar mais do que metade do patrimônio quando há herdeiros necessários.",
      ops: [
        { v: "A doação cabe na metade disponível" },
        {
          v: "Pode exceder a metade disponível",
          aviso:
            "Risco de doação inoficiosa — nula no excesso (art. 549 CC). Avaliar o patrimônio no momento da liberalidade.",
        },
        {
          v: "Doador está doando todos os seus bens",
          aviso:
            "Doação universal é nula sem reserva de renda ou usufruto suficiente à subsistência (art. 548 CC) — exigir a reserva.",
        },
      ],
    });
    Q.push({
      id: "usufruto",
      titulo: "Reserva de usufruto",
      ajuda: "O doador continua usando o imóvel enquanto viver, mesmo tendo doado.",
      ops: [
        { v: "Sem reserva" },
        {
          v: "Usufruto vitalício em favor do doador",
          aviso:
            "O gerador insere a cláusula de reserva de usufruto vitalício (transmite-se só a nua-propriedade).",
        },
        {
          v: "Usufruto vitalício do doador e do cônjuge, com direito de acrescer",
          aviso:
            "Cláusula com acrescer entre usufrutuários: falecendo um, o usufruto consolida-se no sobrevivente.",
        },
      ],
    });
    Q.push({
      id: "encargo",
      titulo: "Doação pura ou com encargo?",
      ajuda: "Com encargo = quem recebe assume uma obrigação em troca.",
      ops: [
        { v: "Pura" },
        {
          v: "Com encargo (modal)",
          aviso: "Descrever o encargo no campo Observações; exige aceitação expressa do donatário.",
        },
      ],
    });
    Q.push({
      id: "menor",
      titulo: "Donatário menor ou incapaz?",
      ops: [
        { v: "Não" },
        {
          v: "Sim",
          inj: ["RG/CPF do representante legal"],
          aviso:
            "Doação pura a incapaz dispensa aceitação (art. 543 CC); avaliar cláusula de inalienabilidade.",
        },
      ],
    });
    Q.push({
      id: "clausulas",
      titulo: "Cláusulas restritivas",
      ajuda: "Travas sobre o bem doado. Pode marcar mais de uma.",
      multi: true,
      ops: [
        { v: "Incomunicabilidade" },
        { v: "Inalienabilidade" },
        { v: "Impenhorabilidade" },
        { v: "Reversão ao doador (art. 547 CC)" },
        { v: "Nenhuma" },
      ],
    });
    Q.push({
      id: "fracao",
      titulo: "Fração doada",
      ops: [{ v: "100% do imóvel" }, { v: "Parte ideal" }],
    });
  }

  return Q;
}
