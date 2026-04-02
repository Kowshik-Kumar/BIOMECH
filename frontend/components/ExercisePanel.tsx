import { Activity, Repeat } from "lucide-react";

type ExercisePanelProps = {
  name: string;
  reps: number;
  target: number;
};

export default function ExercisePanel({ name, reps, target }: ExercisePanelProps) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 text-cyan-200">
        <Activity size={16} />
        <h3 className="font-[var(--font-sora)] text-sm font-semibold uppercase tracking-[0.16em]">Exercise</h3>
      </div>
      <p className="mt-4 text-xl font-semibold text-slate-100">{name}</p>
      <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-600/60 bg-slate-900/50 p-3">
        <p className="text-sm text-slate-300">Repetitions</p>
        <p className="inline-flex items-center gap-2 text-lg font-bold text-emerald-300">
          <Repeat size={16} /> {reps}/{target}
        </p>
      </div>
    </section>
  );
}
