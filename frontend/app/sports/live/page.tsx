"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, ChevronLeft } from "lucide-react";
import { Pose, POSE_CONNECTIONS, type Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import PostureErrorsPanel from "@/components/PostureErrorsPanel";
import { loadSessions, saveSession } from "@/lib/biomechanics/storage";
import type { AnalysisResult, RuleOutcome } from "@/lib/biomechanics/types";
import MetricRow from "@/components/MetricRow";
import ProgressBar from "@/components/ProgressBar";
import StatusBadge from "@/components/StatusBadge";

type PosePoint = {
  x: number;
  y: number;
};

type Landmark2D = {
  x: number;
  y: number;
  visibility?: number;
};

type AnalyzePayload = {
  keypoints: Record<string, PosePoint>;
};

type AnalyzeResponse = {
  timestamp: string;
  posture_ok: boolean;
  errors: RuleOutcome[];
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
const BODY_POSE_CONNECTIONS = POSE_CONNECTIONS.filter(
  ([start, end]) => BODY_LANDMARK_INDEX_SET.has(start) && BODY_LANDMARK_INDEX_SET.has(end),
);
const VISIBILITY_THRESHOLD = 0.3;

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

function drawSkeletonOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark2D[],
  width: number,
  height: number,
) {
  const isVisibleAndInFrame = (index: number) => {
    const lm = landmarks[index];
    if (!lm) {
      return false;
    }
    const visibility = lm.visibility ?? 1;
    return visibility >= VISIBILITY_THRESHOLD && lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1;
  };

  const filteredConnections = BODY_POSE_CONNECTIONS.filter(
    ([start, end]) => isVisibleAndInFrame(start) && isVisibleAndInFrame(end),
  );
  const filteredBodyLandmarks = landmarks.filter(
    (_, index) => BODY_LANDMARK_INDEX_SET.has(index) && isVisibleAndInFrame(index),
  );

  drawConnectors(ctx, landmarks, filteredConnections, {
    color: "#f59e0b",
    lineWidth: 3,
  });
  drawLandmarks(ctx, filteredBodyLandmarks, {
    color: "#84cc16",
    lineWidth: 1,
    radius: 3,
  });
}

function buildPayload(results: Results): AnalyzePayload | null {
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

  const keypoints: Record<string, PosePoint> = {
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
  };

  return { keypoints };
}

export default function SportsLivePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const frameCounterRef = useRef(0);
  const firstDetectionSeenRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  const [latestResult, setLatestResult] = useState<AnalyzeResponse | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [statusText, setStatusText] = useState("Starting camera...");
  const [cameraReady, setCameraReady] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraErrorHint, setCameraErrorHint] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(false);

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
      setLatestResult(data);

      setStatusText(data.posture_ok ? "Correct posture" : "Error detected");

      const session: AnalysisResult = {
        timestamp: data.timestamp,
        exercise: "cricket_bowling",
        errors: data.errors,
      };
      const next = saveSession(session);
      setHistory(next);
    } catch (error) {
      const message = String(error);
      if (message.includes("analysis-request-failed:")) {
        const match = message.match(/analysis-request-failed:(\d+)/);
        const status = match?.[1] ?? "unknown";
        setStatusText(`Backend response error (${status})`);
      } else {
        setStatusText("Backend not reachable. Start sports_api.py");
      }
    } finally {
      requestInFlightRef.current = false;
    }
  }, [apiBase]);

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
    firstDetectionSeenRef.current = false;
  }, []);

  const startCamera = useCallback(async () => {
    setIsStartingCamera(true);
    setCameraErrorHint(null);
    setStatusText("Starting camera...");

    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      if (!videoRef.current || !canvasRef.current) {
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.autoplay = true;
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
          if (!firstDetectionSeenRef.current) {
            firstDetectionSeenRef.current = true;
            setStatusText("Tracking landmarks live");
          }

          drawSkeletonOverlay(ctx, results.poseLandmarks, width, height);

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

          frameCounterRef.current += 1;
          if (frameCounterRef.current % SEND_EVERY_NTH_FRAME === 0) {
            const payload = buildPayload(results);
            if (payload) {
              void postForAnalysis(payload);
            }
          }
        } else if (firstDetectionSeenRef.current) {
          setStatusText("No body detected. Step back and keep full body in frame");
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
    } catch (error) {
      const err = error as DOMException;
      setCameraReady(false);
      setStatusText("Camera unavailable");

      if (err.name === "NotAllowedError") {
        setCameraErrorHint("Camera permission was blocked. Allow camera access in browser site settings and retry.");
      } else if (err.name === "NotReadableError") {
        setCameraErrorHint("Camera is busy in another app/process. Stop other camera apps (including python camera_api.py) and retry.");
      } else {
        setCameraErrorHint("Unable to access camera device. Check browser permission and webcam connection.");
      }
    } finally {
      setIsStartingCamera(false);
    }
  }, [postForAnalysis, stopCamera]);

  useEffect(() => {
    setHistory(loadSessions());
  }, []);

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const currentErrors = latestResult?.errors ?? [];
  const postureScore = Math.max(44, 100 - currentErrors.length * 11);

  const findErrorByText = (keyword: string) => {
    const lower = keyword.toLowerCase();
    return currentErrors.find(
      (entry) => entry.rule.toLowerCase().includes(lower) || entry.message.toLowerCase().includes(lower),
    );
  };

  const elbowIssue = findErrorByText("elbow");
  const kneeIssue = findErrorByText("knee");
  const armIssue = findErrorByText("arm");
  const hasLateralTilt = currentErrors.some((error) => {
    const text = `${error.rule} ${error.message}`.toLowerCase();
    return text.includes("lateral flexion") || text.includes("side bend") || text.includes("tilt");
  });
  const riskPercent = hasLateralTilt ? 88 : Math.max(8, Math.min(30, Math.round(22 - (postureScore - 80) * 0.6)));
  const riskLabel = riskPercent >= 70 ? "High" : riskPercent >= 40 ? "Medium" : "Low";
  const riskStatus = riskLabel === "High" ? "error" : riskLabel === "Medium" ? "warning" : "correct";

  return (
    <main className="dashboard-shell min-h-screen px-4 py-6 sm:px-6 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/sports" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-blue-200">
          <ChevronLeft size={16} /> Back
        </Link>

        <h1 className="mt-4 font-[var(--font-sora)] text-3xl font-bold text-slate-100">Cricket Performance Console</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">Live biomechanical scoring with posture diagnostics and session risk tracking.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_0.7fr]">
          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Live Video Feed</h2>
            <p className="mt-2 text-xs text-slate-300">Camera starts automatically after opening this page.</p>

            <div className="relative mt-4 min-h-[420px] overflow-hidden rounded-2xl border border-slate-500/70 bg-slate-950/60 lg:min-h-[620px]">
              <div className={`absolute inset-0 ${isMirrored ? "-scale-x-100" : "scale-x-100"}`}>
                <video ref={videoRef} muted playsInline className="h-full w-full object-fill" />
                <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />
              </div>
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

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMirrored((prev) => !prev)}
                className="rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/20"
              >
                {isMirrored ? "Unmirror Feed" : "Mirror Feed"}
              </button>
              <span className="text-xs text-slate-400">Display mode: {isMirrored ? "Mirrored" : "Normal"}</span>
            </div>

            <p className="mt-3 text-xs text-slate-300">Status: {statusText}</p>
            {cameraErrorHint && <p className="mt-1 text-xs text-rose-200">{cameraErrorHint}</p>}
          </section>

          <section className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Performance Panel</h2>
              <StatusBadge
                status={latestResult ? (currentErrors.length > 0 ? "warning" : "correct") : "info"}
                text={latestResult ? (currentErrors.length > 0 ? "Adjustments Needed" : "Optimal Form") : "Analyzing"}
              />
            </div>

            <div className="mt-4 space-y-3">
              <MetricRow label="Posture Score" value={`${postureScore}%`} status={postureScore >= 80 ? "correct" : "warning"} />
              <MetricRow
                label="Elbow Angle"
                value={elbowIssue ? "Out of range" : "Stable"}
                status={elbowIssue ? "warning" : "correct"}
                helper={elbowIssue?.expected ?? "Within expected range"}
              />
              <MetricRow
                label="Knee Alignment"
                value={kneeIssue ? "Deviation detected" : "Aligned"}
                status={kneeIssue ? "error" : "correct"}
                helper={kneeIssue?.message ?? "Knee axis stays stable"}
              />
              <MetricRow
                label="Arm Position"
                value={armIssue ? "Needs adjustment" : "On target"}
                status={armIssue ? "warning" : "correct"}
                helper={armIssue?.message ?? "Release arm path is clean"}
              />
            </div>

            <div className="mt-5 space-y-3">
              <ProgressBar label="Movement Efficiency" value={Math.max(40, postureScore - 6)} color="green" />
              <ProgressBar label="Injury Risk" value={riskPercent} color={riskLabel === "High" ? "red" : riskLabel === "Medium" ? "yellow" : "green"} />
            </div>

            <div className="mt-4">
              <MetricRow label="Injury Risk" value={riskLabel} status={riskStatus} />
            </div>

            <div className="mt-4">
              <PostureErrorsPanel
                title="Live Error Window"
                subtitle={latestResult ? "Latest analyzed frame window" : "Waiting for the first analysis result"}
                errors={currentErrors}
                emptyMessage="No posture errors in the latest analyzed frame."
              />
            </div>
          </section>
        </div>

        <section className="glass-card mt-6 rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-[var(--font-sora)] text-lg font-semibold text-slate-100">Recent Sessions</h2>
            <Link href="/sports/sessions" className="text-sm text-blue-200 transition hover:text-blue-100">
              Open full history
            </Link>
          </div>

          {history.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-700/70 bg-slate-900/45 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent Sessions</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {history.slice(0, 3).map((session) => (
                  <article key={session.timestamp} className="rounded-xl border border-slate-700/80 bg-slate-950/45 p-3 text-sm">
                    <p className="font-semibold text-slate-100">{session.exercise}</p>
                    <p className="mt-1 text-xs text-slate-300">{new Date(session.timestamp).toLocaleString()}</p>
                    <p className="mt-2 text-xs text-slate-300">{session.errors.length} issue(s) captured</p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
