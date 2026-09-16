import { motion, AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";
import type { FavoriteMatchup } from "@/lib/favorites";

export function FavoriteRow({
  fav,
  onRemove,
  index = 0,
}: {
  fav: FavoriteMatchup;
  onRemove?: ((id: string) => void) | undefined;
  index?: number | undefined;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -24, scale: 0.96 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="glass-row flex items-center gap-3 p-3.5"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">
          {fav.away} <span className="text-muted-foreground">@</span> {fav.home}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {fav.tipoff ? `${fav.tipoff} · ` : ""}Pick{" "}
          <span className="text-foreground/90">{fav.winner}</span>
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-brand"
            initial={{ width: 0 }}
            animate={{ width: `${fav.confidence}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="rounded-lg bg-gradient-brand-soft px-2.5 py-1 text-sm font-extrabold text-flame-soft">
          -{fav.margin}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {fav.confidence}% conf
        </span>
      </div>
      {onRemove ? (
        <motion.button
          type="button"
          aria-label="Remove favorite"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => onRemove(fav.id)}
          className="shrink-0 rounded-lg border border-glass-border bg-glass p-2 text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </motion.button>
      ) : null}
    </motion.div>
  );
}

export function FavoriteList({
  items,
  onRemove,
}: {
  items: FavoriteMatchup[];
  onRemove?: ((id: string) => void) | undefined;
}) {
  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false} mode="popLayout">
        {items.map((f, i) => (
          <FavoriteRow key={f.id} fav={f} index={i} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  );
}
