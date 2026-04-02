import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SelectionCardProps = {
  title: string;
  description: string;
  href: string;
  accent: string;
};

export default function SelectionCard({ title, description, href, accent }: SelectionCardProps) {
  return (
    <article className="glass-card group relative overflow-hidden rounded-2xl p-8 transition duration-300 hover:-translate-y-1 hover:shadow-glow">
      <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-40 blur-3xl ${accent}`} />
      <h2 className="font-[var(--font-sora)] text-2xl font-semibold text-slate-100">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      <Link
        href={href}
        className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-500/60 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
      >
        Enter Module
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
