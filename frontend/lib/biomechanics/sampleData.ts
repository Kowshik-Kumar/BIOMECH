import type { PoseFrame } from "./types";

export const correctCricketPosture: PoseFrame = {
  left_shoulder: { x: 0.42, y: 0.27 },
  right_shoulder: { x: 0.58, y: 0.27 },
  right_elbow: { x: 0.67, y: 0.24 },
  right_wrist: { x: 0.76, y: 0.23 },
  left_hip: { x: 0.46, y: 0.55 },
  right_hip: { x: 0.56, y: 0.55 },
  neck: { x: 0.51, y: 0.2 },
  right_knee: { x: 0.515, y: 0.73 },
  left_foot: { x: 0.44, y: 0.9 },
  right_foot: { x: 0.58, y: 0.89 },
};

export const incorrectCricketPosture: PoseFrame = {
  left_shoulder: { x: 0.4, y: 0.3 },
  right_shoulder: { x: 0.57, y: 0.23 },
  right_elbow: { x: 0.62, y: 0.31 },
  right_wrist: { x: 0.67, y: 0.44 },
  left_hip: { x: 0.45, y: 0.55 },
  right_hip: { x: 0.59, y: 0.53 },
  neck: { x: 0.62, y: 0.2 },
  right_knee: { x: 0.47, y: 0.74 },
  left_foot: { x: 0.39, y: 0.9 },
  right_foot: { x: 0.64, y: 0.84 },
};
