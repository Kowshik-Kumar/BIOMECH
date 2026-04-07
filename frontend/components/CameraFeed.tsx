"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Pose, POSE_CONNECTIONS, type Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { loadSessions, saveSession } from "@/lib/biomechanics/storage";
import type { AnalysisResult, RuleOutcome } from "@/lib/biomechanics/types";

type PosePoint = {
  x: number;
  y: number;
};

type AnalyzePayload = {
  injury_type: string;
  keypoints: Record<string, PosePoint>;
};

type AnalyzeResponse = {
  timestamp: string;
  posture_ok: boolean;
  errors: RuleOutcome[];
};

type Landmark2D = {
  x: number;
  y: number;
  visibility?: number;
};

type CameraFeedProps = {
  injuryType: string;
  onAnalysis: (result: AnalyzeResponse | null) => void;
  onHistoryUpdate: (sessions: AnalysisResult[]) => void;
};

const SEND_EVERY_NTH_FRAME = 5;

const LANDMARK_INDEX = {
  nose: 0,
  left_shoulder: 11,
  right_shoulder: 12,
  left_elbow: 13,
  right_elbow: 14,
  left_wrist: 15,
  right_wrist: 16,
  left_hip: 23,
  right_hip: 24,
  left_knee: 25,
  right_knee: 26,
  left_foot: 31,
  right_foot: 32,
} as const;

const BODY_LANDMARK_INDICES = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32] as const;
const BODY_LANDMARK_INDEX_SET = new Set<number>(BODY_LANDMARK_INDICES);
const CORE_LANDMARK_INDICES = [11, 12, 23, 24] as const;
const BODY_POSE_CONNECTIONS = POSE_CONNECTIONS.filter(
  ([start, end]) => BODY_LANDMARK_INDEX_SET.has(start) && BODY_LANDMARK_INDEX_SET.has(end),
);
const VISIBILITY_THRESHOLD = 0.55;

function drawDottedLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  gap = 8,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) {
    return;
  }

  for (let i = 0; i <= dist; i += gap) {
    const t = i / dist;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

function round3(value: number): number {
  return Number(value.toFixed(3));
}

function normalize01(value: number): number {
  return round3(Math.max(0, Math.min(1, value)));
}

function calculateAngle(a: Landmark2D, b: Landmark2D, c: Landmark2D): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);

  if (magAB < 1e-6 || magCB < 1e-6) {
    return 0;
  }

  const cosine = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosine) * (180 / Math.PI);
}

function drawJointAngle(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark2D[],
  aIndex: number,
  bIndex: number,
  cIndex: number,
  width: number,
  height: number,
) {
  const a = landmarks[aIndex];
  const b = landmarks[bIndex];
  const c = landmarks[cIndex];

  if (!a || !b || !c) {
    return;
  }

  if ((a.visibility ?? 1) < VISIBILITY_THRESHOLD || (b.visibility ?? 1) < VISIBILITY_THRESHOLD || (c.visibility ?? 1) < VISIBILITY_THRESHOLD) {
    return;
  }

  const ax = a.x * width;
  const ay = a.y * height;
  const bx = b.x * width;
  const by = b.y * height;
  const cx = c.x * width;
  const cy = c.y * height;

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(ax, ay);
  ctx.stroke();

  ctx.strokeStyle = "#86efac";
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.stroke();

  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();

  const angle = calculateAngle(a, b, c);
  let displayAngle = Math.round((360 - angle) % 360);
  if (displayAngle === 0) {
    displayAngle = 360;
  }

  const text = `${displayAngle} deg`;
  const tx = bx - 24;
  const ty = by + 8;
  ctx.font = "700 16px system-ui";
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillText(text, tx + 1, ty + 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, tx, ty);
}

function buildPayload(results: Results, injuryType: string): AnalyzePayload | null {
  if (!results.poseLandmarks) {
    return null;
  }

  const lms = results.poseLandmarks;

  const leftShoulder = lms[LANDMARK_INDEX.left_shoulder];
  const rightShoulder = lms[LANDMARK_INDEX.right_shoulder];
  const leftHip = lms[LANDMARK_INDEX.left_hip];
  const rightHip = lms[LANDMARK_INDEX.right_hip];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }

  const neck = {
    x: normalize01((leftShoulder.x + rightShoulder.x) / 2),
    y: normalize01((leftShoulder.y + rightShoulder.y) / 2),
  };

  return {
    injury_type: injuryType,
    keypoints: {
      left_shoulder: { x: normalize01(leftShoulder.x), y: normalize01(leftShoulder.y) },
      right_shoulder: { x: normalize01(rightShoulder.x), y: normalize01(rightShoulder.y) },
      left_elbow: { x: normalize01(lms[LANDMARK_INDEX.left_elbow].x), y: normalize01(lms[LANDMARK_INDEX.left_elbow].y) },
      right_elbow: { x: normalize01(lms[LANDMARK_INDEX.right_elbow].x), y: normalize01(lms[LANDMARK_INDEX.right_elbow].y) },
      left_wrist: { x: normalize01(lms[LANDMARK_INDEX.left_wrist].x), y: normalize01(lms[LANDMARK_INDEX.left_wrist].y) },
      right_wrist: { x: normalize01(lms[LANDMARK_INDEX.right_wrist].x), y: normalize01(lms[LANDMARK_INDEX.right_wrist].y) },
      left_hip: { x: normalize01(leftHip.x), y: normalize01(leftHip.y) },
      right_hip: { x: normalize01(rightHip.x), y: normalize01(rightHip.y) },
      left_knee: { x: normalize01(lms[LANDMARK_INDEX.left_knee].x), y: normalize01(lms[LANDMARK_INDEX.left_knee].y) },
      right_knee: { x: normalize01(lms[LANDMARK_INDEX.right_knee].x), y: normalize01(lms[LANDMARK_INDEX.right_knee].y) },
      left_foot: { x: normalize01(lms[LANDMARK_INDEX.left_foot].x), y: normalize01(lms[LANDMARK_INDEX.left_foot].y) },
      right_foot: { x: normalize01(lms[LANDMARK_INDEX.right_foot].x), y: normalize01(lms[LANDMARK_INDEX.right_foot].y) },
      neck,
      nose: { x: normalize01(lms[LANDMARK_INDEX.nose].x), y: normalize01(lms[LANDMARK_INDEX.nose].y) },
    },
  };
}

export default function CameraFeed({ injuryType, onAnalysis, onHistoryUpdate }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const frameCounterRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const animationRef = useRef<number | null>(null);
  const postureOkRef = useRef<boolean | null>(null);
  const lastCorrectLandmarksRef = useRef<Landmark2D[] | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [statusText, setStatusText] = useState("Starting camera...");

  const apiBase = useMemo(() => {
    if (process.env.NEXT_PUBLIC_SPORTS_API_BASE) {
      return process.env.NEXT_PUBLIC_SPORTS_API_BASE;
    }

    if (typeof window !== "undefined") {
      return `http://${window.location.hostname}:8001`;
    }

    return "http://127.0.0.1:8001";
  }, []);

  const postForAnalysis = useCallback(async (payload: AnalyzePayload) => {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    try {
      const response = await fetch(`${apiBase}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`analysis-request-failed:${response.status}:${body}`);
      }

      const data = (await response.json()) as AnalyzeResponse;
      onAnalysis(data);
      postureOkRef.current = data.posture_ok;
      setStatusText(data.posture_ok ? "Correct posture" : "Error detected");

      const session: AnalysisResult = {
        timestamp: data.timestamp,
        exercise: injuryType,
        errors: data.errors,
      };
      const next = saveSession(session);
      onHistoryUpdate(next.filter((entry) => entry.exercise === injuryType));
    } catch (error) {
      const message = String(error);
      if (message.includes("analysis-request-failed:")) {
        const match = message.match(/analysis-request-failed:(\d+)/);
        const status = match?.[1] ?? "unknown";
        setStatusText(`Backend response error (${status})`);
      } else {
        setStatusText("Backend not reachable");
      }
    } finally {
      requestInFlightRef.current = false;
    }
  }, [apiBase, injuryType, onAnalysis, onHistoryUpdate]);

  const stopCamera = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (poseRef.current) {
      poseRef.current.close();
      poseRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraReady(false);
    postureOkRef.current = null;
    lastCorrectLandmarksRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true);
    setStatusText("Starting camera...");
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false,
      });

      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: Results) => {
        const videoEl = videoRef.current;
        const canvasEl = canvasRef.current;
        if (!videoEl || !canvasEl) {
          return;
        }

        const ctx = canvasEl.getContext("2d");
        if (!ctx) {
          return;
        }

        const width = videoEl.videoWidth || 1280;
        const height = videoEl.videoHeight || 720;
        canvasEl.width = width;
        canvasEl.height = height;

        ctx.save();
        ctx.clearRect(0, 0, width, height);

        if (results.poseLandmarks) {
          const postureOk = postureOkRef.current;
          const isRehab = injuryType.endsWith("_rehab");
          const connectorColor = postureOk === true ? "#22c55e" : postureOk === false ? "#ef4444" : "#f59e0b";
          const landmarkColor = postureOk === true ? "#86efac" : postureOk === false ? "#fca5a5" : "#84cc16";
          const isVisibleAndInFrame = (index: number) => {
            const lm = results.poseLandmarks?.[index];
            if (!lm) {
              return false;
            }
            const visibility = lm.visibility ?? 1;
            return visibility >= VISIBILITY_THRESHOLD && lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1;
          };

          const filteredConnections = BODY_POSE_CONNECTIONS.filter(
            ([start, end]) => isVisibleAndInFrame(start) && isVisibleAndInFrame(end),
          );
          const filteredBodyLandmarks = results.poseLandmarks.filter(
            (_, index) => BODY_LANDMARK_INDEX_SET.has(index) && isVisibleAndInFrame(index),
          );
          const coreVisible = CORE_LANDMARK_INDICES.every((index) => isVisibleAndInFrame(index));
          const hasStableSkeleton = coreVisible && filteredConnections.length >= 4;

          if (hasStableSkeleton) {
            drawConnectors(ctx, results.poseLandmarks, filteredConnections, {
              color: connectorColor,
              lineWidth: 3,
            });
            drawLandmarks(ctx, filteredBodyLandmarks, {
              color: landmarkColor,
              lineWidth: 1,
              radius: 3,
            });

            drawJointAngle(
              ctx,
              results.poseLandmarks,
              LANDMARK_INDEX.left_shoulder,
              LANDMARK_INDEX.left_elbow,
              LANDMARK_INDEX.left_wrist,
              width,
              height,
            );
            drawJointAngle(
              ctx,
              results.poseLandmarks,
              LANDMARK_INDEX.right_shoulder,
              LANDMARK_INDEX.right_elbow,
              LANDMARK_INDEX.right_wrist,
              width,
              height,
            );
            drawJointAngle(
              ctx,
              results.poseLandmarks,
              LANDMARK_INDEX.left_hip,
              LANDMARK_INDEX.left_knee,
              LANDMARK_INDEX.left_foot,
              width,
              height,
            );
            drawJointAngle(
              ctx,
              results.poseLandmarks,
              LANDMARK_INDEX.right_hip,
              LANDMARK_INDEX.right_knee,
              LANDMARK_INDEX.right_foot,
              width,
              height,
            );
          }

          if (postureOk === true) {
            lastCorrectLandmarksRef.current = results.poseLandmarks.map((lm) => ({
              x: lm.x,
              y: lm.y,
              visibility: lm.visibility,
            }));
          }

          if (isRehab && postureOk === false && hasStableSkeleton && lastCorrectLandmarksRef.current) {
            const refLandmarks = lastCorrectLandmarksRef.current;
            for (const [start, end] of BODY_POSE_CONNECTIONS) {
              const a = refLandmarks[start];
              const b = refLandmarks[end];
              if (!a || !b) {
                continue;
              }
              if (a.x < 0 || a.x > 1 || a.y < 0 || a.y > 1 || b.x < 0 || b.x > 1 || b.y < 0 || b.y > 1) {
                continue;
              }
              drawDottedLine(ctx, a.x * width, a.y * height, b.x * width, b.y * height, "#facc15", 9);
            }
          }

          frameCounterRef.current += 1;
          if (frameCounterRef.current % SEND_EVERY_NTH_FRAME === 0) {
            const payload = buildPayload(results, injuryType);
            if (payload) {
              void postForAnalysis(payload);
            }
          }
        }

        ctx.restore();
      });

      poseRef.current = pose;
      setCameraReady(true);
      setStatusText("Live feed running");

      const processFrame = async () => {
        if (!poseRef.current || !videoRef.current) {
          return;
        }

        try {
          await poseRef.current.send({ image: videoRef.current });
        } catch {
          setStatusText("Camera processing interrupted");
          return;
        }

        animationRef.current = requestAnimationFrame(() => {
          void processFrame();
        });
      };

      animationRef.current = requestAnimationFrame(() => {
        void processFrame();
      });
    } catch {
      setStatusText("Camera permission denied or unavailable");
    } finally {
      setIsStartingCamera(false);
    }
  }, [injuryType, postForAnalysis, stopCamera]);

  useEffect(() => {
    onHistoryUpdate(loadSessions().filter((entry) => entry.exercise === injuryType));
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [injuryType, onHistoryUpdate, startCamera, stopCamera]);

  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Live Camera Feed</h3>
      <p className="mt-2 text-xs text-slate-300">Skeleton overlay and real-time keypoint capture</p>

      <div className="relative mt-4 min-h-[420px] overflow-hidden rounded-2xl border border-slate-500/70 bg-slate-950/60 lg:min-h-[620px]">
        <video ref={videoRef} muted playsInline className="h-full w-full object-fill" />
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />

        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 px-6">
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={isStartingCamera}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera size={15} /> {isStartingCamera ? "Starting..." : "Start / Retry Camera"}
            </button>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-300">Status: {statusText}</p>
    </section>
  );
}
