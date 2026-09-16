import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/lib/api";
import { SectionCard } from "@/components/SectionCard";

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="glass-row flex-1 p-4 text-center"
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold text-gradient-brand">
        {value}
        {suffix ? <span className="text-sm">{suffix}</span> : null}
      </p>
    </motion.div>
  );
}

export function ModelInsights() {
  const { data } = useQuery({ queryKey: ["stats"], queryFn: fetchStats });

  return (
    <SectionCard
      title="Model Insights & Validation"
      subtitle="Walk-forward backtest across the last three seasons"
      delay={0.1}
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Walk-forward RMSE" value={data ? data.rmse.toFixed(2) : "--"} />
        <Metric label="Walk-forward MAE" value={data ? data.mae.toFixed(2) : "--"} />
        <Metric
          label="ATS accuracy"
          value={data ? data.accuracy.toFixed(1) : "--"}
          suffix="%"
        />
        <Metric label="Games tested" value={data ? data.sampleSize.toLocaleString() : "--"} />
      </div>

      <h3 className="mb-3 mt-7 text-xs font-bold uppercase tracking-[0.2em] text-violet-soft">
        Feature importance
      </h3>
      <div className="flex flex-col gap-3">
        {(data?.features ?? []).map((f, i) => (
          <div key={f.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-xs text-muted-foreground sm:w-44 sm:text-sm">
              {f.label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-gradient-brand"
                initial={{ width: 0 }}
                whileInView={{ width: `${f.value}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-bold">{f.value}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
