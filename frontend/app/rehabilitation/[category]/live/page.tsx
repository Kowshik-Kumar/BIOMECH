import LiveAnalysisView from "@/components/LiveAnalysisView";
import { rehabAngles, rehabFeedback } from "@/lib/mockData";

type RehabilitationLivePageProps = {
  params: {
    category: string;
  };
};

function toTitleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export default function RehabilitationLivePage({ params }: RehabilitationLivePageProps) {
  const categoryTitle = toTitleCase(params.category);

  return (
    <LiveAnalysisView
      title={`${categoryTitle} Live Analysis`}
      subtitle="Track therapeutic movement quality and monitor posture correction over time."
      backHref="/rehabilitation"
      exerciseName={`${categoryTitle} Guided Routine`}
      reps={5}
      target={10}
      errors={rehabFeedback}
      angles={rehabAngles}
    />
  );
}
