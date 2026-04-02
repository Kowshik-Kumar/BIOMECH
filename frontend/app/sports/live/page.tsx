import LiveAnalysisView from "@/components/LiveAnalysisView";
import { sportsAngles, sportsFeedback } from "@/lib/mockData";

export default function SportsLivePage() {
  return (
    <LiveAnalysisView
      title="Sports Training Live Analysis"
      subtitle="Monitor athletic movement with real-time biomechanical posture feedback."
      backHref="/"
      exerciseName="Athletic Squat Sequence"
      reps={8}
      target={12}
      errors={sportsFeedback}
      angles={sportsAngles}
    />
  );
}
