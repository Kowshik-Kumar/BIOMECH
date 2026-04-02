"""Phase-1 local posture checker (webcam window + calibration)."""

from __future__ import annotations

import csv
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import cv2

from angle_utils import calculate_angle, calculate_pair_vertical_diff_ratio, smooth_value
from pose_detector import PoseDetector

Point = Tuple[int, int]

METRIC_REQUIREMENTS = {
    "left_elbow": ("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
    "right_elbow": ("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"),
    "left_knee": ("LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
    "right_knee": ("RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"),
    "shoulder_alignment": ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
    "hip_alignment": ("LEFT_HIP", "RIGHT_HIP"),
}

CALIBRATION_TOLERANCE = {
    "left_elbow": 15.0,
    "right_elbow": 15.0,
    "left_knee": 15.0,
    "right_knee": 15.0,
    "shoulder_alignment": 0.03,
    "hip_alignment": 0.035,
}

IMPROVEMENT_TEXT = {
    "left_elbow": "Adjust left elbow angle",
    "right_elbow": "Adjust right elbow angle",
    "left_knee": "Adjust left knee angle",
    "right_knee": "Adjust right knee angle",
    "shoulder_alignment": "Level your shoulders",
    "hip_alignment": "Level your hips",
}


def get_tracked_finger_tips(lms: Dict[str, Point]) -> List[str]:
    finger_keys = [
        "LHAND_THUMB_TIP",
        "LHAND_INDEX_FINGER_TIP",
        "LHAND_MIDDLE_FINGER_TIP",
        "LHAND_RING_FINGER_TIP",
        "LHAND_PINKY_TIP",
        "RHAND_THUMB_TIP",
        "RHAND_INDEX_FINGER_TIP",
        "RHAND_MIDDLE_FINGER_TIP",
        "RHAND_RING_FINGER_TIP",
        "RHAND_PINKY_TIP",
    ]
    return [key for key in finger_keys if key in lms]


def compute_metrics(lms: Dict[str, Point], frame_h: int) -> Dict[str, float]:
    metrics: Dict[str, float] = {}
    if all(name in lms for name in METRIC_REQUIREMENTS["left_elbow"]):
        metrics["left_elbow"] = calculate_angle(lms["LEFT_SHOULDER"], lms["LEFT_ELBOW"], lms["LEFT_WRIST"])
    if all(name in lms for name in METRIC_REQUIREMENTS["right_elbow"]):
        metrics["right_elbow"] = calculate_angle(lms["RIGHT_SHOULDER"], lms["RIGHT_ELBOW"], lms["RIGHT_WRIST"])
    if all(name in lms for name in METRIC_REQUIREMENTS["left_knee"]):
        metrics["left_knee"] = calculate_angle(lms["LEFT_HIP"], lms["LEFT_KNEE"], lms["LEFT_ANKLE"])
    if all(name in lms for name in METRIC_REQUIREMENTS["right_knee"]):
        metrics["right_knee"] = calculate_angle(lms["RIGHT_HIP"], lms["RIGHT_KNEE"], lms["RIGHT_ANKLE"])
    if all(name in lms for name in METRIC_REQUIREMENTS["shoulder_alignment"]):
        metrics["shoulder_alignment"] = calculate_pair_vertical_diff_ratio(
            lms["LEFT_SHOULDER"], lms["RIGHT_SHOULDER"], frame_h
        )
    if all(name in lms for name in METRIC_REQUIREMENTS["hip_alignment"]):
        metrics["hip_alignment"] = calculate_pair_vertical_diff_ratio(lms["LEFT_HIP"], lms["RIGHT_HIP"], frame_h)
    return metrics


def evaluate_against_baseline(metrics: Dict[str, float], baseline: Dict[str, float]) -> Tuple[bool, List[str], Dict[str, bool]]:
    if not baseline:
        return False, ["Press 'c' to calibrate ideal posture"], {}

    each_ok: Dict[str, bool] = {}
    feedback: List[str] = []
    for key, current in metrics.items():
        if key not in baseline:
            continue
        tolerance = CALIBRATION_TOLERANCE[key]
        is_ok = abs(current - baseline[key]) <= tolerance
        each_ok[key] = is_ok
        if not is_ok:
            feedback.append(IMPROVEMENT_TEXT[key])

    if not each_ok:
        return False, ["Unable to compute posture metrics"], each_ok
    return all(each_ok.values()), feedback, each_ok


def draw_ui(
    frame,
    lms: Dict[str, Point],
    metrics: Dict[str, float],
    each_ok: Dict[str, bool],
    posture_ok: bool,
    feedback: List[str],
    calibrated: bool,
    fps: float,
    tracked_fingers: List[str],
) -> None:
    h, w = frame.shape[:2]
    state = "POSTURE: CORRECT" if posture_ok else "POSTURE: WRONG"
    state_color = (0, 255, 0) if posture_ok else (0, 0, 255)
    cv2.putText(frame, state, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.85, state_color, 2, cv2.LINE_AA)
    cv2.putText(frame, f"FPS: {fps:.1f}", (w - 130, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 0), 2, cv2.LINE_AA)

    calibration_text = "CALIBRATED" if calibrated else "NOT CALIBRATED (press c)"
    cv2.putText(frame, calibration_text, (20, 63), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(
        frame,
        f"Fingers tracked: {len(tracked_fingers)}/10",
        (w - 240, 63),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.58,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    y = 90
    for msg in feedback[:3]:
        cv2.putText(frame, msg, (20, y), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (0, 90, 255), 2, cv2.LINE_AA)
        y += 26

    positions: Dict[str, Point] = {}
    if "LEFT_ELBOW" in lms:
        positions["left_elbow"] = lms["LEFT_ELBOW"]
    if "RIGHT_ELBOW" in lms:
        positions["right_elbow"] = lms["RIGHT_ELBOW"]
    if "LEFT_KNEE" in lms:
        positions["left_knee"] = lms["LEFT_KNEE"]
    if "RIGHT_KNEE" in lms:
        positions["right_knee"] = lms["RIGHT_KNEE"]
    if "LEFT_SHOULDER" in lms and "RIGHT_SHOULDER" in lms:
        positions["shoulder_alignment"] = (
            (lms["LEFT_SHOULDER"][0] + lms["RIGHT_SHOULDER"][0]) // 2,
            min(lms["LEFT_SHOULDER"][1], lms["RIGHT_SHOULDER"][1]) - 15,
        )
    if "LEFT_HIP" in lms and "RIGHT_HIP" in lms:
        positions["hip_alignment"] = (
            (lms["LEFT_HIP"][0] + lms["RIGHT_HIP"][0]) // 2,
            min(lms["LEFT_HIP"][1], lms["RIGHT_HIP"][1]) - 15,
        )

    for metric_name, metric_val in metrics.items():
        if metric_name in {"left_elbow", "right_elbow", "left_knee", "right_knee"}:
            continue
        if metric_name not in positions:
            continue
        pos = positions[metric_name]
        ok = each_ok.get(metric_name, True)
        color = (0, 255, 0) if ok else (0, 0, 255)
        if "alignment" in metric_name:
            text = f"{metric_name}: {metric_val:.3f}"
        else:
            text = f"{metric_name}: {metric_val:.1f} deg"
        cv2.putText(frame, text, (int(pos[0]) + 6, int(pos[1]) - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)

    cv2.putText(frame, "c: calibrate  q: quit", (20, h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (230, 230, 230), 2, cv2.LINE_AA)


def draw_joint_angles(frame, lms: Dict[str, Point], metrics: Dict[str, float], each_ok: Dict[str, bool]) -> None:
    """Draw elbow and knee angles with highlighted marker, rays, and degree text."""
    overlay = frame.copy()
    joints = [
        ("left_elbow", "LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
        ("right_elbow", "RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"),
        ("left_knee", "LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
        ("right_knee", "RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"),
    ]

    for metric_name, a_name, b_name, c_name in joints:
        if metric_name not in metrics:
            continue
        if not all(name in lms for name in (a_name, b_name, c_name)):
            continue

        ax, ay = lms[a_name]
        bx, by = lms[b_name]
        cx, cy = lms[c_name]

        # Ray colors mimic the reference style.
        cv2.line(frame, (bx, by), (ax, ay), (0, 255, 255), 3, cv2.LINE_AA)
        cv2.line(frame, (bx, by), (cx, cy), (120, 255, 120), 3, cv2.LINE_AA)

        cv2.circle(overlay, (bx, by), 38, (0, 220, 255), -1)
        cv2.circle(frame, (bx, by), 6, (0, 0, 255), -1)

        # Display reflex-style angle like 295 deg from the sample.
        display_angle = int(round(360.0 - metrics[metric_name]))
        display_angle = display_angle % 360
        if display_angle == 0:
            display_angle = 360

        text = f"{display_angle} deg"
        text_x = bx - 20
        text_y = by + 8
        cv2.putText(frame, text, (text_x + 1, text_y + 1), cv2.FONT_HERSHEY_SIMPLEX, 0.72, (0, 0, 0), 3, cv2.LINE_AA)
        angle_ok = each_ok.get(metric_name, False)
        text_color = (255, 255, 255) if angle_ok else (240, 240, 255)
        cv2.putText(frame, text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 0.72, text_color, 2, cv2.LINE_AA)

    cv2.addWeighted(overlay, 0.32, frame, 0.68, 0, frame)


def build_output_paths() -> Tuple[Path, Path]:
    out_dir = Path("output")
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return out_dir / f"posture_{stamp}.mp4", out_dir / f"metrics_{stamp}.csv"


def run_phase_1() -> None:
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam. Check camera permissions/device.")
        return

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)

    detector = PoseDetector(model_complexity=1, min_detection_confidence=0.6, min_tracking_confidence=0.6)
    histories: Dict[str, List[float]] = defaultdict(list)
    baseline: Dict[str, float] = {}
    ideal_lms: Dict[str, Point] = {}

    video_path, csv_path = build_output_paths()
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    writer = cv2.VideoWriter(str(video_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))

    csv_file = csv_path.open("w", newline="", encoding="utf-8")
    csv_writer = csv.writer(csv_file)
    csv_writer.writerow(
        [
            "timestamp",
            "left_elbow",
            "right_elbow",
            "left_knee",
            "right_knee",
            "shoulder_alignment",
            "hip_alignment",
            "posture_ok",
            "feedback",
        ]
    )

    prev_time = time.perf_counter()

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("Warning: Failed to read frame from webcam.")
                break

            frame = cv2.flip(frame, 1)
            results = detector.process(frame)
            lms = detector.get_landmark_dict(results, frame.shape, visibility_threshold=0.45)

            posture_ok = False
            feedback = ["Move into camera view (half body is okay)"]
            each_ok: Dict[str, bool] = {}
            metrics: Dict[str, float] = {}
            tracked_fingers = get_tracked_finger_tips(lms)

            raw_metrics = compute_metrics(lms, frame.shape[0])
            for key, val in raw_metrics.items():
                metrics[key] = smooth_value(histories[key], val, window=5)

            if metrics:
                posture_ok, feedback, each_ok = evaluate_against_baseline(metrics, baseline)
                detector.draw_styled_skeleton(frame, results, posture_correct=posture_ok)
            else:
                detector.draw_styled_skeleton(frame, results, posture_correct=False)

            if baseline and not posture_ok and ideal_lms:
                detector.draw_ideal_overlay(frame, ideal_lms)

            draw_joint_angles(frame, lms, metrics, each_ok)

            if tracked_fingers:
                short_names = [
                    key.replace("LHAND_", "L-").replace("RHAND_", "R-").replace("_FINGER", "")
                    for key in tracked_fingers[:3]
                ]
                feedback.append("Tracking fingers: " + ", ".join(short_names))

            now = time.perf_counter()
            dt = max(1e-6, now - prev_time)
            display_fps = 1.0 / dt
            prev_time = now

            draw_ui(frame, lms, metrics, each_ok, posture_ok, feedback, bool(baseline), display_fps, tracked_fingers)
            writer.write(frame)

            csv_writer.writerow(
                [
                    datetime.now().isoformat(timespec="milliseconds"),
                    round(metrics.get("left_elbow", 0.0), 3),
                    round(metrics.get("right_elbow", 0.0), 3),
                    round(metrics.get("left_knee", 0.0), 3),
                    round(metrics.get("right_knee", 0.0), 3),
                    round(metrics.get("shoulder_alignment", 0.0), 5),
                    round(metrics.get("hip_alignment", 0.0), 5),
                    int(posture_ok),
                    " | ".join(feedback),
                ]
            )

            cv2.imshow("Phase-1 Posture Detection", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("c") and metrics:
                baseline.update(metrics)
                ideal_lms.update(lms)
                print("Calibration updated from currently visible body points.")

    finally:
        csv_file.close()
        writer.release()
        cap.release()
        detector.close()
        cv2.destroyAllWindows()
        print(f"Saved video: {video_path}")
        print(f"Saved metrics CSV: {csv_path}")


if __name__ == "__main__":
    run_phase_1()
