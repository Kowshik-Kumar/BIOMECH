import type { AnalysisResult } from "@/lib/biomechanics/types";

type HistoryPanelProps = {
  sessions: AnalysisResult[];
  title?: string;
};

export default function HistoryPanel({ sessions, title = "Session History" }: HistoryPanelProps) {
  return (
    <section className="glass-card mt-6 rounded-2xl p-5">
      <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">{title}</h3>

      {sessions.length === 0 && (
        <p className="mt-3 text-sm text-slate-300">No sessions yet. Start movement to create history.</p>
      )}

      {sessions.length > 0 && (
        <div className="mt-4 space-y-3">
          {sessions.slice(0, 8).map((session) => (
            <article key={`${session.exercise}-${session.timestamp}`} className="rounded-xl border border-slate-600/70 bg-slate-900/45 p-3 text-sm">
              <p className="font-semibold text-slate-100">{session.exercise}</p>
              <p className="mt-1 text-xs text-slate-300">{new Date(session.timestamp).toLocaleString()}</p>
              <p className="mt-2 text-xs text-slate-300">Detected issues: {session.errors.length}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
