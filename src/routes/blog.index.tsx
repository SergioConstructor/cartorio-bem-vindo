import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { FeaturedPostCard, PostCard } from "@/components/site/PostCard";
import { posts } from "@/content/posts";

export const Route = createFileRoute("/blog/")({
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

const ALL = "Todos";

function BlogPage() {
  const [category, setCategory] = useState<string>(ALL);

  const categories = useMemo(() => {
    const unique = [...new Set(posts.map((p) => p.category))];
    return [ALL, ...unique];
  }, []);

  const [featured, ...rest] = posts;
  const filtered = category === ALL ? rest : posts.filter((p) => p.category === category);

  return (
    <>
      <PageHero
        eyebrow="Publicações"
        title="Blog do cartório"
        description="Conteúdo prático sobre atos notariais, com explicações claras e orientações úteis para o seu dia a dia."
      />

      <section className="container-tight py-16 md:py-20">
        {/* Filtro por categoria */}
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filtrar artigos por categoria"
        >
          {categories.map((c) => {
            const active = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-secondary/70 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Post em destaque (visão geral) */}
        {category === ALL && (
          <div className="mt-10">
            <FeaturedPostCard post={featured} />
          </div>
        )}

        {/* Grade de artigos */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            Nenhum artigo nesta categoria por enquanto.
          </p>
        )}
      </section>
    </>
  );
}
