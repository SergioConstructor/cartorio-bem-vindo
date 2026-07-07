import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { Post } from "@/content/posts";

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="card-lift group flex h-full flex-col overflow-hidden border border-border bg-card hover:border-primary/25"
    >
      <div
        className="h-1 w-full bg-gradient-to-r from-primary via-primary-soft to-gold opacity-60 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="bg-accent px-2 py-0.5 font-semibold text-accent-foreground">
            {post.category}
          </span>
          <span>{post.dateLabel}</span>
        </div>
        <h3 className="font-display text-xl leading-snug transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs">
          <span className="text-muted-foreground">{post.readingTime}</span>
          <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-primary">
            Ler artigo
            <ArrowRight
              size={14}
              className="text-gold transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function FeaturedPostCard({ post }: { post: Post }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="card-lift navy-gradient group relative block overflow-hidden text-secondary-foreground"
    >
      <div className="topo-lines absolute inset-0 text-secondary-foreground/10" aria-hidden />
      <div className="relative flex flex-col gap-4 p-8 md:p-12">
        <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.2em]">
          <span className="bg-gold px-2.5 py-1 font-bold text-secondary">Em destaque</span>
          <span className="font-semibold text-gold">{post.category}</span>
          <span className="text-secondary-foreground/60">{post.dateLabel}</span>
        </div>
        <h2 className="max-w-3xl font-display text-3xl leading-tight !text-secondary-foreground transition-colors group-hover:!text-gold md:text-4xl">
          {post.title}
        </h2>
        <p className="max-w-2xl leading-relaxed text-secondary-foreground/75">{post.excerpt}</p>
        <div className="mt-2 flex items-center gap-4 text-xs">
          <span className="text-secondary-foreground/60">
            Por {post.author} · {post.readingTime}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-gold">
            Ler artigo
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
