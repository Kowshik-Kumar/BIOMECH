import Link from "next/link";
import { Play, History, Trophy, Goal, ShieldOff } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import KPIBox from "@/components/KPIBox";

export default function SportsLandingPage() {
  return (
    <main className="dashboard-shell min-h-screen px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Sports Console</p>
        <h1 className="mt-2 font-[var(--font-sora)] text-4xl font-bold text-slate-100">MotionRx Analytics Hub</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">Analyze sports movement with deterministic biomechanics checks and session-level trends.</p>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <KPIBox label="Posture Accuracy" value="82%" progress={82} detail="Last 20 deliveries" accent="green" />
          <KPIBox label="Movement Efficiency" value="76%" progress={76} detail="Kinetic chain transfer" accent="blue" />
          <KPIBox label="Injury Risk" value="Medium" progress={58} detail="Front-knee overload risk" accent="yellow" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="space-y-3">
            <DashboardCard
              href="/sports/live"
              accent="green"
              icon={<Trophy size={16} />}
              title="Cricket"
              description="Analyze bowling biomechanics"
              cta="Start Analysis"
            />
            <div className="flex gap-2">
              <Link href="/sports/live" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/55 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25">
                <Play size={14} /> Start Analysis
              </Link>
              <Link href="/sports/sessions" className="inline-flex items-center gap-2 rounded-xl border border-blue-400/45 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/25">
                <History size={14} /> History
              </Link>
            </div>
          </div>

          <DashboardCard disabled accent="slate" icon={<Goal size={16} />} title="Football" description="Coming Soon" />
          <DashboardCard disabled accent="slate" icon={<ShieldOff size={16} />} title="Badminton" description="Coming Soon" />
        </div>
      </div>
    </main>
  );
}
