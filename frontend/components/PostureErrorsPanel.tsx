import { AlertTriangle, CircleAlert, CircleCheck } from "lucide-react";
import type { RuleOutcome } from "@/lib/biomechanics/types";

type PostureErrorsPanelProps = {
  errors: Array<string | RuleOutcome>;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
};

function isRuleOutcome(error: string | RuleOutcome): error is RuleOutcome {
  return typeof error !== "string";
}

export default function PostureErrorsPanel({
  errors,
  title = "Posture Errors",
  subtitle,
  emptyMessage = "No live posture errors detected.",
}: PostureErrorsPanelProps) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 text-amber-200">
        <AlertTriangle size={16} />
        <div>
          <h3 className="font-[var(--font-sora)] text-sm font-semibold uppercase tracking-[0.16em]">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-300">{subtitle}</p>}
        </div>
      </div>
      {errors.length === 0 ? (
        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100">
          <div className="flex items-center gap-2 font-semibold">
            <CircleCheck size={15} /> Clear frame
          </div>
          <p className="mt-1 text-xs text-emerald-100/80">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {errors.map((error) =>
            isRuleOutcome(error) ? (
              <li key={`${error.rule}-${error.message}`} className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">
                <div className="flex items-center gap-2 font-semibold">
                  <CircleAlert size={15} /> {error.rule}
                </div>
                <p className="mt-1 text-xs text-slate-200">{error.message}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-rose-100/75">
                  value: {error.value} | expected: {error.expected} | severity: {error.severity}
                </p>
              </li>
            ) : (
              <li key={error} className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
