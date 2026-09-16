import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Flame, TrendingDown, TrendingUp } from "lucide-react";
import { fetchLive, type Game, type PropBet } from "@/lib/api";
import { SectionCard } from "@/components/SectionCard";
import { FavoriteButton } from "@/components/FavoriteButton";
import { makeFavoriteId } from "@/lib/favorites";
import { useHaptic } from "@/hooks/use-haptic";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function GameRow({ game }: { game: Game }) {
  const haptic = useHaptic();
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.97 }}
      onTapStart={() => haptic()}
      className="glass-row group flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:border-flame/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{game.matchup}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {game.tipoff} · Pick <span className="text-foreground/90">{game.predictedWinner}</span>
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-brand"
            initial={{ width: 0 }}
            whileInView={{ width: `${game.confidence}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="rounded-lg bg-gradient-brand-soft px-2.5 py-1 text-sm font-extrabold text-flame-soft">
          +{game.margin}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          {game.confidence}% conf
        </span>
      </div>
      <FavoriteButton
        matchup={{
          id: makeFavoriteId(game.home, game.away),
          home: game.home,
          away: game.away,
          winner: game.predictedWinner,
          margin: game.margin,
          confidence: game.confidence,
          tipoff: game.tipoff,
        }}
      />
    </motion.div>
  );
}


function PropCard({ bet }: { bet: PropBet }) {
  const haptic = useHaptic();
  const isOver = bet.recommendation === "OVER";
  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      onTapStart={() => haptic()}
      className="glass-row flex w-[16rem] shrink-0 snap-center flex-col gap-3 p-4 sm:w-auto sm:shrink"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{bet.player}</p>
          <p className="text-xs text-muted-foreground">
            {bet.team} · {bet.propType}
          </p>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
            isOver ? "bg-over/15 text-over" : "bg-under/15 text-under"
          }`}
        >
          {isOver ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {bet.recommendation}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Line</p>
          <p className="text-lg font-extrabold">{bet.line}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Projection</p>
          <p className="text-lg font-extrabold text-gradient-brand">{bet.projection}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Flame className="h-3.5 w-3.5 text-flame" />
        {bet.edge} pt model edge
      </div>
    </motion.article>
  );
}

export function LiveSlateSection() {
  const { data, isLoading } = useQuery({ queryKey: ["live"], queryFn: fetchLive });

  return (
    <SectionCard
      title="Tomorrow's Slate & Best Bets"
      subtitle="Model output refreshed 6 minutes ago"
      action={
        <span className="rounded-full border border-glass-border bg-glass px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {data ? `${data.games.length} games` : "loading"}
        </span>
      }
    >
      <div className="grid gap-7 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-soft">
            Matchups
          </h3>
          {isLoading ? (
            <SkeletonRows />
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="thin-scrollbar flex max-h-[19rem] flex-col gap-3 overflow-y-auto pr-2"
            >
              {data?.games.map((g) => <GameRow key={g.id} game={g} />)}
            </motion.div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-violet-soft">
            Player Props
            <span className="ml-2 font-medium normal-case tracking-normal text-muted-foreground lg:hidden">
              swipe →
            </span>
          </h3>
          {isLoading ? (
            <SkeletonRows />
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 lg:thin-scrollbar lg:mx-0 lg:max-h-[19rem] lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:px-0 lg:pr-2"
            >
              {data?.bestBets.map((b) => <PropCard key={b.id} bet={b} />)}
            </motion.div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass-row h-20 animate-pulse opacity-60" />
      ))}
    </div>
  );
}
