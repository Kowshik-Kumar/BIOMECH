"""MediaPipe pose + hands wrapper for real-time landmark extraction and drawing."""

from __future__ import annotations

from typing import Dict, List, Tuple

import cv2
import mediapipe as mp
import numpy as np


class PoseDetector:
    """Thin wrapper around MediaPipe Pose for modular integration."""

    HAND_LANDMARK_NAMES: List[str] = [
        "WRIST",
        "THUMB_CMC",
        "THUMB_MCP",
        "THUMB_IP",
        "THUMB_TIP",
        "INDEX_FINGER_MCP",
        "INDEX_FINGER_PIP",
        "INDEX_FINGER_DIP",
        "INDEX_FINGER_TIP",
        "MIDDLE_FINGER_MCP",
        "MIDDLE_FINGER_PIP",
        "MIDDLE_FINGER_DIP",
        "MIDDLE_FINGER_TIP",
        "RING_FINGER_MCP",
        "RING_FINGER_PIP",
        "RING_FINGER_DIP",
        "RING_FINGER_TIP",
        "PINKY_MCP",
        "PINKY_PIP",
        "PINKY_DIP",
        "PINKY_TIP",
    ]

    HAND_KEY_CONNECTIONS: List[Tuple[str, str]] = [
        ("WRIST", "THUMB_CMC"),
        ("THUMB_CMC", "THUMB_MCP"),
        ("THUMB_MCP", "THUMB_IP"),
        ("THUMB_IP", "THUMB_TIP"),
        ("WRIST", "INDEX_FINGER_MCP"),
        ("INDEX_FINGER_MCP", "INDEX_FINGER_PIP"),
        ("INDEX_FINGER_PIP", "INDEX_FINGER_DIP"),
        ("INDEX_FINGER_DIP", "INDEX_FINGER_TIP"),
        ("WRIST", "MIDDLE_FINGER_MCP"),
        ("MIDDLE_FINGER_MCP", "MIDDLE_FINGER_PIP"),
        ("MIDDLE_FINGER_PIP", "MIDDLE_FINGER_DIP"),
        ("MIDDLE_FINGER_DIP", "MIDDLE_FINGER_TIP"),
        ("WRIST", "RING_FINGER_MCP"),
        ("RING_FINGER_MCP", "RING_FINGER_PIP"),
        ("RING_FINGER_PIP", "RING_FINGER_DIP"),
        ("RING_FINGER_DIP", "RING_FINGER_TIP"),
        ("WRIST", "PINKY_MCP"),
        ("PINKY_MCP", "PINKY_PIP"),
        ("PINKY_PIP", "PINKY_DIP"),
        ("PINKY_DIP", "PINKY_TIP"),
    ]

    def __init__(
        self,
        static_image_mode: bool = False,
        model_complexity: int = 1,
        smooth_landmarks: bool = True,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ) -> None:
        self.mp_pose = mp.solutions.pose
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.pose = self.mp_pose.Pose(
            static_image_mode=static_image_mode,
            model_complexity=model_complexity,
            smooth_landmarks=smooth_landmarks,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self.hands = self.mp_hands.Hands(
            static_image_mode=static_image_mode,
            max_num_hands=2,
            model_complexity=1,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        self._hands_error_logged = False

    @staticmethod
    def _split_results(results):
        if isinstance(results, dict):
            return results.get("pose"), results.get("hands")
        return results, None

    def process(self, frame_bgr: np.ndarray):
        """Run pose and hand detection and return combined results."""
        pose_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        pose_rgb.flags.writeable = False
        pose_results = self.pose.process(pose_rgb)

        # Keep hand inference isolated so any hand-model runtime issue
        # does not crash the full posture pipeline.
        hands_results = None
        hands_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        try:
            hands_results = self.hands.process(hands_rgb)
        except Exception as exc:  # pragma: no cover - runtime backend safeguard
            if not self._hands_error_logged:
                print(f"Warning: hand tracking disabled due to runtime error: {exc}")
                self._hands_error_logged = True
        return {"pose": pose_results, "hands": hands_results}

    def get_landmark_dict(
        self,
        results,
        frame_shape: Tuple[int, int, int],
        visibility_threshold: float = 0.5,
    ) -> Dict[str, Tuple[int, int]]:
        """Extract selected body and detailed finger landmarks in pixel coordinates."""
        h, w = frame_shape[:2]
        pose_results, hands_results = self._split_results(results)
        selected = {
            "NOSE": self.mp_pose.PoseLandmark.NOSE,
            "LEFT_SHOULDER": self.mp_pose.PoseLandmark.LEFT_SHOULDER,
            "RIGHT_SHOULDER": self.mp_pose.PoseLandmark.RIGHT_SHOULDER,
            "LEFT_ELBOW": self.mp_pose.PoseLandmark.LEFT_ELBOW,
            "RIGHT_ELBOW": self.mp_pose.PoseLandmark.RIGHT_ELBOW,
            "LEFT_WRIST": self.mp_pose.PoseLandmark.LEFT_WRIST,
            "RIGHT_WRIST": self.mp_pose.PoseLandmark.RIGHT_WRIST,
            "LEFT_HIP": self.mp_pose.PoseLandmark.LEFT_HIP,
            "RIGHT_HIP": self.mp_pose.PoseLandmark.RIGHT_HIP,
            "LEFT_KNEE": self.mp_pose.PoseLandmark.LEFT_KNEE,
            "RIGHT_KNEE": self.mp_pose.PoseLandmark.RIGHT_KNEE,
            "LEFT_ANKLE": self.mp_pose.PoseLandmark.LEFT_ANKLE,
            "RIGHT_ANKLE": self.mp_pose.PoseLandmark.RIGHT_ANKLE,
        }

        landmark_dict: Dict[str, Tuple[int, int]] = {}
        if pose_results and pose_results.pose_landmarks:
            for name, lm_enum in selected.items():
                lm = pose_results.pose_landmarks.landmark[lm_enum.value]
                if lm.visibility < visibility_threshold:
                    continue
                x = int(lm.x * w)
                y = int(lm.y * h)
                landmark_dict[name] = (x, y)

        if hands_results and hands_results.multi_hand_landmarks and hands_results.multi_handedness:
            for hand_lms, handedness in zip(hands_results.multi_hand_landmarks, hands_results.multi_handedness):
                side = handedness.classification[0].label.upper()
                for idx, lm_name in enumerate(self.HAND_LANDMARK_NAMES):
                    if lm_name == "WRIST":
                        continue
                    lm = hand_lms.landmark[idx]
                    x = int(lm.x * w)
                    y = int(lm.y * h)
                    landmark_dict[f"{side}_{lm_name}"] = (x, y)
        return landmark_dict

    def draw_styled_skeleton(
        self,
        frame: np.ndarray,
        results,
        posture_correct: bool,
    ) -> None:
        """Draw major-body skeleton plus per-finger joints with posture-dependent color."""
        pose_results, hands_results = self._split_results(results)
        if not pose_results and not hands_results:
            return

        color = (0, 255, 0) if posture_correct else (0, 0, 255)
        h, w = frame.shape[:2]

        if pose_results and pose_results.pose_landmarks:
            lms = pose_results.pose_landmarks.landmark
            key_points = {
                "NOSE": self.mp_pose.PoseLandmark.NOSE,
                "LEFT_SHOULDER": self.mp_pose.PoseLandmark.LEFT_SHOULDER,
                "RIGHT_SHOULDER": self.mp_pose.PoseLandmark.RIGHT_SHOULDER,
                "LEFT_ELBOW": self.mp_pose.PoseLandmark.LEFT_ELBOW,
                "RIGHT_ELBOW": self.mp_pose.PoseLandmark.RIGHT_ELBOW,
                "LEFT_WRIST": self.mp_pose.PoseLandmark.LEFT_WRIST,
                "RIGHT_WRIST": self.mp_pose.PoseLandmark.RIGHT_WRIST,
                "LEFT_HIP": self.mp_pose.PoseLandmark.LEFT_HIP,
                "RIGHT_HIP": self.mp_pose.PoseLandmark.RIGHT_HIP,
                "LEFT_KNEE": self.mp_pose.PoseLandmark.LEFT_KNEE,
                "RIGHT_KNEE": self.mp_pose.PoseLandmark.RIGHT_KNEE,
                "LEFT_ANKLE": self.mp_pose.PoseLandmark.LEFT_ANKLE,
                "RIGHT_ANKLE": self.mp_pose.PoseLandmark.RIGHT_ANKLE,
            }
            key_connections = [
                ("NOSE", "LEFT_SHOULDER"),
                ("NOSE", "RIGHT_SHOULDER"),
                ("LEFT_SHOULDER", "LEFT_ELBOW"),
                ("LEFT_ELBOW", "LEFT_WRIST"),
                ("RIGHT_SHOULDER", "RIGHT_ELBOW"),
                ("RIGHT_ELBOW", "RIGHT_WRIST"),
                ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
                ("LEFT_SHOULDER", "LEFT_HIP"),
                ("RIGHT_SHOULDER", "RIGHT_HIP"),
                ("LEFT_HIP", "RIGHT_HIP"),
                ("LEFT_HIP", "LEFT_KNEE"),
                ("LEFT_KNEE", "LEFT_ANKLE"),
                ("RIGHT_HIP", "RIGHT_KNEE"),
                ("RIGHT_KNEE", "RIGHT_ANKLE"),
            ]

            visible_points: Dict[str, Tuple[int, int]] = {}
            for name, lm_enum in key_points.items():
                lm = lms[lm_enum.value]
                if lm.visibility < 0.45:
                    continue
                visible_points[name] = (int(lm.x * w), int(lm.y * h))

            for a, b in key_connections:
                if a in visible_points and b in visible_points:
                    cv2.line(frame, visible_points[a], visible_points[b], color, 3, cv2.LINE_AA)

            for pt in visible_points.values():
                cv2.circle(frame, pt, 4, color, -1)

        if hands_results and hands_results.multi_hand_landmarks:
            for hand_lms in hands_results.multi_hand_landmarks:
                points = [(int(lm.x * w), int(lm.y * h)) for lm in hand_lms.landmark]
                for edge in self.mp_hands.HAND_CONNECTIONS:
                    cv2.line(frame, points[edge[0]], points[edge[1]], color, 2, cv2.LINE_AA)
                for pt in points:
                    cv2.circle(frame, pt, 3, color, -1)

    @staticmethod
    def draw_dotted_line(
        frame: np.ndarray,
        pt1: Tuple[int, int],
        pt2: Tuple[int, int],
        color: Tuple[int, int, int] = (0, 255, 0),
        thickness: int = 2,
        gap: int = 8,
    ) -> None:
        """Draw a dotted line between two points."""
        dist = int(np.hypot(pt2[0] - pt1[0], pt2[1] - pt1[1]))
        if dist <= 0:
            return

        for i in range(0, dist, gap):
            r = i / dist
            x = int(pt1[0] + (pt2[0] - pt1[0]) * r)
            y = int(pt1[1] + (pt2[1] - pt1[1]) * r)
            cv2.circle(frame, (x, y), thickness, color, -1)

    def draw_ideal_overlay(
        self,
        frame: np.ndarray,
        current_lms: Dict[str, Tuple[int, int]],
        ideal_lms: Dict[str, Tuple[int, int]],
    ) -> None:
        """Draw dotted ideal posture skeleton when posture is incorrect."""
        key_connections = [
            ("NOSE", "LEFT_SHOULDER"),
            ("NOSE", "RIGHT_SHOULDER"),
            ("LEFT_SHOULDER", "LEFT_ELBOW"),
            ("LEFT_ELBOW", "LEFT_WRIST"),
            ("RIGHT_SHOULDER", "RIGHT_ELBOW"),
            ("RIGHT_ELBOW", "RIGHT_WRIST"),
            ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
            ("LEFT_SHOULDER", "LEFT_HIP"),
            ("RIGHT_SHOULDER", "RIGHT_HIP"),
            ("LEFT_HIP", "RIGHT_HIP"),
            ("LEFT_HIP", "LEFT_KNEE"),
            ("LEFT_KNEE", "LEFT_ANKLE"),
            ("RIGHT_HIP", "RIGHT_KNEE"),
            ("RIGHT_KNEE", "RIGHT_ANKLE"),
        ]

        for side in ("LEFT", "RIGHT"):
            for a, b in self.HAND_KEY_CONNECTIONS:
                key_connections.append((f"{side}_{a}", f"{side}_{b}"))
            key_connections.append((f"{side}_WRIST", f"{side}_THUMB_CMC"))

        if not ideal_lms and current_lms:
            ideal_lms = current_lms

        for a, b in key_connections:
            if a in ideal_lms and b in ideal_lms:
                self.draw_dotted_line(frame, ideal_lms[a], ideal_lms[b], color=(0, 255, 0), thickness=2, gap=10)

        for name, point in ideal_lms.items():
            cv2.circle(frame, point, 4, (0, 255, 0), -1)
            if "FINGER" in name or "THUMB" in name or "PINKY" in name:
                continue
            cv2.putText(
                frame,
                name.replace("LEFT_", "L-").replace("RIGHT_", "R-"),
                (point[0] + 4, point[1] - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.35,
                (0, 220, 0),
                1,
                cv2.LINE_AA,
            )

    def close(self) -> None:
        """Release MediaPipe resources."""
        self.pose.close()
        self.hands.close()


if __name__ == "__main__":
    print("pose_detector.py is a helper module.")
    print("Run main.py to start webcam posture and finger tracking.")
