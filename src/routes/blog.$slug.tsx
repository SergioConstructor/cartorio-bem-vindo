import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, MessageCircle } from "lucide-react";
import logoVinho from "@/assets/cn2o-logo-vinho.jpg";
import { PostCard } from "@/components/site/PostCard";
import { getPost, posts } from "@/content/posts";

const slugifyHeading = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    const post = loaderData?.post;
    if (!post) return {};
    return {
      meta: [
        { title: `${post.title} — Blog CN2O` },
        { name: "description", content: post.excerpt },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.excerpt },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${params.slug}` },
        { property: "article:published_time", content: post.date },
        { property: "article:author", content: post.author },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Person", name: post.author },
            publisher: {
              "@type": "Organization",
              name: "Cartório de Notas — 2º Ofício de Itabaiana/SE",
            },
          }),
        },
      ],
    };
  },
  component: PostPage,
  notFoundComponent: () => (
    <div className="container-tight py-20 text-center">
      <h1 className="font-display text-3xl">Artigo não encontrado</h1>
      <Link to="/blog" className="mt-4 inline-block text-primary">
        ← Voltar ao blog
      </Link>
    </div>
  ),
});

function PostPage() {
  const { post } = Route.useLoaderData();
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const headings = post.content
    .filter((b): b is { heading: string; body: string } => Boolean(b.heading))
    .map((b) => b.heading);

  return (
    <>
      <article className="container-tight max-w-3xl py-16 md:py-24">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-primary-soft"
        >
          <ChevronLeft size={14} aria-hidden /> Voltar ao blog
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
            {post.category}
          </span>
          <span>{post.dateLabel}</span>
          <span aria-hidden>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h1 className="mt-5 font-display text-4xl leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-5 font-display text-xl italic leading-relaxed text-muted-foreground md:text-2xl">
          {post.excerpt}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <img
            src={logoVinho}
            alt=""
            className="h-10 w-10 rounded-full border border-primary/20 object-cover"
          />
          <div className="text-sm">
            <div className="font-semibold text-secondary">{post.author}</div>
            <div className="text-xs text-muted-foreground">
              Cartório de Notas — 2º Ofício de Itabaiana/SE
            </div>
          </div>
        </div>

        <div className="ridge-divider my-10" />

        {/* Sumário */}
        {headings.length >= 3 && (
          <nav
            aria-label="Sumário do artigo"
            className="mb-10 border-l-2 border-gold bg-gold-soft/50 p-6"
          >
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Neste artigo
            </div>
            <ol className="mt-3 space-y-1.5 text-sm">
              {headings.map((h, i) => (
                <li key={h}>
                  <a
                    href={`#${slugifyHeading(h)}`}
                    className="group inline-flex items-baseline gap-2 text-secondary/80 transition-colors hover:text-primary"
                  >
                    <span className="font-display text-gold" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="group-hover:underline">{h}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="space-y-7 text-[1.0625rem] leading-[1.85] text-foreground/85">
          {post.content.map((block, i) => (
            <div key={i}>
              {block.heading && (
                <h2
                  id={slugifyHeading(block.heading)}
                  className="mb-4 mt-10 flex scroll-mt-28 items-center gap-3 font-display text-2xl"
                >
                  <span className="inline-block h-2 w-2 shrink-0 rotate-45 bg-gold" aria-hidden />
                  {block.heading}
                </h2>
              )}
              <p>{block.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="navy-gradient relative mt-14 overflow-hidden p-8 text-secondary-foreground md:p-10">
          <div className="topo-lines absolute inset-0 text-secondary-foreground/10" aria-hidden />
          <div className="relative">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Precisa de orientação?
            </div>
            <div className="mt-2 font-display text-2xl !text-secondary-foreground">
              Fale com nossa equipe
            </div>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-secondary-foreground/70">
              Explicamos o passo a passo do seu caso e ajudamos você a reunir a documentação
              necessária — sem compromisso.
            </p>
            <a
              href="https://wa.me/5579999760702"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-gold px-5 py-3 text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:bg-gold/90"
            >
              <MessageCircle size={14} aria-hidden />
              Falar com o cartório
            </a>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-muted/40">
          <div className="container-tight py-16">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <span className="h-px w-8 bg-gold" aria-hidden />
              Continue lendo
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
