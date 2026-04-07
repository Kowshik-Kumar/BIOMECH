"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import CameraFeed from "@/components/CameraFeed";
import MetricRow from "@/components/MetricRow";
import ProgressBar from "@/components/ProgressBar";
import StatusBadge from "@/components/StatusBadge";
import type { AnalysisResult, RuleOutcome } from "@/lib/biomechanics/types";

type AnalyzeResponse = {
  timestamp: string;
  posture_ok: boolean;
  errors: RuleOutcome[];
};

export default function CricketPage() {
  const [latest, setLatest] = useState<AnalyzeResponse | null>(null);
  const [sessions, setSessions] = useState<AnalysisResult[]>([]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [sessions]);

  const errors = latest?.errors ?? [];
  const postureScore = Math.max(44, 100 - errors.length * 11);
  const errorByKeyword = (keyword: string) => {
    const lower = keyword.toLowerCase();
    return errors.find((entry) => entry.rule.toLowerCase().includes(lower) || entry.message.toLowerCase().includes(lower));
  };

  const elbowIssue = errorByKeyword("elbow");
  const kneeIssue = errorByKeyword("knee");
  const armIssue = errorByKeyword("arm");
  const riskLabel = errors.some((e) => e.severity.toLowerCase().includes("high")) ? "High" : errors.length >= 2 ? "Medium" : "Low";

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-blue-200">
          <ChevronLeft size={16} /> Back
        </Link>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">Cricket Performance Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">Analyze bowling mechanics with live posture score and risk-focused diagnostics.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_0.5fr]">
          <CameraFeed injuryType="cricket_bowling" onAnalysis={setLatest} onHistoryUpdate={setSessions} />

          <section className="space-y-4">
            <section className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Performance Panel</h3>
                <StatusBadge status={errors.length > 0 ? "warning" : "correct"} text={errors.length > 0 ? "Adjustments Needed" : "Optimal Form"} />
              </div>

              <div className="mt-4 space-y-3">
                <MetricRow label="Posture Score" value={`${postureScore}%`} status={postureScore >= 80 ? "correct" : "warning"} />
                <MetricRow label="Elbow Angle" value={elbowIssue ? "Out of range" : "Stable"} status={elbowIssue ? "warning" : "correct"} helper={elbowIssue?.expected ?? "Within expected range"} />
                <MetricRow label="Knee Alignment" value={kneeIssue ? "Deviation detected" : "Aligned"} status={kneeIssue ? "error" : "correct"} helper={kneeIssue?.message ?? "Knee axis is stable"} />
                <MetricRow label="Arm Position" value={armIssue ? "Needs adjustment" : "On target"} status={armIssue ? "warning" : "correct"} helper={armIssue?.message ?? "Release arm path is clean"} />
              </div>

              <div className="mt-5 space-y-3">
                <ProgressBar label="Movement Efficiency" value={Math.max(40, postureScore - 6)} color="green" />
                <ProgressBar label="Injury Risk" value={riskLabel === "High" ? 82 : riskLabel === "Medium" ? 58 : 24} color={riskLabel === "High" ? "red" : riskLabel === "Medium" ? "yellow" : "green"} />
              </div>
            </section>
          </section>
        </div>

        <section className="glass-card mt-6 rounded-2xl p-5">
          <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Error Log</h2>
          {errors.length === 0 && <p className="mt-3 text-sm text-slate-300">No live posture errors in the latest frame window.</p>}

          {errors.length > 0 && (
            <div className="mt-4 space-y-3">
              {errors.map((error) => (
                <article key={`${error.rule}-${error.message}`} className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm">
                  <p className="font-semibold text-rose-100">{error.rule}</p>
                  <p className="mt-1 text-xs text-slate-200">{error.message}</p>
                  <p className="mt-2 text-xs text-slate-300">value: {error.value} | expected: {error.expected} | severity: {error.severity}</p>
                </article>
              ))}
            </div>
          )}

          {sortedSessions.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-700/70 bg-slate-900/45 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent Sessions</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {sortedSessions.slice(0, 3).map((session) => (
                  <article key={session.timestamp} className="rounded-xl border border-slate-700/80 bg-slate-950/45 p-3 text-sm">
                    <p className="font-semibold text-slate-100">{session.exercise}</p>
                    <p className="mt-1 text-xs text-slate-300">{new Date(session.timestamp).toLocaleString()}</p>
                    <p className="mt-2 text-xs text-slate-300">{session.errors.length} issue(s) captured</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
