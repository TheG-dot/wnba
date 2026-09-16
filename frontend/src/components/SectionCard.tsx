import { motion } from "motion/react";
import type { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  delay = 0,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-panel p-5 sm:p-7 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-xl">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}
