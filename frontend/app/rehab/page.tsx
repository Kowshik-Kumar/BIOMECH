import Link from "next/link";
import { Activity, ArrowLeft, CircleDot, Footprints, Hand, PersonStanding, ShieldPlus } from "lucide-react";
import { rehabConfigs } from "@/lib/rehabConfig";
import KPIBox from "@/components/KPIBox";

const ICONS = {
  shoulder: Activity,
  "lower-back": PersonStanding,
  knee: ShieldPlus,
  neck: Hand,
  ankle: Footprints,
} as const;

export default function RehabSelectionPage() {
  return (
    <main className="dashboard-shell min-h-screen px-4 py-8 sm:px-6 md:px-10">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-blue-200">
          <ArrowLeft size={14} /> Back
        </Link>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">Recovery Modules</h1>
        <p className="mt-2 text-sm text-slate-300">Choose an injury-focused recovery protocol and track posture correction progress.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <KPIBox label="Recovery Compliance" value="81%" progress={81} detail="Last 14 days" accent="green" />
          <KPIBox label="Form Stability" value="74%" progress={74} detail="Current session averages" accent="blue" />
          <KPIBox label="Relapse Risk" value="Low" progress={30} detail="Trend remains controlled" accent="yellow" />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rehabConfigs.map((config) => {
            const Icon = ICONS[config.slug];
            return (
              <Link
                key={config.slug}
                href={`/rehab/${config.slug}`}
                className="glass-card rounded-2xl border border-slate-600/60 p-6 transition duration-300 hover:scale-[1.03] hover:border-blue-300/55 hover:shadow-[0_0_22px_rgba(59,130,246,0.25)]"
              >
                <div className="flex items-center gap-3 text-blue-200">
                  <Icon size={18} />
                  <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">
                    {config.title.split(" - ")[0]}
                  </h3>
                </div>
                <p className="mt-3 text-sm text-slate-300">{config.shortDescription}</p>
                <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
                  <CircleDot size={12} /> Open Module
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
