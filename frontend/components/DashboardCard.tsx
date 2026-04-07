import Link from "next/link";
import type { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  accent?: "green" | "blue" | "slate";
  href?: string;
  cta?: string;
  disabled?: boolean;
};

const ACCENT_STYLE: Record<NonNullable<DashboardCardProps["accent"]>, string> = {
  green: "border-emerald-400/35 bg-gradient-to-br from-emerald-500/15 to-slate-900/80 hover:shadow-[0_0_22px_rgba(34,197,94,0.28)]",
  blue: "border-blue-400/35 bg-gradient-to-br from-blue-500/15 to-slate-900/80 hover:shadow-[0_0_22px_rgba(59,130,246,0.28)]",
  slate: "border-slate-600/80 bg-slate-900/70 hover:shadow-[0_0_20px_rgba(148,163,184,0.22)]",
};

function CardContent({ title, description, icon, cta, accent = "slate", disabled = false }: Omit<DashboardCardProps, "href">) {
  return (
    <article
      className={`rounded-2xl border p-6 shadow-lg transition duration-300 ${ACCENT_STYLE[accent]} ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:scale-105"
      }`}
    >
      <div className="inline-flex items-center gap-3 text-slate-100">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950/50">{icon}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-300">{description}</p>
      <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-400">{cta ?? (disabled ? "Coming Soon" : "Open Dashboard")}</p>
    </article>
  );
}

export default function DashboardCard({ href, disabled = false, ...props }: DashboardCardProps) {
  if (href && !disabled) {
    return (
      <Link href={href} className="block">
        <CardContent {...props} disabled={disabled} />
      </Link>
    );
  }

  return <CardContent {...props} disabled={disabled} />;
}
