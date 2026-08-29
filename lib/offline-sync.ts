import { StentRegistrationInput } from "./types";

const STORAGE_KEY = "stentsync_offline_outbox";

export interface OfflineStentEntry {
  id: string;
  data: StentRegistrationInput;
  timestamp: string;
  retryCount: number;
}

/**
 * Get all queued offline stent records from local device storage
 */
export function getOfflineQueue(): OfflineStentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read offline queue:", e);
    return [];
  }
}

/**
 * Queue a new stent record locally in device storage (for OT offline use)
 */
export function queueOfflineStent(data: StentRegistrationInput): OfflineStentEntry {
  const queue = getOfflineQueue();
  const entry: OfflineStentEntry = {
    id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyQueueChange(queue.length);
  } catch (e) {
    console.error("Failed to save to offline storage:", e);
  }
  return entry;
}

/**
 * Remove an entry after successful cloud sync
 */
export function removeOfflineEntry(id: string) {
  const queue = getOfflineQueue().filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    notifyQueueChange(queue.length);
  } catch (e) {}
}

/**
 * Trigger cloud synchronization of all queued offline records to Supabase
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const entry of queue) {
    try {
      const res = await fetch("/api/stents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.data),
      });

      if (res.ok) {
        removeOfflineEntry(entry.id);
        synced++;
      } else {
        entry.retryCount++;
        failed++;
      }
    } catch (err) {
      failed++;
      break; // Still offline or connection dropped
    }
  }

  return { synced, failed };
}

function notifyQueueChange(count: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("stentsync:offline-queue-changed", { detail: { count } }));
  }
}
