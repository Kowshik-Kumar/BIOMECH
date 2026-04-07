import { notFound } from "next/navigation";
import RehabExercisePage from "@/components/RehabExercisePage";
import { getRehabConfigBySlug } from "@/lib/rehabConfig";

type RehabInjuryPageProps = {
  params: {
    injury: string;
  };
};

export default function RehabInjuryPage({ params }: RehabInjuryPageProps) {
  const config = getRehabConfigBySlug(params.injury);
  if (!config) {
    notFound();
  }

  return <RehabExercisePage config={config} />;
}
