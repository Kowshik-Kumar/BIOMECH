"""MediaPipe pose + hands wrapper for phase-1 posture detection."""

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

    HAND_TIP_LABELS: Dict[int, str] = {
        4: "THUMB",
        8: "INDEX",
        12: "MIDDLE",
        16: "RING",
        20: "PINKY",
    }

    BODY_CONNECTIONS: List[Tuple[str, str]] = [
        ("LEFT_SHOULDER", "RIGHT_SHOULDER"),
        ("LEFT_SHOULDER", "LEFT_ELBOW"),
        ("LEFT_ELBOW", "LEFT_WRIST"),
        ("RIGHT_SHOULDER", "RIGHT_ELBOW"),
        ("RIGHT_ELBOW", "RIGHT_WRIST"),
        ("LEFT_SHOULDER", "LEFT_HIP"),
        ("RIGHT_SHOULDER", "RIGHT_HIP"),
        ("LEFT_HIP", "RIGHT_HIP"),
        ("LEFT_HIP", "LEFT_KNEE"),
        ("LEFT_KNEE", "LEFT_ANKLE"),
        ("RIGHT_HIP", "RIGHT_KNEE"),
        ("RIGHT_KNEE", "RIGHT_ANKLE"),
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

        hands_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        hands_results = self.hands.process(hands_rgb)
        return {"pose": pose_results, "hands": hands_results}

    def get_landmark_dict(
        self,
        results,
        frame_shape: Tuple[int, int, int],
        visibility_threshold: float = 0.5,
    ) -> Dict[str, Tuple[int, int]]:
        """Extract selected body and hand landmarks in pixel coordinates."""
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
                side_prefix = "LHAND" if side == "LEFT" else "RHAND"
                for idx, lm_name in enumerate(self.HAND_LANDMARK_NAMES):
                    lm = hand_lms.landmark[idx]
                    landmark_dict[f"{side_prefix}_{lm_name}"] = (int(lm.x * w), int(lm.y * h))
        return landmark_dict

    def draw_styled_skeleton(
        self,
        frame: np.ndarray,
        results,
        posture_correct: bool,
    ) -> None:
        """Draw major-body skeleton and hand landmarks with posture-dependent color."""
        if not results:
            return

        pose_results, hands_results = self._split_results(results)
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
            visible_points: Dict[str, Tuple[int, int]] = {}
            for name, lm_enum in key_points.items():
                lm = lms[lm_enum.value]
                if lm.visibility < 0.45:
                    continue
                visible_points[name] = (int(lm.x * w), int(lm.y * h))

            for a, b in self.BODY_CONNECTIONS:
                if a in visible_points and b in visible_points:
                    cv2.line(frame, visible_points[a], visible_points[b], color, 3, cv2.LINE_AA)

            if all(name in visible_points for name in ("LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP")):
                neck = (
                    (visible_points["LEFT_SHOULDER"][0] + visible_points["RIGHT_SHOULDER"][0]) // 2,
                    (visible_points["LEFT_SHOULDER"][1] + visible_points["RIGHT_SHOULDER"][1]) // 2,
                )
                body_center = (
                    (visible_points["LEFT_HIP"][0] + visible_points["RIGHT_HIP"][0]) // 2,
                    (visible_points["LEFT_HIP"][1] + visible_points["RIGHT_HIP"][1]) // 2,
                )
                cv2.line(frame, neck, body_center, color, 3, cv2.LINE_AA)
                cv2.circle(frame, neck, 6, color, -1)

            for pt in visible_points.values():
                cv2.circle(frame, pt, 4, color, -1)

        if hands_results and hands_results.multi_hand_landmarks and hands_results.multi_handedness:
            for hand_lms, handedness in zip(hands_results.multi_hand_landmarks, hands_results.multi_handedness):
                side = handedness.classification[0].label.upper()
                tip_color = (255, 200, 0) if side == "LEFT" else (255, 0, 180)
                points = [(int(lm.x * w), int(lm.y * h)) for lm in hand_lms.landmark]
                for edge in self.mp_hands.HAND_CONNECTIONS:
                    cv2.line(frame, points[edge[0]], points[edge[1]], (180, 180, 180), 2, cv2.LINE_AA)

                for idx, pt in enumerate(points):
                    if idx in self.HAND_TIP_LABELS:
                        cv2.circle(frame, pt, 4, tip_color, -1)
                        label = f"{side[0]}-{self.HAND_TIP_LABELS[idx]}"
                        cv2.putText(
                            frame,
                            label,
                            (pt[0] + 4, pt[1] - 4),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.35,
                            tip_color,
                            1,
                            cv2.LINE_AA,
                        )
                    else:
                        cv2.circle(frame, pt, 2, (220, 220, 220), -1)

    @staticmethod
    def draw_dotted_line(
        frame: np.ndarray,
        pt1: Tuple[int, int],
        pt2: Tuple[int, int],
        color: Tuple[int, int, int] = (0, 255, 255),
        dot_radius: int = 2,
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
            cv2.circle(frame, (x, y), dot_radius, color, -1)

    def draw_ideal_overlay(self, frame: np.ndarray, ideal_lms: Dict[str, Tuple[int, int]]) -> None:
        """Draw dotted yellow ideal body/hand lines for correction guidance."""
        if not ideal_lms:
            return

        yellow = (0, 255, 255)

        for a, b in self.BODY_CONNECTIONS:
            if a in ideal_lms and b in ideal_lms:
                self.draw_dotted_line(frame, ideal_lms[a], ideal_lms[b], color=yellow, dot_radius=2, gap=9)

        if all(name in ideal_lms for name in ("LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP")):
            neck = (
                (ideal_lms["LEFT_SHOULDER"][0] + ideal_lms["RIGHT_SHOULDER"][0]) // 2,
                (ideal_lms["LEFT_SHOULDER"][1] + ideal_lms["RIGHT_SHOULDER"][1]) // 2,
            )
            body_center = (
                (ideal_lms["LEFT_HIP"][0] + ideal_lms["RIGHT_HIP"][0]) // 2,
                (ideal_lms["LEFT_HIP"][1] + ideal_lms["RIGHT_HIP"][1]) // 2,
            )
            self.draw_dotted_line(frame, neck, body_center, color=yellow, dot_radius=2, gap=8)

        hand_name_by_idx = {idx: name for idx, name in enumerate(self.HAND_LANDMARK_NAMES)}
        for side_prefix in ("LHAND", "RHAND"):
            for edge in self.mp_hands.HAND_CONNECTIONS:
                a_name = hand_name_by_idx.get(edge[0])
                b_name = hand_name_by_idx.get(edge[1])
                if a_name is None or b_name is None:
                    continue
                a_key = f"{side_prefix}_{a_name}"
                b_key = f"{side_prefix}_{b_name}"
                if a_key in ideal_lms and b_key in ideal_lms:
                    self.draw_dotted_line(frame, ideal_lms[a_key], ideal_lms[b_key], color=yellow, dot_radius=1, gap=7)

        for name, pt in ideal_lms.items():
            if name.endswith("_TIP") or name in ("LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP", "RIGHT_HIP"):
                cv2.circle(frame, pt, 2, yellow, -1)

    def close(self) -> None:
        """Release MediaPipe resources."""
        self.pose.close()
        self.hands.close()


if __name__ == "__main__":
    print("pose_detector.py is a helper module.")
    print("Run main.py to start phase-1 posture detection.")
