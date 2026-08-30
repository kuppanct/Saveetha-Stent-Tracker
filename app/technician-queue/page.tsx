"use client";

import { useState, useEffect, useCallback } from "react";
import { Stent, CallOutcome } from "@/lib/types";
import { 
  PhoneCall, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Phone, 
  Calendar,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Edit3
} from "lucide-react";
import MessagePreviewModal from "@/components/MessagePreviewModal";
import RemovalModal from "@/components/RemovalModal";
import ExchangeModal from "@/components/ExchangeModal";
import EditStentModal from "@/components/EditStentModal";
import { format, parseISO } from "date-fns";

const OUTCOMES: CallOutcome[] = [
  "Patient not answering",
  "Promised to come",
  "Refused - High Risk",
  "Scheduled for OPD",
  "Family Notified",
  "Number Invalid / Switched Off",
  "Other",
];

export default function TechnicianQueue() {
  const [stents, setStents] = useState<Stent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [outcomeState, setOutcomeState] = useState<Record<string, { outcome: CallOutcome; notes: string; saving?: boolean; success?: boolean }>>({});
  
  // Modals
  const [selectedStent, setSelectedStent] = useState<Stent | null>(null);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stents?status=Active");
      if (res.ok) {
        const data: Stent[] = await res.json();
        // Filter for Due Today (days_remaining === 0) or Overdue (days_remaining < 0)
        const dueOrOverdue = data.filter(
          (s) => (s.days_remaining !== undefined ? s.days_remaining : 0) <= 0
        );
        setStents(dueOrOverdue);
      }
    } catch (e) {
      console.error("Failed to load technician queue:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleOutcomeChange = (stentId: string, outcome: CallOutcome) => {
    setOutcomeState((prev) => ({
      ...prev,
      [stentId]: { ...prev[stentId], outcome, notes: prev[stentId]?.notes || "" },
    }));
  };

  const handleNotesChange = (stentId: string, notes: string) => {
    setOutcomeState((prev) => ({
      ...prev,
      [stentId]: { ...prev[stentId], outcome: prev[stentId]?.outcome || "Promised to come", notes },
    }));
  };

  const handleSaveLog = async (stent: Stent) => {
    const current = outcomeState[stent.id] || { outcome: "Promised to come", notes: "" };
    setOutcomeState((prev) => ({
      ...prev,
      [stent.id]: { ...prev[stent.id], saving: true },
    }));

    try {
      const res = await fetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stent_id: stent.id,
          patient_id: stent.patient_id,
          outcome: current.outcome,
          notes: `[${stent.laterality} Side Stent]: ${current.notes}`,
          logged_by: "Technician Call Queue",
        }),
      });

      if (res.ok) {
        setOutcomeState((prev) => ({
          ...prev,
          [stent.id]: { outcome: "Promised to come", notes: "", saving: false, success: true },
        }));
        setTimeout(() => {
          setOutcomeState((prev) => ({
            ...prev,
            [stent.id]: { ...prev[stent.id], success: false },
          }));
        }, 3000);
      } else {
        alert("Failed to save call outcome");
        setOutcomeState((prev) => ({
          ...prev,
          [stent.id]: { ...prev[stent.id], saving: false },
        }));
      }
    } catch {
      alert("Error saving log");
      setOutcomeState((prev) => ({
        ...prev,
        [stent.id]: { ...prev[stent.id], saving: false },
      }));
    }
  };

  const filteredStents = stents.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.patient?.name.toLowerCase().includes(q) ||
      s.patient?.uhid.toLowerCase().includes(q) ||
      s.patient?.phone.includes(q) ||
      s.laterality.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
              <PhoneCall className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Call Alert Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized call list of Due & Overdue DJ Stent patients. Track and remove Left and Right stents independently.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Pending Follow-ups</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400">{stents.length} Stents</p>
          </div>
          <button
            onClick={fetchQueue}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
            title="Refresh Queue"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter queue by UHID, Patient Name, Phone, or Side (Left/Right)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Queue Cards / Rows */}
      {loading ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f293d] p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading Call Alert Queue...</p>
        </div>
      ) : filteredStents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Queue is Clear!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No active stent patients are currently due or overdue. All follow-ups are on schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStents.map((stent) => {
            const p = stent.patient;
            const badge = stent.urgency_badge;
            const state = outcomeState[stent.id] || { outcome: "Promised to come", notes: "" };
            const isLeft = stent.laterality === "Left";
            const isRight = stent.laterality === "Right";

            return (
              <div
                key={stent.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  stent.urgency_level === "SEVERELY_OVERDUE"
                    ? "border-rose-300 bg-rose-50/20"
                    : stent.urgency_level === "DUE_TODAY"
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-slate-200"
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left Column: Patient & Side Specific Details */}
                  <div className="lg:col-span-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-base">{p?.name}</span>
                      {stent.has_other_side_active && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200 flex items-center space-x-0.5" title="Patient has dual stents">
                          <Layers className="w-3 h-3" />
                          <span>DUAL STENT</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 font-mono">
                      UHID: <span className="font-bold text-slate-900">{p?.uhid}</span> • Unit: {stent.unit}
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          isLeft
                            ? "bg-sky-100 text-sky-800 border border-sky-300"
                            : isRight
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : "bg-purple-100 text-purple-800 border border-purple-300"
                        }`}
                      >
                        {stent.laterality} Kidney
                      </span>
                      <span className="font-semibold text-slate-700">Material: {stent.material}</span>
                      {stent.residual_stone && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          Stone
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex items-center space-x-3 pt-1">
                      <span>Inserted: <strong>{format(parseISO(stent.insertion_date), "dd/MM/yyyy")}</strong></span>
                      <span>Due: <strong className="text-rose-700">{format(parseISO(stent.planned_removal_date), "dd/MM/yyyy")}</strong></span>
                    </div>

                    <div className="flex items-center space-x-2 pt-0.5">
                      {badge && (
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.color} ${badge.border}`}>
                          {badge.label}
                        </span>
                      )}
                      <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium border border-sky-100">
                        {p?.second_language}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Direct Call & Action per Side */}
                  <div className="lg:col-span-3 space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Calling & Side Actions
                    </span>

                    <a
                      href={`tel:${p?.phone}`}
                      className="w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Dial: {p?.phone}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStent(stent);
                        setIsMsgModalOpen(true);
                      }}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Send {stent.laterality} WhatsApp / SMS</span>
                    </button>                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedStent(stent);
                          setIsEditModalOpen(true);
                        }}
                        className="flex-1 py-1.5 text-[11px] bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold transition flex items-center justify-center space-x-1"
                        title="Edit Stent Details"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStent(stent);
                          setIsExchangeModalOpen(true);
                        }}
                        className="flex-1 py-1.5 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold transition"
                      >
                        Exchange {stent.laterality}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStent(stent);
                          setIsRemoveModalOpen(true);
                        }}
                        className="flex-1 py-1.5 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition"
                      >
                        Remove {stent.laterality}
                      </button>
                    </div>
                  </div>

                  {/* Right Column: In-line Call Outcome Logger */}
                  <div className="lg:col-span-5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Log Call for {stent.laterality} Stent
                    </span>

                    <select
                      value={state.outcome}
                      onChange={(e) => handleOutcomeChange(stent.id, e.target.value as CallOutcome)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-500 focus:bg-white"
                    >
                      {OUTCOMES.map((out) => (
                        <option key={out} value={out}>
                          {out}
                        </option>
                      ))}
                    </select>

                    <textarea
                      value={state.notes}
                      onChange={(e) => handleNotesChange(stent.id, e.target.value)}
                      placeholder={`Add remarks for ${stent.laterality} stent (e.g., patient coming this Friday for removal)...`}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                    />

                    <div className="flex items-center justify-between pt-1">
                      {state.success ? (
                        <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 animate-fadeIn">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Call Logged!</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Save log after call</span>
                      )}

                      <button
                        onClick={() => handleSaveLog(stent)}
                        disabled={state.saving}
                        className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50"
                      >
                        {state.saving ? "Saving..." : "Submit Log"}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <MessagePreviewModal
        stent={selectedStent}
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
      />

      <RemovalModal
        stent={selectedStent}
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onSuccess={() => fetchQueue()}
      />

      <ExchangeModal
        stent={selectedStent}
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        onSuccess={() => fetchQueue()}
      />

      {selectedStent && (
        <EditStentModal
          stent={selectedStent}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => fetchQueue()}
        />
      )}
    </div>
  );
}