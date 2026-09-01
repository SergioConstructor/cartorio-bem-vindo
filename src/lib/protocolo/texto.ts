// Saneamento do texto que o cliente digita antes de virar descrição de cartão
// no Trello. A descrição é markdown, então texto cru poderia inserir imagens,
// links e blocos que confundem a escrevente.

const LIMITES = {
  nome: 120,
  telefone: 30,
  observacoes: 1500,
  resposta: 200,
} as const;

export type CampoTexto = keyof typeof LIMITES;

/**
 * Remove caracteres de controle, colapsa espaços, corta no limite do campo e
 * neutraliza a sintaxe de markdown que teria efeito visual no cartão.
 */
export function sanearTexto(valor: string, campo: CampoTexto): string {
  const semControle = Array.from(valor)
    .filter((c) => {
      const codigo = c.codePointAt(0) ?? 0;
      return codigo >= 0x20 && codigo !== 0x7f;
    })
    .join("");

  return (
    semControle
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, LIMITES[campo])
      // Escapa o que o Trello interpretaria como markdown.
      .replace(/([\\`*_[\]()#>|~])/g, "\\$1")
      .trim()
  );
}

/** Telefone só com dígitos, espaços e os separadores usuais. */
export function sanearTelefone(valor: string): string {
  return valor
    .replace(/[^\d\s()+-]/g, "")
    .trim()
    .slice(0, LIMITES.telefone);
}
