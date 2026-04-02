"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ProgressPanelProps = {
  data: Array<{
    time: string;
    kneeAngle: number;
    pelvisTilt: number;
    elbowAngle: number;
  }>;
};

export default function ProgressPanel({ data }: ProgressPanelProps) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-[var(--font-sora)] text-sm font-semibold uppercase tracking-[0.16em] text-amber-200">Progress</h3>
      <div className="mt-4 h-64 rounded-xl border border-slate-600/60 bg-slate-900/40 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="time" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
            <YAxis tick={{ fill: "#cbd5e1", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: "rgba(15,23,42,0.95)",
                border: "1px solid rgba(148,163,184,0.35)",
                borderRadius: "10px",
              }}
            />
            <Line type="monotone" dataKey="kneeAngle" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pelvisTilt" stroke="#eab308" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="elbowAngle" stroke="#84cc16" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
