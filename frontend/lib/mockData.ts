export type AnglePoint = {
  time: string;
  kneeAngle: number;
  pelvisTilt: number;
  elbowAngle: number;
};

export const sportsAngles: AnglePoint[] = [
  { time: "0s", kneeAngle: 92, pelvisTilt: 8, elbowAngle: 122 },
  { time: "5s", kneeAngle: 98, pelvisTilt: 6, elbowAngle: 126 },
  { time: "10s", kneeAngle: 104, pelvisTilt: 5, elbowAngle: 130 },
  { time: "15s", kneeAngle: 111, pelvisTilt: 4, elbowAngle: 136 },
  { time: "20s", kneeAngle: 116, pelvisTilt: 3, elbowAngle: 141 },
  { time: "25s", kneeAngle: 119, pelvisTilt: 2, elbowAngle: 144 },
];

export const rehabAngles: AnglePoint[] = [
  { time: "0s", kneeAngle: 62, pelvisTilt: 13, elbowAngle: 88 },
  { time: "5s", kneeAngle: 68, pelvisTilt: 11, elbowAngle: 92 },
  { time: "10s", kneeAngle: 74, pelvisTilt: 9, elbowAngle: 95 },
  { time: "15s", kneeAngle: 79, pelvisTilt: 8, elbowAngle: 99 },
  { time: "20s", kneeAngle: 83, pelvisTilt: 7, elbowAngle: 103 },
  { time: "25s", kneeAngle: 88, pelvisTilt: 6, elbowAngle: 107 },
];

export const sportsFeedback = [
  "Knee is 15 deg too bent",
  "Pelvis tilted 10 deg left",
  "Raise chest by 7 deg",
];

export const rehabFeedback = [
  "Neck tilt exceeds safe threshold",
  "Wrist extension is limited by 12 deg",
  "Reduce trunk rotation by 8 deg",
];

export const sportsSessions = [
  { id: "s1", date: "Mar 30, 2026", exercise: "Sprint Mechanics", duration: "22 min" },
  { id: "s2", date: "Mar 28, 2026", exercise: "Squat Form", duration: "19 min" },
  { id: "s3", date: "Mar 24, 2026", exercise: "Jump Landing", duration: "17 min" },
];

export const rehabSessions = [
  { id: "r1", date: "Mar 31, 2026", exercise: "Neck Mobility", duration: "14 min" },
  { id: "r2", date: "Mar 27, 2026", exercise: "Hand Tendon Glide", duration: "12 min" },
  { id: "r3", date: "Mar 22, 2026", exercise: "Leg Stability", duration: "20 min" },
];

export const rehabCategories = [
  { title: "Neck Exercises", slug: "neck-exercises", description: "Postural cervical alignment and controlled mobility." },
  { title: "Hand Exercises", slug: "hand-exercises", description: "Fine motor tracking and tendon-loading progression." },
  { title: "Lower Back Exercises", slug: "lower-back-exercises", description: "Lumbar stability, hip hinge, and core control patterns." },
  { title: "Leg Exercises", slug: "leg-exercises", description: "Knee mechanics, stance symmetry, and balance restoration." },
];
