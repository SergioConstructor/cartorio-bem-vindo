// Saneamento do texto que o cliente digita antes de chegar ao Trello.
//
// Há DOIS destinos, com regras diferentes:
//   - descrição do cartão: é markdown, então a sintaxe precisa ser neutralizada
//     (senão o cliente insere imagens, links e títulos no cartão da escrevente);
//   - nome do cartão e campos personalizados: NÃO são markdown, então escapar
//     ali só encheria o nome de contrabarras.

const LIMITES = {
  nome: 120,
  telefone: 30,
  observacoes: 1500,
  resposta: 200,
} as const;

export type CampoTexto = keyof typeof LIMITES;

/** Remove caracteres de controle, colapsa espaços e corta no limite do campo. */
export function sanearTexto(valor: string, campo: CampoTexto): string {
  const semControle = Array.from(valor)
    .filter((c) => {
      const codigo = c.codePointAt(0) ?? 0;
      return codigo >= 0x20 && codigo !== 0x7f;
    })
    .join("");

  return semControle.replace(/\s+/g, " ").trim().slice(0, LIMITES[campo]);
}

/**
 * Versão para a DESCRIÇÃO do cartão: além do saneamento normal, neutraliza a
 * sintaxe de markdown. Use só onde o texto vira markdown.
 */
export function sanearMarkdown(valor: string, campo: CampoTexto): string {
  return sanearTexto(valor, campo).replace(/([\\`*_[\]()#>|~])/g, "\\$1");
}

/** Telefone só com dígitos, espaços e os separadores usuais. */
export function sanearTelefone(valor: string): string {
  return valor
    .replace(/[^\d\s()+-]/g, "")
    .trim()
    .slice(0, LIMITES.telefone);
}
