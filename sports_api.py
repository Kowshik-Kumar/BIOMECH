"""FastAPI backend for live sports biomechanics analysis."""

from __future__ import annotations

from datetime import datetime
from math import acos, atan2, degrees, hypot, inf
from typing import Dict, List, Literal, Optional, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

Point = Tuple[float, float]
Severity = Literal["low", "medium", "high"]


class Keypoint(BaseModel):
    x: float = Field(..., ge=0.0, le=1.0)
    y: float = Field(..., ge=0.0, le=1.0)


class AnalyzeRequest(BaseModel):
    injury_type: str = "cricket_bowling"
    keypoints: Dict[str, Keypoint]


class RuleError(BaseModel):
    rule: str
    value: float
    expected: str
    severity: Severity
    message: str


class AnalyzeResponse(BaseModel):
    timestamp: str
    posture_ok: bool
    errors: List[RuleError]


def _get_point(keypoints: Dict[str, Keypoint], name: str) -> Optional[Point]:
    point = keypoints.get(name)
    if point is None:
        return None
    return (point.x, point.y)


def calculate_angle(a: Point, b: Point, c: Point) -> float:
    ab = (a[0] - b[0], a[1] - b[1])
    cb = (c[0] - b[0], c[1] - b[1])

    dot = ab[0] * cb[0] + ab[1] * cb[1]
    mag_ab = hypot(ab[0], ab[1])
    mag_cb = hypot(cb[0], cb[1])

    if mag_ab <= 1e-8 or mag_cb <= 1e-8:
        return 0.0

    cosine = max(-1.0, min(1.0, dot / (mag_ab * mag_cb)))
    return abs(degrees(acos(cosine)))


def calculate_slope(a: Point, b: Point) -> float:
    dx = b[0] - a[0]
    dy = b[1] - a[1]
    if abs(dx) <= 1e-8:
        return inf
    return dy / dx


def calculate_body_tilt(hip: Point, neck: Point) -> float:
    delta_x = neck[0] - hip[0]
    delta_y = neck[1] - hip[1]
    return abs(degrees(atan2(delta_x, abs(delta_y))))


def _slope_to_deg(slope: float) -> float:
    if slope == inf:
        return 90.0
    return degrees(atan2(slope, 1.0))


def calculate_alignment(line1: Tuple[Point, Point], line2: Tuple[Point, Point]) -> float:
    slope1 = calculate_slope(line1[0], line1[1])
    slope2 = calculate_slope(line2[0], line2[1])
    return abs(_slope_to_deg(slope1) - _slope_to_deg(slope2))


def _midpoint(a: Point, b: Point) -> Point:
    return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)


def run_cricket_rules(keypoints: Dict[str, Keypoint]) -> List[RuleError]:
    errors: List[RuleError] = []

    right_shoulder = _get_point(keypoints, "right_shoulder")
    right_elbow = _get_point(keypoints, "right_elbow")
    right_wrist = _get_point(keypoints, "right_wrist")
    right_knee = _get_point(keypoints, "right_knee")
    left_foot = _get_point(keypoints, "left_foot")
    right_foot = _get_point(keypoints, "right_foot")
    left_shoulder = _get_point(keypoints, "left_shoulder")
    left_hip = _get_point(keypoints, "left_hip")
    right_hip = _get_point(keypoints, "right_hip")
    neck = _get_point(keypoints, "neck")

    if right_shoulder and right_elbow and right_wrist:
        elbow_angle = calculate_angle(right_shoulder, right_elbow, right_wrist)
        if elbow_angle < 165:
            errors.append(
                RuleError(
                    rule="Elbow Angle",
                    value=round(elbow_angle, 2),
                    expected=">= 165 deg",
                    severity="high",
                    message="Bowling arm elbow extension is insufficient",
                )
            )

    # In normalized coordinates, smaller y means higher on screen.
    # Elbow must stay above shoulder for strong bowling arm action.
    if right_shoulder and right_elbow:
        if right_elbow[1] > right_shoulder[1]:
            errors.append(
                RuleError(
                    rule="Arm Above Shoulder Line",
                    value=round(right_elbow[1], 3),
                    expected="elbow_y < shoulder_y",
                    severity="high",
                    message="Bowling arm is dropping below shoulder level",
                )
            )

    if right_knee:
        if right_knee[0] < 0.5 or right_knee[0] > 0.53:
            errors.append(
                RuleError(
                    rule="Front Knee Alignment",
                    value=round(right_knee[0], 3),
                    expected="0.50 - 0.53",
                    severity="medium",
                    message="Front knee misaligned",
                )
            )

    if left_foot and right_foot and left_shoulder and right_shoulder:
        line_diff = calculate_alignment((left_foot, right_foot), (left_shoulder, right_shoulder))
        if line_diff > 12:
            errors.append(
                RuleError(
                    rule="Cross-Base Alignment",
                    value=round(line_diff, 2),
                    expected="line gap <= 12 deg",
                    severity="medium",
                    message="Foot base is not aligned with shoulder line",
                )
            )

    if left_hip and right_hip and neck:
        hip_center = _midpoint(left_hip, right_hip)
        spine_tilt = calculate_body_tilt(hip_center, neck)
        if spine_tilt > 20:
            errors.append(
                RuleError(
                    rule="Lateral Flexion",
                    value=round(spine_tilt, 2),
                    expected="<= 20 deg",
                    severity="high",
                    message="Excessive side bend in trunk",
                )
            )

    if left_hip and right_hip and left_shoulder and right_shoulder:
        separation = calculate_alignment((left_hip, right_hip), (left_shoulder, right_shoulder))
        if separation < 20:
            errors.append(
                RuleError(
                    rule="Hip-Shoulder Separation",
                    value=round(separation, 2),
                    expected="20 - 45 deg",
                    severity="low",
                    message="Separation too low; increase torso loading",
                )
            )
        elif separation > 45:
            errors.append(
                RuleError(
                    rule="Hip-Shoulder Separation",
                    value=round(separation, 2),
                    expected="20 - 45 deg",
                    severity="high",
                    message="Separation too high; reduce trunk stress",
                )
            )

    return errors


def run_shoulder_rehab_rules(keypoints: Dict[str, Keypoint]) -> List[RuleError]:
    errors: List[RuleError] = []
    left_shoulder = _get_point(keypoints, "left_shoulder")
    left_elbow = _get_point(keypoints, "left_elbow")

    if left_shoulder and left_elbow and left_elbow[1] > left_shoulder[1]:
        errors.append(
            RuleError(
                rule="Arm Raise Height",
                value=round(left_elbow[1], 3),
                expected="elbow_y <= shoulder_y",
                severity="high",
                message="Raise arm slightly higher for shoulder mobility",
            )
        )

    return errors


def run_lower_back_rehab_rules(keypoints: Dict[str, Keypoint]) -> List[RuleError]:
    errors: List[RuleError] = []
    left_hip = _get_point(keypoints, "left_hip")
    right_hip = _get_point(keypoints, "right_hip")
    neck = _get_point(keypoints, "neck")

    if left_hip and right_hip and neck:
        hip_center = _midpoint(left_hip, right_hip)
        tilt = calculate_body_tilt(hip_center, neck)
        if tilt > 15:
            errors.append(
                RuleError(
                    rule="Trunk Neutrality",
                    value=round(tilt, 2),
                    expected="<= 15 deg",
                    severity="high",
                    message="Keep spine more upright to reduce lower-back strain",
                )
            )

    return errors


def run_knee_rehab_rules(keypoints: Dict[str, Keypoint]) -> List[RuleError]:
    errors: List[RuleError] = []
    right_hip = _get_point(keypoints, "right_hip")
    right_knee = _get_point(keypoints, "right_knee")
    right_ankle = _get_point(keypoints, "right_foot")

    if right_hip and right_knee and right_ankle:
        knee_angle = calculate_angle(right_hip, right_knee, right_ankle)
        if knee_angle < 145:
            errors.append(
                RuleError(
                    rule="Knee Extension",
                    value=round(knee_angle, 2),
                    expected=">= 145 deg",
                    severity="medium",
                    message="Avoid deep bend; keep knee in controlled extension",
                )
            )

    return errors


def run_neck_rehab_rules(keypoints: Dict[str, Keypoint]) -> List[RuleError]:
    errors: List[RuleError] = []
    nose = _get_point(keypoints, "nose")
    neck = _get_point(keypoints, "neck")

    if nose and neck:
        forward_offset = abs(nose[0] - neck[0])
        if forward_offset > 0.08:
            errors.append(
                RuleError(
                    rule="Neck Alignment",
                    value=round(forward_offset, 3),
                    expected="horizontal offset <= 0.08",
                    severity="medium",
                    message="Head is drifting forward; tuck chin gently",
                )
            )

    return errors


def run_ankle_rehab_rules(keypoints: Dict[str, Keypoint]) -> List[RuleError]:
    errors: List[RuleError] = []
    left_foot = _get_point(keypoints, "left_foot")
    right_foot = _get_point(keypoints, "right_foot")

    if left_foot and right_foot:
        foot_height_delta = abs(left_foot[1] - right_foot[1])
        if foot_height_delta > 0.08:
            errors.append(
                RuleError(
                    rule="Ankle Balance",
                    value=round(foot_height_delta, 3),
                    expected="left/right foot y delta <= 0.08",
                    severity="medium",
                    message="Maintain balanced ankle loading across both feet",
                )
            )

    return errors


RULE_SETS = {
    "cricket_bowling": run_cricket_rules,
    "shoulder_rehab": run_shoulder_rehab_rules,
    "lower_back_rehab": run_lower_back_rehab_rules,
    "knee_rehab": run_knee_rehab_rules,
    "neck_rehab": run_neck_rehab_rules,
    "ankle_rehab": run_ankle_rehab_rules,
}


app = FastAPI(title="Sports Biomechanics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "sports_biomechanics_api"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    rule_fn = RULE_SETS.get(req.injury_type, run_cricket_rules)
    errors = rule_fn(req.keypoints)
    return AnalyzeResponse(
        timestamp=datetime.now().isoformat(timespec="seconds"),
        posture_ok=len(errors) == 0,
        errors=errors,
    )
