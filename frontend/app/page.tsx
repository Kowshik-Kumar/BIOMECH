import Link from "next/link";
import { Activity, CircleOff, HeartPulse, Trophy } from "lucide-react";
import DashboardCard from "@/components/DashboardCard";
import KPIBox from "@/components/KPIBox";
import ProgressBar from "@/components/ProgressBar";

export default function LandingPage() {
  return (
    <main className="dashboard-shell min-h-screen px-4 py-8 sm:px-6 md:px-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs uppercase tracking-[0.24em] text-blue-300">Sports Performance Dashboard</p>
        <h1 className="mt-2 font-[var(--font-sora)] text-4xl font-bold text-slate-100">MotionRx</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">AI-powered performance & recovery analytics</p>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <KPIBox label="Posture Accuracy" value="84%" progress={84} detail="Average over last 12 sessions" accent="green" />
          <KPIBox label="Movement Efficiency" value="76%" progress={76} detail="Bowling chain stability" accent="blue" />
          <KPIBox label="Injury Risk" value="Low" progress={24} detail="Minor asymmetry detected" accent="yellow" />
        </div>

        <div className="glass-card mt-4 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Performance Trend</h2>
            <Link href="/sports/live" className="rounded-lg border border-blue-400/45 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/25">
              Open Live Analysis
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <ProgressBar label="Core Stability" value={78} color="green" />
            <ProgressBar label="Release Alignment" value={71} color="blue" />
            <ProgressBar label="Recovery Compliance" value={66} color="yellow" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            href="/sports/live"
            accent="green"
            icon={<Trophy size={16} />}
            title="Cricket"
            description="Analyze bowling biomechanics"
            cta="Start Analysis"
          />
          <DashboardCard
            href="/rehab"
            accent="blue"
            icon={<HeartPulse size={16} />}
            title="Rehab"
            description="Track recovery & posture correction"
            cta="Open Rehab Modules"
          />
          <DashboardCard
            disabled
            accent="slate"
            icon={<Activity size={16} />}
            title="Football"
            description="Coming Soon"
          />
          <DashboardCard
            disabled
            accent="slate"
            icon={<CircleOff size={16} />}
            title="Badminton"
            description="Coming Soon"
          />
        </div>
      </section>
    </main>
  );
}
