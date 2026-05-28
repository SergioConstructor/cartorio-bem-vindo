import { createFileRoute, Link } from "@tanstack/react-router";
import { posts } from "@/content/posts";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — CN2O Cartório de Notas de Itabaiana" },
      {
        name: "description",
        content:
          "Artigos práticos sobre escrituras, procurações, reconhecimento de firma, testamentos e demais atos notariais.",
      },
      { property: "og:title", content: "Blog — CN2O Cartório de Notas" },
      {
        property: "og:description",
        content: "Orientações claras para os atos mais procurados no cartório.",
      },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <>
      <section className="bg-primary text-primary-foreground">
        <div className="container-tight py-20">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-foreground/70">
            Publicações
          </div>
          <h1 className="mt-4 font-display text-4xl text-primary-foreground md:text-5xl">
            Blog do cartório
          </h1>
          <p className="mt-4 max-w-2xl text-primary-foreground/80">
            Conteúdo prático sobre atos notariais, com explicações claras e orientações
            úteis para o seu dia a dia.
          </p>
        </div>
      </section>

      <section className="container-tight py-20">
        <div className="grid gap-12 md:grid-cols-2">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col gap-4 border-t-2 border-primary pt-6 transition-colors hover:border-primary-soft"
            >
              <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="text-primary">{p.category}</span>
                <span>·</span>
                <span>{p.dateLabel}</span>
                <span>·</span>
                <span>{p.readingTime}</span>
              </div>
              <h2 className="font-display text-2xl leading-snug group-hover:text-primary">
                {p.title}
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">{p.excerpt}</p>
              <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Ler artigo →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
