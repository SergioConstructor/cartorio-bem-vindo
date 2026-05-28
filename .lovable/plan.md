
# Site CN2O — Cartório de Notas 2º Ofício de Itabaiana/SE

Site institucional moderno e sóbrio, aplicando 100% da identidade visual do brandbook (cores vinho #631325 / navy #202a3a / branco, tipografia inspirada em Ambient Bold + Lato), com blog estático para artigos e avisos.

## Identidade visual (tokens em `src/styles.css`)

- Cores semânticas em oklch:
  - `--primary` = vinho #631325 (CTA, destaques, footer)
  - `--secondary` / `--foreground` em headings = navy #202a3a
  - `--background` = branco / off-white sutil
  - `--accent` = vinho mais claro para hovers
- Tipografia via Google Fonts:
  - Headings: **Playfair Display** ou **Cormorant** (substituto digno de "Ambient Bold" — serifa institucional)
  - Corpo: **Lato** (exatamente como no brandbook)
- Logo CN2O (imagem enviada) usado no header, footer e como watermark sutil em seções hero.
- Detalhes de "topografia serrana" referenciados no brandbook: linhas inclinadas finas como divisor visual entre seções.

## Estrutura de rotas (TanStack Start)

```
src/routes/
  __root.tsx         → header + footer compartilhados, meta global
  index.tsx          → Home
  servicos.tsx       → Lista completa de serviços notariais
  sobre.tsx          → Sobre o cartório + Tabelião César Bravo
  blog.tsx           → Listagem do blog
  blog.$slug.tsx     → Post individual
  contato.tsx        → Endereço, mapa, telefone, e-mail, horário
```

Cada rota com `head()` próprio (title, description, og tags) para SEO.

## Páginas — conteúdo

**Home (`/`)**
- Hero: logo CN2O sobre fundo vinho, headline "Tradição que se moderniza para servir você", subheadline sobre o 2º Ofício de Itabaiana, CTA "Conheça nossos serviços" + "Fale com o cartório".
- Faixa de serviços principais (6 cards): Escrituras, Procurações, Reconhecimento de Firma, Autenticações, Testamentos, Atas Notariais.
- Bloco "Sobre o cartório" com foto institucional placeholder + texto curto + link para /sobre.
- Últimas 3 publicações do blog.
- Bloco de contato rápido (endereço, telefone, horário) + CTA WhatsApp.

**Serviços (`/servicos`)**
- Grid detalhado de todos os serviços notariais com descrição, documentos necessários e quando procurar o cartório.

**Sobre (`/sobre`)**
- História do 2º Ofício, missão/valores, apresentação do Tabelião César Bravo, equipe, compromisso com modernização.

**Blog (`/blog` + `/blog/:slug`)**
- Listagem em grid com 4 posts iniciais de exemplo (estáticos, em `src/content/posts.ts`):
  1. "Quando preciso reconhecer firma?"
  2. "Procuração: tipos e quando usar"
  3. "Escritura pública de imóvel: passo a passo"
  4. "Testamento: garantindo sua vontade"
- Página de post com tipografia editorial limpa, breadcrumb, data, autor, conteúdo em markdown-like (string com seções), CTA final para contato.

**Contato (`/contato`)**
- Endereço: Av. Ivo de Carvalho, 441 — Centro, Itabaiana/SE, CEP 49.500-064
- Telefone: (79) 99944-0969
- E-mail: cesar.bravo@cn2oita.com.br
- Horário de atendimento
- Mapa Google embedado (iframe)
- Formulário simples (mailto: por enquanto, sem backend)

## Componentes compartilhados

- `Header` com logo CN2O à esquerda, navegação à direita (Home, Serviços, Sobre, Blog, Contato), versão mobile com menu hamburger (Sheet do shadcn).
- `Footer` em navy escuro com logo branco, endereço, links rápidos, contato e copyright.
- `ServiceCard`, `PostCard`, `SectionHeading` para consistência.

## Detalhes técnicos

- Sem backend nesta primeira versão — posts em arquivo TS estático para começar simples. Migração para Lovable Cloud + admin pode vir depois se você quiser.
- Logo: copio `user-uploads://AVATAR_03-100.jpg` para `src/assets/cn2o-logo-vinho.jpg` e também gero/edito uma versão com fundo transparente em PNG para usar sobre fundos claros (header branco).
- SEO: cada rota com title/description únicos em PT-BR, JSON-LD `LocalBusiness` no `__root` com endereço e telefone reais.
- Imagens auxiliares (hero do tabelião, interior do cartório, post covers): geradas via imagegen no tom institucional/sóbrio compatível com a paleta vinho/navy.
- Responsivo mobile-first, animações sutis (fade/slide on scroll) com Tailwind.

## Entregável final

Site navegável com 5 rotas + 4 posts de blog, totalmente aderente ao brandbook, pronto para publicar. Você poderá depois pedir: ativar Lovable Cloud para gerenciar posts via admin, adicionar formulário de contato real (com envio de e-mail), agendamento online, etc.
