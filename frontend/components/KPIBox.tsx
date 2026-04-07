import ProgressBar from "@/components/ProgressBar";

type KPIBoxProps = {
  label: string;
  value: string;
  progress: number;
  accent?: "green" | "blue" | "yellow";
  detail: string;
};

const ACCENT_CLASS: Record<NonNullable<KPIBoxProps["accent"]>, string> = {
  green: "from-emerald-500/30 to-emerald-500/5 border-emerald-400/40",
  blue: "from-blue-500/30 to-blue-500/5 border-blue-400/40",
  yellow: "from-amber-400/30 to-amber-400/5 border-amber-300/40",
};

const PROGRESS_COLOR: Record<NonNullable<KPIBoxProps["accent"]>, "green" | "blue" | "yellow"> = {
  green: "green",
  blue: "blue",
  yellow: "yellow",
};

export default function KPIBox({ label, value, progress, detail, accent = "green" }: KPIBoxProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const ring = {
    background: `conic-gradient(rgb(34 197 94) ${safeProgress * 3.6}deg, rgba(148, 163, 184, 0.22) 0deg)`,
  };

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 shadow-lg transition duration-300 hover:scale-[1.03] ${ACCENT_CLASS[accent]}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-slate-100">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{detail}</p>
        </div>
        <div className="relative grid h-14 w-14 place-items-center rounded-full p-[6px]" style={ring}>
          <div className="grid h-full w-full place-items-center rounded-full bg-slate-900/95 text-[11px] font-semibold text-slate-100">
            {safeProgress}%
          </div>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar label="Current" value={safeProgress} color={PROGRESS_COLOR[accent]} />
      </div>
    </article>
  );
}
