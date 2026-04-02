"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Radio, RefreshCw } from "lucide-react";

type LiveCameraFeedProps = {
  label: string;
};

export default function LiveCameraFeed({ label }: LiveCameraFeedProps) {
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_CAMERA_API_BASE ?? "http://127.0.0.1:8000", []);
  const streamUrl = useMemo(() => process.env.NEXT_PUBLIC_CAMERA_STREAM_URL ?? `${apiBase}/camera/feed`, [apiBase]);

  const [isHealthy, setIsHealthy] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [statusText, setStatusText] = useState("Checking camera service...");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isStoppingCalibration, setIsStoppingCalibration] = useState(false);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/camera/health`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("health-check-failed");
      }

      const data = (await res.json()) as {
        camera_open: boolean;
        calibrated: boolean;
        feedback?: string[];
      };
      setIsHealthy(Boolean(data.camera_open));
      setIsCalibrated(Boolean(data.calibrated));

      if (!data.camera_open) {
        setStatusText("Camera unavailable. Check webcam permissions and backend process.");
        return;
      }

      if (data.feedback?.length) {
        setStatusText(data.feedback[0]);
      } else {
        setStatusText(data.calibrated ? "Streaming posture analysis" : "Press calibrate when in ideal posture");
      }
    } catch {
      setIsHealthy(false);
      setStatusText("Cannot reach camera API. Start python camera_api.py");
    }
  }, [apiBase]);

  useEffect(() => {
    void checkHealth();
    const timer = window.setInterval(() => {
      void checkHealth();
    }, 3000);

    return () => window.clearInterval(timer);
  }, [checkHealth]);

  async function handleCalibrate() {
    try {
      setIsCalibrating(true);
      const res = await fetch(`${apiBase}/camera/calibrate`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setStatusText(data.message ?? "Calibration request sent.");
      await checkHealth();
    } catch {
      setStatusText("Calibration failed. Ensure backend is running and body is in frame.");
    } finally {
      setIsCalibrating(false);
    }
  }

  async function handleStopCalibration() {
    try {
      setIsStoppingCalibration(true);
      const res = await fetch(`${apiBase}/camera/calibration/stop`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      setStatusText(data.message ?? "Calibration cleared.");
      await checkHealth();
    } catch {
      setStatusText("Stop calibration failed. Ensure backend is running.");
    } finally {
      setIsStoppingCalibration(false);
    }
  }

  return (
    <section className="glass-card relative min-h-[320px] overflow-hidden rounded-2xl p-5 md:min-h-[520px]">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400/15 via-transparent to-lime-400/10" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <p className="font-[var(--font-sora)] text-sm font-semibold text-slate-100">{label}</p>
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/30 bg-rose-400/20 px-3 py-1 text-xs text-rose-100">
            <Radio size={12} /> LIVE
          </span>
        </div>
        <div className="mt-4 flex flex-1 flex-col gap-4">
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-slate-500/60 bg-slate-950/50">
            {isHealthy ? (
              <img src={streamUrl} alt="Live posture camera feed" className="h-full w-full object-cover" />
            ) : (
              <div className="px-8 py-10 text-center">
                <Camera size={34} className="mx-auto text-amber-300" />
                <p className="mt-4 text-sm text-slate-300">Camera stream unavailable</p>
                <p className="mt-1 text-xs text-slate-400">Start backend with: python camera_api.py</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-500/60 bg-slate-900/70 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-slate-300">{statusText}</p>
              <p className="mt-1 text-[11px] text-slate-400">Calibration: {isCalibrated ? "Ready" : "Not set"}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void handleStopCalibration()}
                disabled={!isHealthy || !isCalibrated || isStoppingCalibration}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-300/40 bg-rose-400/15 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={12} className={isStoppingCalibration ? "animate-spin" : ""} />
                {isStoppingCalibration ? "Stopping..." : "Stop Calibration"}
              </button>
              <button
                type="button"
                onClick={() => void handleCalibrate()}
                disabled={!isHealthy || isCalibrating}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-400/20 px-3 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={12} className={isCalibrating ? "animate-spin" : ""} />
                {isCalibrating ? "Calibrating..." : "Calibrate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
