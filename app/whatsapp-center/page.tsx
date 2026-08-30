"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MessageSquare, 
  Smartphone, 
  RefreshCw, 
  Clock,
  Search,
  Calendar,
  PhoneCall,
  Phone
} from "lucide-react";
import { NotificationLog, CallLog } from "@/lib/types";

interface UnifiedOutreachItem {
  id: string;
  timestamp: string;
  channel: "WHATSAPP" | "SMS" | "CALL";
  patient_name: string;
  uhid: string;
  phone: string;
  trigger_or_outcome: string;
  status: string;
  details: string;
}

export default function WhatsAppCenterPage() {
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "WHATSAPP" | "SMS" | "CALL">("ALL");

  const fetchAllLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const [notifRes, callRes] = await Promise.all([
        fetch("/api/notification-logs?limit=100"),
        fetch("/api/call-logs"),
      ]);

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotificationLogs(Array.isArray(data) ? data : []);
      }
      if (callRes.ok) {
        const data = await callRes.json();
        setCallLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch communication logs:", e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllLogs();
    const interval = setInterval(() => {
      fetchAllLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchAllLogs]);

  // Combine both NotificationLogs and CallLogs into unified chronologically sorted timeline
  const unifiedItems: UnifiedOutreachItem[] = [
    ...notificationLogs.map((n) => {
      const isSms = (n.trigger_type || "").includes("SMS");
      return {
        id: `notif-${n.id}`,
        timestamp: n.sent_at || n.sent_timestamp || "",
        channel: isSms ? ("SMS" as const) : ("WHATSAPP" as const),
        patient_name: n.patient_name || "Patient",
        uhid: n.uhid || "",
        phone: n.recipient_phone,
        trigger_or_outcome: (n.trigger_type || "").replace("_WEB_DIRECT", "").replace("_SMS", ""),
        status: n.delivery_status || n.status || "SENT",
        details: n.message_body,
      };
    }),
    ...callLogs.map((c) => ({
      id: `call-${c.id}`,
      timestamp: c.call_timestamp || c.created_at || "",
      channel: "CALL" as const,
      patient_name: c.patient_name || (c as any).patient?.name || "Patient",
      uhid: c.uhid || (c as any).patient?.uhid || "",
      phone: (c as any).patient?.phone || "Hospital Outreach",
      trigger_or_outcome: c.outcome,
      status: "COMPLETED",
      details: c.notes || `Call logged by ${c.logged_by || "Technician"}`,
    })),
  ].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  const filteredItems = unifiedItems.filter((item) => {
    if (channelFilter !== "ALL" && item.channel !== channelFilter) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.patient_name.toLowerCase().includes(term) ||
      item.uhid.toLowerCase().includes(term) ||
      item.phone.includes(term) ||
      item.trigger_or_outcome.toLowerCase().includes(term) ||
      item.details.toLowerCase().includes(term)
    );
  });

  const totalWhatsApp = unifiedItems.filter((l) => l.channel === "WHATSAPP").length;
  const totalSms = unifiedItems.filter((l) => l.channel === "SMS").length;
  const totalCalls = unifiedItems.filter((l) => l.channel === "CALL").length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Patient Outreach Center (WhatsApp, SMS & Phone Calls)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Omni-channel patient outreach dashboard with bilingual messaging (English + Tamil / Hindi) and complete proof of contact audit.
          </p>
        </div>

        <button
          onClick={fetchAllLogs}
          disabled={logsLoading}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
          <span>Refresh All Logs</span>
        </button>
      </div>

      {/* Active Channel Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Channel 1: WhatsApp */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">WhatsApp</h3>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            1-tap direct launch with pre-filled OPD days & Saveetha helpline.
          </p>
          <div className="pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {totalWhatsApp} Messages Logged
          </div>
        </div>

        {/* Channel 2: Regular SMS */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <Smartphone className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Regular SMS</h3>
            </div>
            <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Native SMS backup for non-WhatsApp patients or dispute proof.
          </p>
          <div className="pt-1 text-xs font-bold text-sky-700 dark:text-sky-400">
            {totalSms} SMS Logged
          </div>
        </div>

        {/* Channel 3: Phone Calls */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <PhoneCall className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Phone Calls</h3>
            </div>
            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
              LOGGED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verifiable telephone outreach outcomes & patient commitments.
          </p>
          <div className="pt-1 text-xs font-bold text-purple-700 dark:text-purple-400">
            {totalCalls} Calls Logged
          </div>
        </div>

        {/* Channel 4: OPD Schedule Integration */}
        <div className="bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">OPD Schedule</h3>
            </div>
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              UNIT DAYS
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-slate-200">Unit 1</p>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Mon & Wed</p>
            </div>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-slate-200">Unit 2</p>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Tue & Thu</p>
            </div>
          </div>
        </div>

      </div>

      {/* Global Multi-Channel Outreach & Delivery Audit Log */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Channel Outreach & Delivery Audit Trail ({filteredItems.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permanent time-stamped proof of patient communication via WhatsApp, Regular SMS & Phone Calls
              </p>
            </div>
          </div>

          {/* Controls: Search & Channel Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by UHID, patient, phone..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setChannelFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  channelFilter === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                All ({unifiedItems.length})
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("WHATSAPP")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  channelFilter === "WHATSAPP" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                💬 WhatsApp ({totalWhatsApp})
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("SMS")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  channelFilter === "SMS" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                📱 SMS ({totalSms})
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("CALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  channelFilter === "CALL" ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                📞 Calls ({totalCalls})
              </button>
            </div>
          </div>
        </div>

        {logsLoading && unifiedItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Loading communication audit records...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No communication records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Patient / UHID</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Stage / Outcome</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3">Message / Call Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      {new Date(item.timestamp || "").toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.channel === "SMS"
                          ? "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                          : item.channel === "CALL"
                          ? "bg-purple-50 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                          : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      }`}>
                        {item.channel === "SMS" ? "📱 Regular SMS" : item.channel === "CALL" ? "📞 Phone Call" : "💬 WhatsApp"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {item.patient_name} {item.uhid ? `(${item.uhid})` : ""}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {item.phone}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.trigger_or_outcome}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === "SENT" || item.status === "COMPLETED"
                          ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] max-w-sm truncate">
                      {item.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}