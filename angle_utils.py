"""Utility functions for joint-angle and alignment calculations.

This module is intentionally model-agnostic so future pose backends can use
these helpers without changes.
"""

from __future__ import annotations

from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np

Point = Tuple[float, float]


def calculate_angle(a: Point, b: Point, c: Point) -> float:
    """Return the inner angle (in degrees) formed by points a-b-c.

    The angle is computed at point b. Output range is [0, 180].
    """
    pa = np.array(a, dtype=np.float32)
    pb = np.array(b, dtype=np.float32)
    pc = np.array(c, dtype=np.float32)

    ba = pa - pb
    bc = pc - pb

    denom = np.linalg.norm(ba) * np.linalg.norm(bc)
    if denom < 1e-8:
        return 0.0

    cosine = float(np.dot(ba, bc) / denom)
    cosine = float(np.clip(cosine, -1.0, 1.0))
    angle = float(np.degrees(np.arccos(cosine)))
    return angle


def calculate_segment_tilt_degrees(p1: Point, p2: Point) -> float:
    """Return tilt magnitude from horizontal for segment p1->p2.

    0 means perfectly horizontal alignment.
    """
    dy = p2[1] - p1[1]
    dx = p2[0] - p1[0]
    angle = np.degrees(np.arctan2(dy, dx))
    return float(abs(angle))


def calculate_pair_vertical_diff_ratio(
    p1: Point,
    p2: Point,
    frame_h: int,
) -> float:
    """Return normalized vertical offset between two points.

    Useful for alignment metrics such as shoulders or hips.
    """
    if frame_h <= 0:
        return 0.0
    return float(abs(p1[1] - p2[1]) / frame_h)


def in_range(value: float, min_val: float, max_val: float) -> bool:
    """Check if a numeric value is within inclusive bounds."""
    return min_val <= value <= max_val


def evaluate_metric(
    value: float,
    threshold: Dict[str, float],
) -> Tuple[bool, Optional[str]]:
    """Evaluate value against a threshold rule.

    Threshold dictionary supports keys:
    - min: lower bound
    - max: upper bound
    - low_msg: feedback if value < min
    - high_msg: feedback if value > max
    """
    min_v = threshold.get("min", -np.inf)
    max_v = threshold.get("max", np.inf)

    if value < min_v:
        return False, threshold.get("low_msg", "Increase angle")
    if value > max_v:
        return False, threshold.get("high_msg", "Reduce angle")
    return True, None


def median_point(points: Iterable[Point]) -> Point:
    """Return median center for a list of 2D points."""
    pts = np.array(list(points), dtype=np.float32)
    if len(pts) == 0:
        return 0.0, 0.0
    return float(np.median(pts[:, 0])), float(np.median(pts[:, 1]))


def smooth_value(history: List[float], value: float, window: int = 5) -> float:
    """Push value to history and return moving-average smoothed value."""
    history.append(value)
    if len(history) > window:
        history.pop(0)
    return float(sum(history) / max(1, len(history)))
