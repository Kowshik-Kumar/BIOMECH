export type RehabInjuryKey = "shoulder" | "lower-back" | "knee" | "neck" | "ankle";

export type RehabConfig = {
  slug: RehabInjuryKey;
  injuryType: "shoulder_rehab" | "lower_back_rehab" | "knee_rehab" | "neck_rehab" | "ankle_rehab";
  title: string;
  shortDescription: string;
  instructions: string[];
};

export const rehabConfigs: RehabConfig[] = [
  {
    slug: "shoulder",
    injuryType: "shoulder_rehab",
    title: "Shoulder Rehabilitation - Arm Raise Exercise",
    shortDescription: "Improve arm mobility and scapular control.",
    instructions: [
      "Stand straight",
      "Raise your arm sideways slowly",
      "Keep elbow slightly straight",
    ],
  },
  {
    slug: "lower-back",
    injuryType: "lower_back_rehab",
    title: "Lower Back Rehabilitation - Trunk Control Exercise",
    shortDescription: "Control bending posture and reduce lumbar stress.",
    instructions: [
      "Stand with feet shoulder-width apart",
      "Keep chest open and core engaged",
      "Avoid excessive side bending",
    ],
  },
  {
    slug: "knee",
    injuryType: "knee_rehab",
    title: "Knee Rehabilitation - Controlled Extension Exercise",
    shortDescription: "Strengthen knee stability through guided extension.",
    instructions: [
      "Stand upright near support",
      "Slowly extend and control knee bend",
      "Keep knee tracking over toes",
    ],
  },
  {
    slug: "neck",
    injuryType: "neck_rehab",
    title: "Neck Rehabilitation - Alignment Exercise",
    shortDescription: "Improve cervical posture and head-neck alignment.",
    instructions: [
      "Sit or stand straight",
      "Keep chin gently tucked",
      "Avoid forward head movement",
      "Keep tilting your head in a rainbow shape till error shows on the screen",
    ],
  },
  {
    slug: "ankle",
    injuryType: "ankle_rehab",
    title: "Ankle Rehabilitation - Balance Exercise",
    shortDescription: "Improve ankle balance and load distribution.",
    instructions: [
      "Stand with equal body weight on both feet",
      "Lift and place foot with control",
      "Maintain stable ankle alignment",
    ],
  },
];

export function getRehabConfigBySlug(slug: string): RehabConfig | undefined {
  return rehabConfigs.find((item) => item.slug === slug);
}
