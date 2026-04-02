import { AlertTriangle } from "lucide-react";

type PostureErrorsPanelProps = {
  errors: string[];
};

export default function PostureErrorsPanel({ errors }: PostureErrorsPanelProps) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 text-amber-200">
        <AlertTriangle size={16} />
        <h3 className="font-[var(--font-sora)] text-sm font-semibold uppercase tracking-[0.16em]">Posture Errors</h3>
      </div>
      <ul className="mt-4 space-y-3">
        {errors.map((error) => (
          <li key={error} className="rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </li>
        ))}
      </ul>
    </section>
  );
}
