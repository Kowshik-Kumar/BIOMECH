import type { RuleDefinition, RuleOutcome } from "./types";
import {
  calculateAlignment,
  calculateAngle,
  calculateBodyTilt,
  midpoint,
} from "./utils";

function createOutcome(
  rule: string,
  value: number,
  expected: string,
  severity: RuleOutcome["severity"],
  message: string,
): RuleOutcome {
  return {
    rule,
    value: Number(value.toFixed(2)),
    expected,
    severity,
    message,
  };
}

export const cricketRules: RuleDefinition[] = [
  {
    name: "Elbow Angle",
    severity: "high",
    expected: ">= 165 deg",
    evaluate: ({ frame }) => {
      const elbowAngle = calculateAngle(frame.right_shoulder, frame.right_elbow, frame.right_wrist);
      if (elbowAngle >= 165) {
        return null;
      }
      return createOutcome(
        "Elbow Angle",
        elbowAngle,
        ">= 165 deg",
        "high",
        "Bowling arm elbow extension is insufficient",
      );
    },
  },
  {
    name: "Front Knee Alignment",
    severity: "medium",
    expected: "0.50 - 0.53",
    evaluate: ({ frame }) => {
      const kneeX = frame.right_knee.x;
      if (kneeX >= 0.5 && kneeX <= 0.53) {
        return null;
      }
      return createOutcome(
        "Front Knee Alignment",
        kneeX,
        "0.50 - 0.53",
        "medium",
        "Front knee misaligned from stable landing corridor",
      );
    },
  },
  {
    name: "Cross-Base Alignment",
    severity: "medium",
    expected: "line gap <= 12 deg",
    evaluate: ({ frame }) => {
      const shoulderLine: [typeof frame.left_shoulder, typeof frame.right_shoulder] = [
        frame.left_shoulder,
        frame.right_shoulder,
      ];
      const footLine: [typeof frame.left_foot, typeof frame.right_foot] = [frame.left_foot, frame.right_foot];

      const misalignment = calculateAlignment(shoulderLine, footLine);
      if (misalignment <= 12) {
        return null;
      }
      return createOutcome(
        "Cross-Base Alignment",
        misalignment,
        "line gap <= 12 deg",
        "medium",
        "Foot base is not aligned with shoulder orientation",
      );
    },
  },
  {
    name: "Lateral Flexion",
    severity: "high",
    expected: "<= 20 deg",
    evaluate: ({ frame }) => {
      const hipCenter = midpoint(frame.left_hip, frame.right_hip);
      const tilt = calculateBodyTilt(hipCenter, frame.neck);
      if (tilt <= 20) {
        return null;
      }
      return createOutcome(
        "Lateral Flexion",
        tilt,
        "<= 20 deg",
        "high",
        "Excessive side bend detected through the trunk",
      );
    },
  },
  {
    name: "Hip-Shoulder Separation",
    severity: "low",
    expected: "20 - 45 deg",
    evaluate: ({ frame }) => {
      const hipLine: [typeof frame.left_hip, typeof frame.right_hip] = [frame.left_hip, frame.right_hip];
      const shoulderLine: [typeof frame.left_shoulder, typeof frame.right_shoulder] = [
        frame.left_shoulder,
        frame.right_shoulder,
      ];

      const separation = calculateAlignment(hipLine, shoulderLine);

      if (separation < 20) {
        return createOutcome(
          "Hip-Shoulder Separation",
          separation,
          "20 - 45 deg",
          "low",
          "Separation is low; reduce block-on timing and load torso more",
        );
      }

      if (separation > 45) {
        return createOutcome(
          "Hip-Shoulder Separation",
          separation,
          "20 - 45 deg",
          "high",
          "Separation is excessive and may increase trunk stress",
        );
      }

      return null;
    },
  },
];
