import type { AnalysisResult, HistoryStore } from "./types";

const STORAGE_KEY = "sports_biomechanics_sessions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadSessions(): AnalysisResult[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryStore;
    if (!parsed.sessions || !Array.isArray(parsed.sessions)) {
      return [];
    }
    return parsed.sessions;
  } catch {
    return [];
  }
}

export function saveSession(session: AnalysisResult): AnalysisResult[] {
  const existing = loadSessions();
  const next = [session, ...existing].slice(0, 50);

  if (isBrowser()) {
    const payload: HistoryStore = { sessions: next };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  return next;
}
