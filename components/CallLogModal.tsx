"use client";

import { useState, useEffect } from "react";
import { Stent, CallOutcome, CallLog } from "@/lib/types";
import { Phone, X, CheckCircle2, Clock, User, AlertTriangle } from "lucide-react";

interface CallLogModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CALL_OUTCOMES: CallOutcome[] = [
  "Patient not answering",
  "Promised to come",
  "Refused - High Risk",
  "Scheduled for OPD",
  "Family Notified",
  "Number Invalid / Switched Off",
  "Other",
];

export default function CallLogModal({ stent, isOpen, onClose, onSuccess }: CallLogModalProps) {
  const [outcome, setOutcome] = useState<CallOutcome>("Promised to come");
  const [notes, setNotes] = useState("");
  const [loggedBy, setLoggedBy] = useState("Technician");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CallLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (isOpen && stent) {
      setHistoryLoading(true);
      fetch(`/api/call-logs?stentId=${stent.id}`)
        .then((res) => res.json())
        .then((data) => {
          setHistory(Array.isArray(data) ? data : []);
        })
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [isOpen, stent]);

  if (!isOpen || !stent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stent_id: stent.id,
          patient_id: stent.patient_id,
          outcome,
          notes,
          logged_by: loggedBy,
        }),
      });
      if (res.ok) {
        setNotes("");
        onSuccess();
        onClose();
      } else {
        alert("Failed to log call");
      }
    } catch (e) {
      alert("Error saving call outcome");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-400/30">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Log Technician Call Outcome</h3>
              <p className="text-xs text-slate-400">
                {stent.patient?.name} ({stent.patient?.uhid}) - {stent.laterality} Stent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Patient Quick Call Link */}
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">Patient Contact</span>
              <p className="text-lg font-bold text-slate-900">{stent.patient?.phone}</p>
              <p className="text-xs text-slate-600">Language: <span className="font-semibold">{stent.patient?.second_language}</span></p>
            </div>
            <a
              href={`tel:${stent.patient?.phone}`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            >
              <Phone className="w-4 h-4" />
              <span>Call Now</span>
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Call Outcome <span className="text-rose-500">*</span>
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              >
                {CALL_OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Call Notes / Remarks
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Patient informed they will visit Saveetha OPD this Thursday. Advised on hydration."
                rows={3}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Technician / Staff Name
              </label>
              <input
                type="text"
                value={loggedBy}
                onChange={(e) => setLoggedBy(e.target.value)}
                placeholder="e.g. Sister Revathi / Staff Rajesh"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
              >
                {loading ? "Saving Log..." : "Save Call Outcome"}
              </button>
            </div>
          </form>

          {/* Past Call History */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Previous Call Logs ({history.length})</span>
            </h4>

            {historyLoading ? (
              <p className="text-xs text-slate-500 italic">Loading previous call records...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No calls logged yet for this stent.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {history.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-sky-800 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950 px-2 py-0.5 rounded font-bold">{log.outcome}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(log.call_timestamp || log.created_at || "").toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>
                    {log.notes && <p className="text-slate-700 dark:text-slate-300 mt-1">{log.notes}</p>}
                    <p className="text-[11px] text-slate-400">By: {log.logged_by || "Staff"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}