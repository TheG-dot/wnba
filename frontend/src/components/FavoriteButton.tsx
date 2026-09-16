import { motion } from "motion/react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useFavorites, type FavoriteMatchup } from "@/lib/favorites";
import { useHaptic } from "@/hooks/use-haptic";

export function FavoriteButton({
  matchup,
  label = false,
}: {
  matchup: Omit<FavoriteMatchup, "savedAt">;
  label?: boolean;
}) {
  const haptic = useHaptic();
  const { toggle, isFavorite } = useFavorites();
  const active = isFavorite(matchup.id);

  return (
    <motion.button
      type="button"
      aria-label={active ? "Remove from favorites" : "Save matchup to favorites"}
      aria-pressed={active}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.85 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      onClick={(e) => {
        e.stopPropagation();
        haptic([8, 20, 8]);
        const added = toggle(matchup);
        toast[added ? "success" : "message"](
          added ? "Saved to favorites" : "Removed from favorites",
          { description: `${matchup.away} @ ${matchup.home}` },
        );
      }}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "border-flame/50 bg-gradient-brand-soft text-flame-soft"
          : "border-glass-border bg-glass text-muted-foreground hover:text-foreground"
      }`}
    >
      <motion.span
        key={String(active)}
        initial={{ scale: 0.5, rotate: -35 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 14 }}
        className="inline-flex"
      >
        <Star className={`h-3.5 w-3.5 ${active ? "fill-current" : ""}`} />
      </motion.span>
      {label ? (active ? "Saved" : "Save") : null}
    </motion.button>
  );
}
