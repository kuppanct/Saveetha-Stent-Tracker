"use client";

import { useState, useEffect, useCallback } from "react";
import { Stent, CallOutcome, CallLog } from "@/lib/types";
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
  Edit3,
  RotateCcw,
  CheckCircle,
  Clock3
} from "lucide-react";
import MessagePreviewModal from "@/components/MessagePreviewModal";
import RemovalModal from "@/components/RemovalModal";
import ExchangeModal from "@/components/ExchangeModal";
import EditStentModal from "@/components/EditStentModal";
import { format, parseISO } from "date-fns";

const OUTCOMES: CallOutcome[] = [
  "Promised to come",
  "Scheduled for OPD",
  "Patient not answering",
  "Number Invalid / Switched Off",
  "Family Notified",
  "Refused - High Risk",
  "Other",
];

export default function TechnicianQueue() {
  const [stents, setStents] = useState<Stent[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"PENDING" | "CONTACTED" | "ALL">("PENDING");
  const [outcomeState, setOutcomeState] = useState<Record<string, { outcome: CallOutcome; notes: string; saving?: boolean; success?: boolean }>>({});
  const [manuallyRequeued, setManuallyRequeued] = useState<Record<string, boolean>>({});
  
  // Modals
  const [selectedStent, setSelectedStent] = useState<Stent | null>(null);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      const [stentsRes, logsRes] = await Promise.all([
        fetch("/api/stents?status=Active"),
        fetch("/api/call-logs"),
      ]);

      if (stentsRes.ok) {
        const data: Stent[] = await stentsRes.json();
        // Filter for Due Today (days_remaining === 0) or Overdue (days_remaining < 0)
        const dueOrOverdue = data.filter(
          (s) => (s.days_remaining !== undefined ? s.days_remaining : 0) <= 0
        );
        setStents(dueOrOverdue);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setCallLogs(Array.isArray(logsData) ? logsData : []);
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

  // Determine if a stent has been contacted within the last 24 hours
  const getCallStatus = (stentId: string) => {
    if (manuallyRequeued[stentId]) return { contactedToday: false, latestLog: null };

    const stentLogs = callLogs.filter((c) => c.stent_id === stentId);
    if (!stentLogs.length) return { contactedToday: false, latestLog: null };

    const latest = stentLogs.sort(
      (a, b) => new Date(b.call_timestamp || b.created_at || 0).getTime() - new Date(a.call_timestamp || a.created_at || 0).getTime()
    )[0];

    const callTime = new Date(latest.call_timestamp || latest.created_at || 0).getTime();
    const now = new Date().getTime();
    const hoursSinceCall = (now - callTime) / (1000 * 60 * 60);

    // If called within the last 24 hours, move to contacted list
    if (hoursSinceCall < 24) {
      return { contactedToday: true, latestLog: latest, hoursSinceCall };
    }

    return { contactedToday: false, latestLog: latest, hoursSinceCall };
  };

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

  const handleRequeue = (stentId: string) => {
    setManuallyRequeued((prev) => ({ ...prev, [stentId]: true }));
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
        // Reset manual requeue state so it is considered contacted
        setManuallyRequeued((prev) => ({ ...prev, [stent.id]: false }));
        setOutcomeState((prev) => ({
          ...prev,
          [stent.id]: { outcome: "Promised to come", notes: "", saving: false, success: true },
        }));
        await fetchQueue();
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
      s.laterality.toLowerCase().includes(q) ||
      s.unit.toLowerCase().includes(q)
    );
  });

  const pendingStents = filteredStents.filter((s) => !getCallStatus(s.id).contactedToday);
  const contactedStents = filteredStents.filter((s) => getCallStatus(s.id).contactedToday);

  const displayList = 
    activeTab === "PENDING" ? pendingStents :
    activeTab === "CONTACTED" ? contactedStents :
    filteredStents;

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
              Call Alert & Outreach Queue
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Prioritized call list of Due & Overdue DJ Stent patients with automatic follow-up separation and recall reminders.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Action Queue</p>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400">{pendingStents.length} Pending</p>
          </div>
          <button
            onClick={fetchQueue}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Workflow Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === "PENDING"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 Pending Calls ({pendingStents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CONTACTED")}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 ${
              activeTab === "CONTACTED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>✅ Contacted & In Follow-up ({contactedStents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            All Due/Overdue ({filteredStents.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by UHID, patient name, phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Queue Cards / Rows */}
      {loading ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f293d] p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading Outreach Queue...</p>
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f293d] p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            {activeTab === "PENDING" ? "All Pending Calls Completed for Today!" : "No Patients in this Section"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {activeTab === "PENDING" 
              ? "All due & overdue stent patients have been contacted. Check the 'Contacted & In Follow-up' tab to review patient responses."
              : "No patients currently found under this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayList.map((stent) => {
            const p = stent.patient;
            const badge = stent.urgency_badge;
            const state = outcomeState[stent.id] || { outcome: "Promised to come", notes: "" };
            const isLeft = stent.laterality === "Left";
            const isRight = stent.laterality === "Right";
            const callStatus = getCallStatus(stent.id);
            const isContacted = callStatus.contactedToday;

            return (
              <div
                key={stent.id}
                className={`bg-white dark:bg-[#111827] rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  isContacted
                    ? "border-emerald-200 bg-emerald-50/10 dark:border-emerald-900/40"
                    : stent.urgency_level === "SEVERELY_OVERDUE"
                    ? "border-rose-300 bg-rose-50/20 dark:border-rose-900/40"
                    : "border-amber-300 bg-amber-50/20 dark:border-amber-900/40"
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  
                  {/* Left Column: Patient & Side Specific Details */}
                  <div className="lg:col-span-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-base">{p?.name}</span>
                      {stent.has_other_side_active && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200 flex items-center space-x-0.5" title="Patient has dual stents">
                          <Layers className="w-3 h-3" />
                          <span>DUAL STENT</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                      UHID: <span className="font-bold text-slate-900 dark:text-slate-200">{p?.uhid}</span> • Unit: {stent.unit}
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
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Material: {stent.material}</span>
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

                  {/* Middle Column: Direct Outreach & Side Actions */}
                  <div className="lg:col-span-3 space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Direct Outreach
                    </span>

                    <a
                      href={`tel:${p?.phone}`}
                      className="w-full py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
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
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send {stent.laterality} WA / SMS</span>
                    </button>

                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        onClick={() => {
                          setSelectedStent(stent);
                          setIsExchangeModalOpen(true);
                        }}
                        className="flex-1 py-1.5 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg font-semibold transition"
                      >
                        Exchange
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStent(stent);
                          setIsRemoveModalOpen(true);
                        }}
                        className="flex-1 py-1.5 text-[11px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Right Column: In-line Call Outcome Logger or Contacted Status */}
                  <div className="lg:col-span-5 space-y-2">
                    {isContacted && callStatus.latestLog ? (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Contacted & Follow-up Logged</span>
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full">
                            {callStatus.latestLog.outcome}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                          {callStatus.latestLog.notes || "Call completed."}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center space-x-1">
                            <Clock3 className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Called: {new Date(callStatus.latestLog.call_timestamp || callStatus.latestLog.created_at || "").toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRequeue(stent.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                            title="Re-open to Pending Calls Queue"
                          >
                            <RotateCcw className="w-3 h-3 text-slate-600" />
                            <span>Re-call Now</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Log Call Outcome (Moves to Follow-up)
                        </span>

                        <select
                          value={state.outcome}
                          onChange={(e) => handleOutcomeChange(stent.id, e.target.value as CallOutcome)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:bg-white"
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
                          placeholder={`Add remarks (e.g., patient coming this Wednesday for OPD removal)...`}
                          rows={2}
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white transition text-slate-800 dark:text-slate-200"
                        />

                        <div className="flex items-center justify-between pt-1">
                          {state.success ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 animate-fadeIn">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Moved to Follow-up!</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Save log after call</span>
                          )}

                          <button
                            onClick={() => handleSaveLog(stent)}
                            disabled={state.saving}
                            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-sm transition disabled:opacity-50"
                          >
                            {state.saving ? "Saving..." : "Save Outcome"}
                          </button>
                        </div>
                      </div>
                    )}
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