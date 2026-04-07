import Link from "next/link";

type OverviewCardProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

function OverviewCard({ title, description, href, cta }: OverviewCardProps) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-5 shadow-sm shadow-slate-950/40">
      <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:border-amber-400 hover:bg-amber-500/20"
      >
        {cta}
      </Link>
    </article>
  );
}

export default function DashboardWorkspace() {
  return (
    <section className="space-y-6">
      <header className="border-b border-slate-800 pb-4">
        <h1 className="font-[var(--font-sora)] text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Professional movement analysis workspace for sports performance and physiotherapy.</p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <OverviewCard
          title="Sports Training"
          description="Monitor technique quality, angular consistency, and rep progression during athletic drills."
          href="/sports"
          cta="Open Sports Live"
        />
        <OverviewCard
          title="Rehab"
          description="Track corrective patterns and controlled range of motion during recovery-focused sessions."
          href="/rehabilitation"
          cta="Open Rehab"
        />
        <OverviewCard
          title="Recent Sessions"
          description="Review previously recorded sessions and open detailed posture analysis summaries."
          href="/sports/sessions"
          cta="View Sessions"
        />
      </div>
    </section>
  );
}
