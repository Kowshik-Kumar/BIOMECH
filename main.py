"""Real-time posture detection for sports training and rehabilitation.

Run:
    python main.py

Controls:
- q: Quit
- c: Calibrate current body posture as ideal reference
"""

from __future__ import annotations

import csv
import os
import time
from collections import defaultdict
from datetime import datetime
from typing import Dict, List, Tuple

import cv2
import numpy as np

from angle_utils import (
    calculate_angle,
    calculate_pair_vertical_diff_ratio,
    evaluate_metric,
    smooth_value,
)
from pose_detector import PoseDetector

Point = Tuple[int, int]


# Configurable threshold dictionary for posture correctness.
THRESHOLDS = {
    "left_elbow": {
        "min": 155,
        "max": 180,
        "low_msg": "Straighten your left elbow",
        "high_msg": "Do not hyperextend left elbow",
    },
    "right_elbow": {
        "min": 155,
        "max": 180,
        "low_msg": "Straighten your right elbow",
        "high_msg": "Do not hyperextend right elbow",
    },
    "left_knee": {
        "min": 160,
        "max": 180,
        "low_msg": "Straighten your left knee",
        "high_msg": "Avoid locking left knee",
    },
    "right_knee": {
        "min": 160,
        "max": 180,
        "low_msg": "Straighten your right knee",
        "high_msg": "Avoid locking right knee",
    },
    "shoulder_alignment": {
        "min": 0.0,
        "max": 0.03,
        "high_msg": "Level your shoulders",
    },
    "hip_alignment": {
        "min": 0.0,
        "max": 0.035,
        "high_msg": "Level your hips",
    },
}


def ensure_output_paths() -> Tuple[str, str]:
    """Create output paths for video and CSV logs."""
    os.makedirs("output", exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    video_path = os.path.join("output", f"posture_session_{stamp}.mp4")
    csv_path = os.path.join("output", f"posture_metrics_{stamp}.csv")
    return video_path, csv_path


METRIC_REQUIREMENTS = {
    "left_elbow": ("LEFT_SHOULDER", "LEFT_ELBOW", "LEFT_WRIST"),
    "right_elbow": ("RIGHT_SHOULDER", "RIGHT_ELBOW", "RIGHT_WRIST"),
    "left_knee": ("LEFT_HIP", "LEFT_KNEE", "LEFT_ANKLE"),
    "right_knee": ("RIGHT_HIP", "RIGHT_KNEE", "RIGHT_ANKLE"),
    "shoulder_alignment": ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
    "hip_alignment": ("LEFT_HIP", "RIGHT_HIP"),
}


def has_any_required_points(lms: Dict[str, Point]) -> bool:
    required = {
        "LEFT_SHOULDER",
        "RIGHT_SHOULDER",
        "LEFT_ELBOW",
        "RIGHT_ELBOW",
        "LEFT_WRIST",
        "RIGHT_WRIST",
        "LEFT_HIP",
        "RIGHT_HIP",
        "LEFT_KNEE",
        "RIGHT_KNEE",
        "LEFT_ANKLE",
        "RIGHT_ANKLE",
    }
    return any(k in lms for k in required)


def compute_metrics(lms: Dict[str, Point], frame_h: int) -> Dict[str, float]:
    """Compute only those metrics whose required landmarks are currently visible."""
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
        metrics["hip_alignment"] = calculate_pair_vertical_diff_ratio(
            lms["LEFT_HIP"], lms["RIGHT_HIP"], frame_h
        )
    return metrics


def evaluate_posture(metrics: Dict[str, float]) -> Tuple[bool, List[str], Dict[str, bool]]:
    """Evaluate metrics against thresholds and return feedback."""
    feedback = []
    each_ok: Dict[str, bool] = {}

    if not metrics:
        return False, ["Move a bit more into frame to evaluate posture"], each_ok

    for key, value in metrics.items():
        ok, msg = evaluate_metric(value, THRESHOLDS[key])
        each_ok[key] = ok
        if not ok and msg:
            feedback.append(msg)

    return all(each_ok.values()), feedback, each_ok


def draw_metric_text(frame: np.ndarray, lms: Dict[str, Point], metrics: Dict[str, float], each_ok: Dict[str, bool]) -> None:
    """Draw angle and alignment values near related joints."""
    metric_positions: Dict[str, Point] = {}
    if "LEFT_ELBOW" in lms:
        metric_positions["left_elbow"] = lms["LEFT_ELBOW"]
    if "RIGHT_ELBOW" in lms:
        metric_positions["right_elbow"] = lms["RIGHT_ELBOW"]
    if "LEFT_KNEE" in lms:
        metric_positions["left_knee"] = lms["LEFT_KNEE"]
    if "RIGHT_KNEE" in lms:
        metric_positions["right_knee"] = lms["RIGHT_KNEE"]
    if "LEFT_SHOULDER" in lms and "RIGHT_SHOULDER" in lms:
        metric_positions["shoulder_alignment"] = (
            (lms["LEFT_SHOULDER"][0] + lms["RIGHT_SHOULDER"][0]) // 2,
            min(lms["LEFT_SHOULDER"][1], lms["RIGHT_SHOULDER"][1]) - 15,
        )
    if "LEFT_HIP" in lms and "RIGHT_HIP" in lms:
        metric_positions["hip_alignment"] = (
            (lms["LEFT_HIP"][0] + lms["RIGHT_HIP"][0]) // 2,
            min(lms["LEFT_HIP"][1], lms["RIGHT_HIP"][1]) - 15,
        )

    for name, value in metrics.items():
        if name not in metric_positions:
            continue
        pos = metric_positions[name]
        color = (0, 255, 0) if each_ok.get(name, False) else (0, 0, 255)
        suffix = "deg" if "alignment" not in name else "ratio"
        text = f"{name}: {value:.1f} {suffix}" if suffix == "deg" else f"{name}: {value:.3f}"

        cv2.putText(
            frame,
            text,
            (int(pos[0]) + 8, int(pos[1]) - 8),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA,
        )


def draw_feedback(frame: np.ndarray, posture_ok: bool, feedback: List[str], fps: float) -> None:
    """Render posture state, dynamic feedback, and FPS."""
    h, w = frame.shape[:2]
    state_text = "POSTURE: CORRECT" if posture_ok else "POSTURE: INCORRECT"
    state_color = (0, 255, 0) if posture_ok else (0, 0, 255)

    cv2.putText(frame, state_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.9, state_color, 2, cv2.LINE_AA)
    cv2.putText(frame, f"FPS: {fps:.1f}", (w - 140, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2, cv2.LINE_AA)

    y = 65
    if not posture_ok:
        for msg in feedback[:4]:
            cv2.putText(frame, msg, (20, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (20, 20, 255), 2, cv2.LINE_AA)
            y += 28


def init_csv(csv_path: str) -> None:
    """Initialize posture-metrics CSV file."""
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "timestamp",
                "left_elbow",
                "right_elbow",
                "left_knee",
                "right_knee",
                "shoulder_alignment",
                "hip_alignment",
                "posture_ok",
            ]
        )


def append_csv(csv_path: str, metrics: Dict[str, float], posture_ok: bool) -> None:
    """Append one frame's metrics for later analysis."""
    with open(csv_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                datetime.now().isoformat(timespec="milliseconds"),
                f"{metrics['left_elbow']:.2f}" if "left_elbow" in metrics else "",
                f"{metrics['right_elbow']:.2f}" if "right_elbow" in metrics else "",
                f"{metrics['left_knee']:.2f}" if "left_knee" in metrics else "",
                f"{metrics['right_knee']:.2f}" if "right_knee" in metrics else "",
                f"{metrics['shoulder_alignment']:.4f}" if "shoulder_alignment" in metrics else "",
                f"{metrics['hip_alignment']:.4f}" if "hip_alignment" in metrics else "",
                int(posture_ok),
            ]
        )


def main() -> None:
    detector = PoseDetector(
        model_complexity=1,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.6,
    )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Could not open webcam. Check camera permissions/device.")

    # Lower capture resolution to improve real-time FPS on modest hardware.
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 960
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 540
    fps_in = cap.get(cv2.CAP_PROP_FPS)
    out_fps = fps_in if fps_in and fps_in > 1 else 30.0

    video_path, csv_path = ensure_output_paths()
    init_csv(csv_path)

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(video_path, fourcc, out_fps, (width, height))

    ideal_landmarks: Dict[str, Point] = {}

    # Moving-average smoothing history by metric name.
    smooth_histories: Dict[str, List[float]] = defaultdict(list)

    prev_time = time.perf_counter()

    print("Controls: press 'c' to calibrate ideal posture, 'q' to quit.")
    print(f"Recording output video to: {video_path}")
    print(f"Saving posture metrics to: {csv_path}")

    frame_idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break

        frame = cv2.flip(frame, 1)

        results = detector.process(frame)
        lms = detector.get_landmark_dict(results, frame.shape, visibility_threshold=0.45)

        posture_ok = False
        feedback: List[str] = []
        each_ok: Dict[str, bool] = {}
        metrics: Dict[str, float] = {}

        if has_any_required_points(lms):
            raw_metrics = compute_metrics(lms, frame_h=frame.shape[0])

            # Smooth metrics to reduce noisy per-frame jitter.
            for key, value in raw_metrics.items():
                metrics[key] = smooth_value(smooth_histories[key], value, window=5)

            posture_ok, feedback, each_ok = evaluate_posture(metrics)

            detector.draw_styled_skeleton(frame, results, posture_correct=posture_ok)
            if metrics:
                draw_metric_text(frame, lms, metrics, each_ok)

            if not posture_ok and metrics:
                detector.draw_ideal_overlay(frame, lms, ideal_landmarks)

            # Save every 3rd frame to reduce disk overhead and keep real-time speed.
            if frame_idx % 3 == 0 and metrics:
                append_csv(csv_path, metrics, posture_ok)
        else:
            cv2.putText(
                frame,
                "No valid body points found. Move into camera view",
                (20, 70),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

        # FPS estimation.
        current_time = time.perf_counter()
        dt = max(1e-6, current_time - prev_time)
        fps = 1.0 / dt
        prev_time = current_time

        draw_feedback(frame, posture_ok, feedback, fps)

        cv2.putText(
            frame,
            "Press C: Calibrate ideal posture | Press Q: Quit",
            (20, height - 18),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (255, 255, 255),
            1,
            cv2.LINE_AA,
        )

        writer.write(frame)
        cv2.imshow("Real-Time Human Posture Detection", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == ord("q"):
            break
        if key == ord("c") and has_any_required_points(lms):
            # Calibration: save current posture as ideal reference overlay.
            ideal_landmarks = dict(lms)
            cv2.putText(
                frame,
                "Calibration saved",
                (20, 105),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.8,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )

        frame_idx += 1

    cap.release()
    writer.release()
    detector.close()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
