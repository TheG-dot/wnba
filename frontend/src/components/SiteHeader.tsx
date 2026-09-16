import { motion } from "motion/react";
import { Activity } from "lucide-react";

export function SiteHeader() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-glass-border bg-background/70 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand shadow-brand-glow">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight sm:text-base">
              WNBA <span className="text-gradient-brand">Spread Predictor</span>
            </p>
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Advanced analytics &amp; machine learning pipeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-over opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-over" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Model live
          </span>
        </div>
      </div>
    </motion.header>
  );
}
