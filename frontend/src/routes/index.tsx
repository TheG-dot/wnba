import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BackgroundBlobs } from "@/components/BackgroundBlobs";
import { SiteHeader } from "@/components/SiteHeader";
import { LiveSlateSection } from "@/components/LiveSlateSection";
import { MatchupPredictor } from "@/components/MatchupPredictor";
import { ModelInsights } from "@/components/ModelInsights";
import { FavoritesSection } from "@/components/FavoritesSection";

const TITLE = "WNBA Point Spread & Player Prop Predictor";
const DESCRIPTION =
  "Machine-learning WNBA spread predictions, nightly best bets and player prop projections with walk-forward validated model metrics.";

export const Route = createFileRoute("/")({
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
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <BackgroundBlobs />
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-9 text-center"
        >
          <span className="inline-block rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Gradient-boosted spread engine
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            WNBA <span className="text-gradient-brand">Spread Predictor</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Nightly point-spread and player-prop projections powered by an advanced machine
            learning pipeline.
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          <LiveSlateSection />
          <div className="grid gap-6 lg:grid-cols-2">
            <MatchupPredictor />
            <ModelInsights />
          </div>
          <FavoritesSection />
        </div>

        <p className="mt-10 text-center text-[11px] text-muted-foreground">
          Projections are modeled estimates for entertainment purposes. Bet responsibly.
        </p>
      </main>
    </div>
  );
}
