import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SessionCard from "@/components/SessionCard";
import { sportsSessions } from "@/lib/mockData";

export default function SportsSessionsPage() {
  return (
    <main className="min-h-screen bg-hero-mesh px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/sports/live" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-amber-200">
          <ArrowLeft size={14} /> Back To Live
        </Link>
        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">Session Recording</h1>
        <p className="mt-2 text-sm text-slate-300">Sports training recordings and analysis playback are listed here.</p>

        <div className="mt-6 space-y-4">
          {sportsSessions.map((session) => (
            <SessionCard
              key={session.id}
              date={session.date}
              exercise={session.exercise}
              duration={session.duration}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
