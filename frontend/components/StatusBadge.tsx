type StatusType = "correct" | "error" | "warning" | "info";

type StatusBadgeProps = {
  status: StatusType;
  text: string;
};

const STATUS_STYLE: Record<StatusType, string> = {
  correct: "border-emerald-400/45 bg-emerald-500/15 text-emerald-100",
  error: "border-rose-400/45 bg-rose-500/15 text-rose-100",
  warning: "border-amber-400/45 bg-amber-500/15 text-amber-100",
  info: "border-blue-400/45 bg-blue-500/15 text-blue-100",
};

export default function StatusBadge({ status, text }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${STATUS_STYLE[status]}`}>
      {text}
    </span>
  );
}
