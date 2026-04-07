"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleAlert, CircleCheck } from "lucide-react";
import { loadSessions } from "@/lib/biomechanics/storage";
import type { AnalysisResult } from "@/lib/biomechanics/types";

export default function SportsSessionsPage() {
  const [sessions, setSessions] = useState<AnalysisResult[]>([]);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  return (
    <main className="min-h-screen bg-hero-mesh px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/sports" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-amber-200">
          <ArrowLeft size={14} /> Back To Sports
        </Link>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">Cricket Analysis History</h1>
        <p className="mt-2 text-sm text-slate-300">Sessions are stored in browser LocalStorage with detected rule violations.</p>

        {sessions.length === 0 && (
          <div className="glass-card mt-6 rounded-2xl p-5 text-sm text-slate-300">
            No session history found. Run analysis from the cricket page to create records.
          </div>
        )}

        {sessions.length > 0 && (
          <div className="mt-6 space-y-4">
            {sessions.map((session) => (
              <article key={session.timestamp} className="glass-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">{session.exercise}</h2>
                  <p className="text-xs text-slate-300">{new Date(session.timestamp).toLocaleString()}</p>
                </div>

                {session.errors.length === 0 && (
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-lime-400/40 bg-lime-500/10 px-3 py-2 text-xs text-lime-100">
                    <CircleCheck size={13} /> No rule violations detected
                  </p>
                )}

                {session.errors.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {session.errors.map((error) => (
                      <li
                        key={`${session.timestamp}-${error.rule}`}
                        className="rounded-lg border border-rose-300/25 bg-rose-500/10 px-3 py-2"
                      >
                        <p className="inline-flex items-center gap-2 text-sm font-semibold text-rose-100">
                          <CircleAlert size={13} /> {error.rule}
                        </p>
                        <p className="mt-1 text-xs text-slate-200">{error.message}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          value: {error.value} | expected: {error.expected} | severity: {error.severity}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
