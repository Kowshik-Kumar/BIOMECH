"""HTTP camera streaming API for the frontend live feed."""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, List, Tuple

import cv2
from flask import Flask, Response, jsonify, request

from angle_utils import smooth_value
from main import (
    compute_metrics,
    draw_joint_angles,
    draw_ui,
    evaluate_against_baseline,
    get_tracked_finger_tips,
)
from pose_detector import PoseDetector

Point = Tuple[int, int]


class CameraRuntime:
    """Keeps webcam and posture state alive across HTTP requests."""

    def __init__(self) -> None:
        self.lock = Lock()
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 960)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 540)

        self.detector = PoseDetector(model_complexity=1, min_detection_confidence=0.6, min_tracking_confidence=0.6)
        self.histories: Dict[str, List[float]] = defaultdict(list)
        self.baseline: Dict[str, float] = {}
        self.ideal_lms: Dict[str, Point] = {}
        self.last_metrics: Dict[str, float] = {}
        self.last_lms: Dict[str, Point] = {}
        self.last_feedback: List[str] = ["Waiting for camera stream"]
        self.prev_time = time.perf_counter()

    def is_opened(self) -> bool:
        return bool(self.cap and self.cap.isOpened())

    def calibrate(self) -> bool:
        with self.lock:
            if not self.last_metrics or not self.last_lms:
                return False
            self.baseline = dict(self.last_metrics)
            self.ideal_lms = dict(self.last_lms)
            return True

    def stop_calibration(self) -> bool:
        with self.lock:
            if not self.baseline and not self.ideal_lms:
                return False
            self.baseline.clear()
            self.ideal_lms.clear()
            return True

    def read_processed_frame(self):
        with self.lock:
            if not self.is_opened():
                return None

            ok, frame = self.cap.read()
            if not ok:
                return None

            frame = cv2.flip(frame, 1)
            results = self.detector.process(frame)
            lms = self.detector.get_landmark_dict(results, frame.shape, visibility_threshold=0.45)

            posture_ok = False
            feedback = ["Move into camera view (half body is okay)"]
            each_ok: Dict[str, bool] = {}
            metrics: Dict[str, float] = {}
            tracked_fingers = get_tracked_finger_tips(lms)

            raw_metrics = compute_metrics(lms, frame.shape[0])
            for key, val in raw_metrics.items():
                metrics[key] = smooth_value(self.histories[key], val, window=5)

            if metrics:
                posture_ok, feedback, each_ok = evaluate_against_baseline(metrics, self.baseline)
                self.detector.draw_styled_skeleton(frame, results, posture_correct=posture_ok)
            else:
                self.detector.draw_styled_skeleton(frame, results, posture_correct=False)

            if self.baseline and not posture_ok and self.ideal_lms:
                self.detector.draw_ideal_overlay(frame, self.ideal_lms)

            draw_joint_angles(frame, lms, metrics, each_ok)

            if tracked_fingers:
                short_names = [
                    key.replace("LHAND_", "L-").replace("RHAND_", "R-").replace("_FINGER", "")
                    for key in tracked_fingers[:3]
                ]
                feedback.append("Tracking fingers: " + ", ".join(short_names))

            now = time.perf_counter()
            dt = max(1e-6, now - self.prev_time)
            display_fps = 1.0 / dt
            self.prev_time = now

            draw_ui(frame, lms, metrics, each_ok, posture_ok, feedback, bool(self.baseline), display_fps, tracked_fingers)

            self.last_metrics = dict(metrics)
            self.last_lms = dict(lms)
            self.last_feedback = list(feedback)

            return frame, posture_ok, feedback, bool(self.baseline)

    def close(self) -> None:
        with self.lock:
            if self.cap:
                self.cap.release()
            self.detector.close()


app = Flask(__name__)
runtime = CameraRuntime()


@app.after_request
def add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


@app.route("/camera/health", methods=["GET"])
def camera_health():
    return jsonify(
        {
            "camera_open": runtime.is_opened(),
            "calibrated": bool(runtime.baseline),
            "feedback": runtime.last_feedback,
        }
    )


@app.route("/camera/calibrate", methods=["POST", "OPTIONS"])
def camera_calibrate():
    if request.method == "OPTIONS":
        return ("", 204)

    ok = runtime.calibrate()
    status = 200 if ok else 400
    return (
        jsonify(
            {
                "ok": ok,
                "message": "Calibration updated." if ok else "No pose detected yet. Stand in frame and try again.",
            }
        ),
        status,
    )


@app.route("/camera/calibration/stop", methods=["POST", "OPTIONS"])
def camera_stop_calibration():
    if request.method == "OPTIONS":
        return ("", 204)

    ok = runtime.stop_calibration()
    status = 200 if ok else 400
    return (
        jsonify(
            {
                "ok": ok,
                "message": "Calibration cleared." if ok else "No active calibration to clear.",
            }
        ),
        status,
    )


@app.route("/camera/feed", methods=["GET"])
def camera_feed():
    def generate():
        while True:
            processed = runtime.read_processed_frame()
            if processed is None:
                time.sleep(0.05)
                continue

            frame, _, _, _ = processed
            ok, buffer = cv2.imencode(".jpg", frame)
            if not ok:
                continue

            frame_bytes = buffer.tobytes()
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )

    return Response(generate(), mimetype="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    try:
        app.run(host="0.0.0.0", port=8000, debug=False, threaded=True)
    finally:
        runtime.close()