import { CalendarDays, Clock4 } from "lucide-react";

type SessionCardProps = {
  date: string;
  exercise: string;
  duration: string;
};

export default function SessionCard({ date, exercise, duration }: SessionCardProps) {
  return (
    <article className="glass-card rounded-2xl p-4 transition hover:border-cyan-300/50">
      <div className="flex gap-4">
        <div className="h-20 w-28 rounded-xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/20" />
        <div className="flex-1">
          <p className="font-[var(--font-sora)] text-base font-semibold text-slate-100">{exercise}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={13} /> {date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock4 size={13} /> {duration}
            </span>
          </div>
          <button className="mt-3 rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20">
            View Analysis
          </button>
        </div>
      </div>
    </article>
  );
}
