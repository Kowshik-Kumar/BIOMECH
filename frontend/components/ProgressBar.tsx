type ProgressBarProps = {
  label: string;
  value: number;
  color?: "green" | "blue" | "yellow" | "red";
};

const COLOR_CLASS: Record<NonNullable<ProgressBarProps["color"]>, string> = {
  green: "bg-emerald-500",
  blue: "bg-blue-500",
  yellow: "bg-amber-400",
  red: "bg-rose-500",
};

export default function ProgressBar({ label, value, color = "green" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span className="font-semibold text-slate-100">{safeValue}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-700/70">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${COLOR_CLASS[color]}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
