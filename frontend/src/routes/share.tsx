import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, Share2 } from "lucide-react";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { SiteHeader } from "@/components/SiteHeader";
import { SectionCard } from "@/components/SectionCard";
import { FavoriteList } from "@/components/FavoriteList";
import { decodeShare } from "@/lib/favorites";

const TITLE = "Shared WNBA Matchup Slate | Spread Predictor";
const DESCRIPTION =
  "A shared summary of favorite WNBA matchups with model-projected winners, point margins and confidence ratings.";

export const Route = createFileRoute("/share")({
  validateSearch: (search: Record<string, unknown>) => ({
    d: typeof search["d"] === "string" ? (search["d"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { d } = Route.useSearch();
  const items = decodeShare(d);

  const avgConfidence = items.length
    ? Math.round(items.reduce((a, b) => a + b.confidence, 0) / items.length)
    : 0;

  return (
    <div className="min-h-screen">
      <BackgroundBlobs />
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            <Share2 className="h-3 w-3" /> Shared slate
          </span>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Favorite <span className="text-gradient-brand">Matchups</span>
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            {items.length
              ? `${items.length} saved matchup${items.length > 1 ? "s" : ""} · ${avgConfidence}% average model confidence`
              : "This link doesn't contain any matchups."}
          </p>
        </motion.div>

        <SectionCard title="Summary" subtitle="Model-projected winners and margins">
          {items.length ? (
            <FavoriteList items={items} />
          ) : (
            <p className="p-6 text-center text-sm text-muted-foreground">
              The share link is empty or invalid.
            </p>
          )}
        </SectionCard>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-glass-border bg-glass px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-foreground transition-colors hover:border-flame/40"
          >
            <ArrowLeft className="h-4 w-4" /> Build your own slate
          </Link>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          Projections are modeled estimates for entertainment purposes. Bet responsibly.
        </p>
      </main>
    </div>
  );
}
