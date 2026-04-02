import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RehabCategoryCard from "@/components/RehabCategoryCard";
import { rehabCategories } from "@/lib/mockData";

export default function RehabilitationCategoryPage() {
  return (
    <main className="min-h-screen bg-hero-mesh px-4 py-8 sm:px-6 md:px-10">
      <section className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-amber-200">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">Injury Rehabilitation</h1>
        <p className="mt-2 text-sm text-slate-300">Choose a rehabilitation focus area to start live posture analysis.</p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {rehabCategories.map((category) => (
            <RehabCategoryCard
              key={category.slug}
              title={category.title}
              description={category.description}
              href={`/rehabilitation/${category.slug}/live`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
