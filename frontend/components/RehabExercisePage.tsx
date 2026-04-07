"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import CameraFeed from "@/components/CameraFeed";
import HistoryPanel from "@/components/HistoryPanel";
import MetricRow from "@/components/MetricRow";
import ProgressBar from "@/components/ProgressBar";
import StatusBadge from "@/components/StatusBadge";
import type { AnalysisResult, RuleOutcome } from "@/lib/biomechanics/types";
import type { RehabConfig } from "@/lib/rehabConfig";

type AnalyzeResponse = {
  timestamp: string;
  posture_ok: boolean;
  errors: RuleOutcome[];
};

type RehabExercisePageProps = {
  config: RehabConfig;
};

export default function RehabExercisePage({ config }: RehabExercisePageProps) {
  const [latest, setLatest] = useState<AnalyzeResponse | null>(null);
  const [sessions, setSessions] = useState<AnalysisResult[]>([]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [sessions]);

  const progressValue = useMemo(() => {
    if (!latest) {
      return 62;
    }
    const penalty = Math.min(42, latest.errors.length * 12);
    return Math.max(42, 100 - penalty);
  }, [latest]);

  const statusTone = latest?.posture_ok === true ? "correct" : latest?.posture_ok === false ? "warning" : "info";
  const statusText = latest?.posture_ok === true ? "Form Correct" : latest?.posture_ok === false ? "Adjust Posture" : "Tracking";

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/rehab" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-blue-200">
          <ChevronLeft size={16} /> Back To Rehab
        </Link>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">{config.title}</h1>
        <p className="mt-2 text-sm text-slate-300">{config.shortDescription}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
          <CameraFeed injuryType={config.injuryType} onAnalysis={setLatest} onHistoryUpdate={setSessions} />

          <section className="space-y-4">
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Exercise Guidance</h3>
                <StatusBadge status={statusTone} text={statusText} />
              </div>

              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
                {config.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ol>

              <div className="mt-5 space-y-3">
                <ProgressBar label="Recovery Progress" value={progressValue} color="green" />
                <ProgressBar label="Session Precision" value={Math.max(40, progressValue - 7)} color="blue" />
              </div>
            </section>

            <section className="glass-card rounded-2xl p-5">
              <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Live Quality Signals</h3>
              <div className="mt-4 space-y-3">
                <MetricRow
                  label="Correct / Incorrect"
                  value={latest?.posture_ok ? "Correct" : latest ? "Needs Correction" : "Initializing"}
                  status={latest?.posture_ok ? "correct" : latest ? "warning" : "info"}
                />
                <MetricRow
                  label="Observed Deviations"
                  value={`${latest?.errors.length ?? 0}`}
                  status={(latest?.errors.length ?? 0) > 0 ? "error" : "correct"}
                />
                <MetricRow
                  label="Latest Analysis Time"
                  value={latest ? new Date(latest.timestamp).toLocaleTimeString() : "--:--:--"}
                  helper="Updated automatically from live posture stream"
                />
              </div>
            </section>
          </section>
        </div>

        <HistoryPanel sessions={sortedSessions} title="Session History" />
      </div>
    </main>
  );
}
