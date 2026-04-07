import { CircleAlert, CircleCheck } from "lucide-react";
import type { RuleOutcome } from "@/lib/biomechanics/types";

type FeedbackPanelProps = {
  postureOk: boolean | null;
  errors: RuleOutcome[];
};

export default function FeedbackPanel({ postureOk, errors }: FeedbackPanelProps) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Real-Time Feedback</h3>

      {postureOk === null && <p className="mt-3 text-sm text-slate-300">Detecting posture...</p>}

      {postureOk === true && (
        <div className="mt-4 rounded-xl border border-lime-400/50 bg-lime-500/10 p-4 text-sm text-lime-100">
          <p className="inline-flex items-center gap-2 font-semibold">
            <CircleCheck size={15} /> Correct posture
          </p>
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mt-4 space-y-3">
          {errors.map((error) => (
            <li key={`${error.rule}-${error.message}`} className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-3">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-100">
                <CircleAlert size={15} /> {error.rule}
              </p>
              <p className="mt-1 text-xs text-slate-200">{error.message}</p>
              <p className="mt-2 text-xs text-slate-300">
                value: {error.value} | expected: {error.expected} | severity: {error.severity}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
