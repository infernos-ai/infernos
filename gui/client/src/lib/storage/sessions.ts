export interface StoredSession {
  id: string;
  status: "active" | "exhausted" | "expired";
  model: string;
  capability: string;
  budget_sats: number;
  remaining_sats: number;
  macaroon: string;
  preimage?: string;
  invoice?: string;
  created_at: string;
  requests_count: number;
}

const STORAGE_KEY = "infernos_sessions_v1";

export function getStoredSessions(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to load stored sessions", e);
    return [];
  }
}

export function saveStoredSession(session: StoredSession): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save session", e);
  }
}

export function updateStoredSessionBudget(
  id: string,
  remainingSats: number,
  incrementRequests = true
): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredSessions();
    const session = sessions.find((s) => s.id === id);
    if (session) {
      session.remaining_sats = remainingSats;
      if (incrementRequests) {
        session.requests_count = (session.requests_count || 0) + 1;
      }
      if (remainingSats <= 0) {
        session.status = "exhausted";
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  } catch (e) {
    console.error("Failed to update session budget", e);
  }
}

export function deleteStoredSession(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to delete session", e);
  }
}
