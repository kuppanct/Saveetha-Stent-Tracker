"use client";

import { useEffect, useState } from "react";
import { getOfflineQueue, syncOfflineQueue } from "@/lib/offline-sync";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);

  useEffect(() => {
    // Initial check
    setIsOnline(navigator.onLine);
    setPendingCount(getOfflineQueue().length);

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("StentSync PWA Service Worker Registered"))
        .catch((err) => console.log("SW Registration failed:", err));
    }

    const handleOnline = async () => {
      setIsOnline(true);
      await triggerAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e: any) => {
      setPendingCount(e.detail?.count ?? getOfflineQueue().length);
    };

    const handleVisibility = async () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        await triggerAutoSync();
      }
    };

    const handleSwMessage = async (event: MessageEvent) => {
      if (event.data?.type === "TRIGGER_OFFLINE_SYNC") {
        await triggerAutoSync();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("stentsync:offline-queue-changed", handleQueueChange);
    document.addEventListener("visibilitychange", handleVisibility);
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    // If online on mount and pending items exist, sync them
    if (navigator.onLine && getOfflineQueue().length > 0) {
      triggerAutoSync();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("stentsync:offline-queue-changed", handleQueueChange);
      document.removeEventListener("visibilitychange", handleVisibility);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, []);

  const triggerAutoSync = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    try {
      const { synced } = await syncOfflineQueue();
      if (synced > 0) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      }
    } finally {
      setSyncing(false);
      setPendingCount(getOfflineQueue().length);
    }
  };

  // If online and no pending items and not just synced, hide banner
  if (isOnline && pendingCount === 0 && !justSynced) {
    return null;
  }

  return (
    <div className="sticky top-16 z-30 px-3 sm:px-6 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-b border-indigo-500/30 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-2">
          {!isOnline ? (
            <span className="flex items-center space-x-1.5 bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
              <WifiOff className="w-3.5 h-3.5" />
              <span>OT Offline Mode Active</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              <Wifi className="w-3.5 h-3.5" />
              <span>Connected to Cloud</span>
            </span>
          )}

          {pendingCount > 0 && (
            <span className="font-semibold text-slate-300">
              ⚡ <strong>{pendingCount} Stent{pendingCount > 1 ? "s" : ""}</strong> saved locally in phone storage
            </span>
          )}

          {justSynced && (
            <span className="flex items-center space-x-1 text-emerald-300 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Offline OT stents successfully synced to Saveetha Cloud!</span>
            </span>
          )}
        </div>

        {isOnline && pendingCount > 0 && (
          <button
            onClick={triggerAutoSync}
            disabled={syncing}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Syncing..." : "Sync Now"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
