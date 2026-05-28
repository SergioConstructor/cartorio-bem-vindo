import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { getPost, posts } from "@/content/posts";

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
      <Link to="/blog" className="mt-4 inline-block text-primary">← Voltar ao blog</Link>
    </div>
  ),
});

function PostPage() {
  const { post } = Route.useLoaderData();
  const related = posts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <article className="container-tight max-w-3xl py-16 md:py-24">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-primary hover:text-primary-soft"
        >
          <ChevronLeft size={14} /> Voltar ao blog
        </Link>

        <div className="mt-8 flex flex-wrap items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="text-primary">{post.category}</span>
          <span>·</span>
          <span>{post.dateLabel}</span>
          <span>·</span>
          <span>{post.readingTime}</span>
        </div>

        <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>

        <div className="mt-6 text-sm text-foreground/70">
          Por <span className="font-semibold text-secondary">{post.author}</span>
        </div>

        <div className="ridge-divider my-10" />

        <div className="space-y-7 text-base leading-relaxed text-foreground/85">
          {post.content.map((block: { heading?: string; body: string }, i: number) => (
            <div key={i}>
              {block.heading && (
                <h2 className="mt-10 mb-3 font-display text-2xl">{block.heading}</h2>
              )}
              <p>{block.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 border border-border bg-accent/30 p-8">
          <div className="font-display text-xl">Precisa de orientação?</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Fale com nossa equipe — explicamos o passo a passo e ajudamos você a reunir a
            documentação necessária.
          </p>
          <a
            href="https://wa.me/5579999440969"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-sm bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-soft"
          >
            Falar com o cartório
          </a>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="container-tight py-16">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Continue lendo
            </div>
            <div className="mt-6 grid gap-8 md:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group flex flex-col gap-3 border-t-2 border-primary pt-5"
                >
                  <div className="text-xs uppercase tracking-wider text-primary">{p.category}</div>
                  <h3 className="font-display text-xl leading-snug group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
