import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ExercisePanel from "@/components/ExercisePanel";
import LiveCameraFeed from "@/components/LiveCameraFeed";
import PostureErrorsPanel from "@/components/PostureErrorsPanel";
import ProgressPanel from "@/components/ProgressPanel";
import type { AnglePoint } from "@/lib/mockData";

type LiveAnalysisViewProps = {
  title: string;
  subtitle: string;
  backHref: string;
  exerciseName: string;
  reps: number;
  target: number;
  errors: string[];
  angles: AnglePoint[];
};

export default function LiveAnalysisView({
  title,
  subtitle,
  backHref,
  exerciseName,
  reps,
  target,
  errors,
  angles,
}: LiveAnalysisViewProps) {
  return (
    <main className="min-h-screen bg-hero-mesh px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-cyan-200">
          <ChevronLeft size={16} /> Back
        </Link>
        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">{title}</h1>
        <p className="mt-2 text-sm text-slate-300">{subtitle}</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <LiveCameraFeed label="Live Camera Feed" />
          <section className="space-y-4">
            <ExercisePanel name={exerciseName} reps={reps} target={target} />
            <PostureErrorsPanel errors={errors} />
            <ProgressPanel data={angles} />
          </section>
        </div>
      </div>
    </main>
  );
}
