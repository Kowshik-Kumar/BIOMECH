import StatusBadge from "@/components/StatusBadge";

type MetricRowProps = {
  label: string;
  value: string;
  status?: "correct" | "error" | "warning" | "info";
  helper?: string;
};

export default function MetricRow({ label, value, status, helper }: MetricRowProps) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/55 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-sm font-semibold text-slate-100">{value}</p>
      </div>
      {status && (
        <div className="mt-2">
          <StatusBadge
            status={status}
            text={status === "correct" ? "Correct" : status === "warning" ? "Warning" : status === "error" ? "Error" : "Info"}
          />
        </div>
      )}
      {helper && <p className="mt-2 text-xs text-slate-400">{helper}</p>}
    </div>
  );
}
