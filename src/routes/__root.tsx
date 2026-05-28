import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-primary">404</h1>
        <h2 className="mt-4 font-display text-2xl">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary-soft"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">Algo deu errado ao carregar esta página</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-sm bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary-foreground hover:bg-primary-soft"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-sm border border-input bg-background px-4 py-2 text-sm font-semibold uppercase tracking-wider text-foreground hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cartório de Notas — 2º Ofício de Itabaiana/SE" },
      {
        name: "description",
        content:
          "Cartório de Notas — 2º Ofício de Itabaiana/SE. Escrituras, procurações, reconhecimento de firma, autenticações e atos notariais com fé pública.",
      },
      { name: "author", content: "CN2O — César Bravo, Tabelião" },
      { property: "og:site_name", content: "CN2O — 2º Ofício de Itabaiana" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Cartório de Notas — 2º Ofício de Itabaiana/SE" },
      {
        property: "og:description",
        content:
          "Tradição e modernidade a serviço dos cidadãos de Itabaiana e região.",
      },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#631325" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Cartório de Notas — 2º Ofício de Itabaiana/SE",
          image: "/og-default.jpg",
          telephone: "+55-79-99944-0969",
          email: "cesar.bravo@cn2oita.com.br",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Avenida Ivo de Carvalho, 441",
            addressLocality: "Itabaiana",
            addressRegion: "SE",
            postalCode: "49500-064",
            addressCountry: "BR",
          },
          openingHours: "Mo-Fr 08:00-17:00",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
