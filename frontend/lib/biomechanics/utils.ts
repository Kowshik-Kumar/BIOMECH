import type { Point2D } from "./types";

const RAD_TO_DEG = 180 / Math.PI;

function safeNormalizeAngle(angle: number): number {
  if (!Number.isFinite(angle)) {
    return 0;
  }
  return Math.abs(angle);
}

export function calculateAngle(a: Point2D, b: Point2D, c: Point2D): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };

  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);

  if (magAB === 0 || magCB === 0) {
    return 0;
  }

  const cosine = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return safeNormalizeAngle(Math.acos(cosine) * RAD_TO_DEG);
}

export function calculateSlope(a: Point2D, b: Point2D): number {
  const deltaX = b.x - a.x;
  const deltaY = b.y - a.y;

  if (deltaX === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return deltaY / deltaX;
}

export function calculateBodyTilt(hip: Point2D, neck: Point2D): number {
  const deltaX = neck.x - hip.x;
  const deltaY = neck.y - hip.y;
  const angleFromVertical = Math.atan2(deltaX, Math.abs(deltaY)) * RAD_TO_DEG;
  return safeNormalizeAngle(angleFromVertical);
}

function slopeToDegrees(slope: number): number {
  if (!Number.isFinite(slope)) {
    return 90;
  }
  return Math.atan(slope) * RAD_TO_DEG;
}

export function calculateAlignment(line1: [Point2D, Point2D], line2: [Point2D, Point2D]): number {
  const slope1 = calculateSlope(line1[0], line1[1]);
  const slope2 = calculateSlope(line2[0], line2[1]);

  const angle1 = slopeToDegrees(slope1);
  const angle2 = slopeToDegrees(slope2);

  return safeNormalizeAngle(angle1 - angle2);
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}
