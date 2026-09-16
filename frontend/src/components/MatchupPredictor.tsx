import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Sparkles, Trophy } from "lucide-react";
import { fetchPrediction, fetchTeams, type Prediction } from "@/lib/api";
import { SectionCard } from "@/components/SectionCard";
import { FavoriteButton } from "@/components/FavoriteButton";
import { makeFavoriteId } from "@/lib/favorites";
import { useHaptic } from "@/hooks/use-haptic";

const STAGES = [
  "Pulling rolling team ratings…",
  "Modeling rest & travel load…",
  "Simulating 10,000 possessions…",
  "Calibrating spread distribution…",
];

function TeamSelect({
  label,
  value,
  onChange,
  teams,
  side,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  teams: string[];
  side: "home" | "away";
}) {
  return (
    <div className="flex-1">
      <p
        className={`mb-2 text-[10px] font-bold uppercase tracking-[0.2em] ${
          side === "home" ? "text-flame" : "text-violet-soft"
        }`}
      >
        {label}
      </p>
      <div className="relative">
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-glass-border bg-secondary/60 px-4 py-3.5 pr-10 text-sm font-semibold text-foreground outline-none transition-colors focus:border-flame/60 focus:ring-2 focus:ring-ring/40"
        >
          <option value="">Select team…</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

function Calculating() {
  return (
    <motion.div
      key="calc"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="glass-row mt-6 flex flex-col items-center gap-4 p-8"
    >
      <div className="relative h-20 w-20">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-flame/70 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-3 rounded-full border-2 border-violet/70 border-b-transparent"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-7 rounded-full bg-gradient-brand"
          animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="h-5 overflow-hidden text-center">
        <AnimatePresence mode="wait">
          {STAGES.map((s, i) => (
            <StageLine key={s} text={s} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function StageLine({ text, index }: { text: string; index: number }) {
  return (
    <motion.p
      className="text-xs text-muted-foreground"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
      transition={{ duration: 2.2, times: [0, 0.15, 0.8, 1], delay: index * 0.55 }}
      style={{ position: "absolute", left: 0, right: 0 }}
    >
      {text}
    </motion.p>
  );
}

function ResultCard({ result, home, away }: { result: Prediction; home: string; away: string }) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="glass-row mt-6 overflow-hidden bg-gradient-brand-soft p-6 text-center"
    >
      <motion.div
        initial={{ rotate: -20, scale: 0 }}
        animate={{ rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-brand-glow"
      >
        <Trophy className="h-6 w-6 text-primary-foreground" />
      </motion.div>

      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Projected winner
      </p>
      <h3 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{result.winner}</h3>

      <div className="mt-4 inline-flex items-baseline gap-2 rounded-2xl border border-glass-border bg-background/40 px-5 py-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">By</span>
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl font-extrabold text-gradient-brand"
        >
          {result.margin}
        </motion.span>
        <span className="text-xs uppercase tracking-widest text-muted-foreground">points</span>
      </div>

      <div className="mx-auto mt-4 max-w-md">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Model confidence</span>
          <span className="font-bold text-foreground">{result.confidence}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-gradient-brand"
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{result.restNote}</p>
        <div className="mt-4 flex justify-center">
          <FavoriteButton
            label
            matchup={{
              id: makeFavoriteId(home, away),
              home,
              away,
              winner: result.winner,
              margin: result.margin,
              confidence: result.confidence,
              note: result.restNote,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function MatchupPredictor() {
  const haptic = useHaptic();
  const { data: teams = [] } = useQuery({ queryKey: ["teams"], queryFn: fetchTeams });
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    haptic([10, 30, 10]);
    if (!home || !away) return setError("Select both a home and an away team.");
    if (home === away) return setError("Home and away teams must be different.");
    setError(null);
    setResult(null);
    setStatus("loading");
    const res = await fetchPrediction(home, away);
    setResult(res);
    setStatus("done");
    haptic(24);
  };

  return (
    <SectionCard
      title="Matchup Predictor"
      subtitle="Head-to-head spread simulation"
      delay={0.05}
    >
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
        <TeamSelect label="Home" value={home} onChange={setHome} teams={teams} side="home" />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-brand text-xs font-extrabold text-primary-foreground shadow-brand-glow"
        >
          VS
        </motion.div>
        <TeamSelect label="Away" value={away} onChange={setAway} teams={teams} side="away" />
      </div>

      <motion.button
        type="button"
        onClick={run}
        disabled={status === "loading"}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-6 py-4 text-sm font-extrabold uppercase tracking-widest text-primary-foreground shadow-brand-glow disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {status === "loading" ? "Analyzing…" : "Predict Spread"}
      </motion.button>

      {error ? (
        <motion.p
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
          className="mt-3 text-center text-xs font-semibold text-destructive"
        >
          {error}
        </motion.p>
      ) : null}

      <AnimatePresence mode="wait">
        {status === "loading" ? <Calculating /> : null}
        {status === "done" && result ? <ResultCard result={result} home={home} away={away} /> : null}
      </AnimatePresence>
    </SectionCard>
  );
}
