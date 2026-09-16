import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Link2, Star } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/SectionCard";
import { FavoriteList } from "@/components/FavoriteList";
import { buildShareUrl, useFavorites } from "@/lib/favorites";
import { useHaptic } from "@/hooks/use-haptic";

export function FavoritesSection() {
  const haptic = useHaptic();
  const { favorites, remove, clear } = useFavorites();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    haptic([10, 25, 10]);
    if (favorites.length === 0) return;
    const url = buildShareUrl(favorites);
    setShareUrl(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Share link copied", { description: "Anyone with the link sees this slate." });
    } catch {
      toast.message("Share link ready", { description: "Copy it from the field below." });
    }
  };

  return (
    <SectionCard
      title="My Favorite Matchups"
      subtitle="Saved locally on this device"
      delay={0.05}
      action={
        favorites.length ? (
          <button
            type="button"
            onClick={() => {
              clear();
              setShareUrl(null);
            }}
            className="rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-destructive"
          >
            Clear all
          </button>
        ) : null
      }
    >
      {favorites.length === 0 ? (
        <div className="glass-row flex flex-col items-center gap-2 p-8 text-center">
          <Star className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-semibold">No favorites yet</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            Tap the star on any slate matchup or predictor result to pin it here, then generate a
            shareable summary link.
          </p>
        </div>
      ) : (
        <>
          <FavoriteList items={favorites} onRemove={remove} />

          <motion.button
            type="button"
            onClick={generate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-6 py-4 text-sm font-extrabold uppercase tracking-widest text-primary-foreground shadow-brand-glow"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Link copied" : "Generate share link"}
          </motion.button>

          <AnimatePresence>
            {shareUrl ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-row mt-3 flex items-center gap-2 p-2">
                  <input
                    readOnly
                    aria-label="Shareable summary link"
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent px-2 text-xs text-muted-foreground outline-none"
                  />
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.88 }}
                    onClick={() => {
                      navigator.clipboard?.writeText(shareUrl);
                      toast.success("Copied");
                    }}
                    className="rounded-lg border border-glass-border bg-glass p-2 text-muted-foreground hover:text-foreground"
                    aria-label="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-widest text-flame-soft"
                >
                  Preview summary →
                </a>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      )}
    </SectionCard>
  );
}
