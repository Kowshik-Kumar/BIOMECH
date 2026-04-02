import Link from "next/link";
import { HeartPulse } from "lucide-react";

type RehabCategoryCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function RehabCategoryCard({ title, description, href }: RehabCategoryCardProps) {
  return (
    <Link
      href={href}
      className="glass-card group rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-amber-300/50"
    >
      <div className="flex items-center gap-3 text-amber-200">
        <HeartPulse size={18} />
        <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-slate-300">{description}</p>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Start Live Analysis</p>
    </Link>
  );
}
