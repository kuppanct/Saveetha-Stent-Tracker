"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MessageSquare, 
  Smartphone, 
  RefreshCw, 
  Clock,
  Search,
  Calendar
} from "lucide-react";
import { NotificationLog } from "@/lib/types";

export default function WhatsAppCenterPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "WHATSAPP" | "SMS">("ALL");

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetch("/api/notification-logs?limit=100");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch notification logs:", e);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter((log) => {
    const isSms = (log.trigger_type || "").includes("SMS");
    if (channelFilter === "WHATSAPP" && isSms) return false;
    if (channelFilter === "SMS" && !isSms) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (log.patient_name || "").toLowerCase().includes(term) ||
      (log.recipient_phone || "").toLowerCase().includes(term) ||
      (log.trigger_type || "").toLowerCase().includes(term) ||
      (log.message_body || "").toLowerCase().includes(term)
    );
  });

  const totalWhatsApp = logs.filter((l) => !(l.trigger_type || "").includes("SMS")).length;
  const totalSms = logs.filter((l) => (l.trigger_type || "").includes("SMS")).length;

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
              Patient Outreach Center (WhatsApp & Regular SMS)
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-friction bilingual patient communication engine (English + Tamil / Hindi) with verified proof of contact.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={logsLoading}
          className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
          <span>Refresh Audit Records</span>
        </button>
      </div>

      {/* Active Channel Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Channel 1: WhatsApp */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">WhatsApp Web</h3>
            </div>
            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            1-tap direct launch from patient cards with pre-filled OPD days & Saveetha helpline.
          </p>
          <div className="pt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {totalWhatsApp} Messages Logged
          </div>
        </div>

        {/* Channel 2: Regular SMS */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
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
            Direct native SMS backup for non-WhatsApp patients or dispute prevention.
          </p>
          <div className="pt-1 text-xs font-bold text-sky-700 dark:text-sky-400">
            {totalSms} SMS Logged
          </div>
        </div>

        {/* Channel 3: OPD Schedule Integration */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Unit OPD Days</h3>
            </div>
            <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              INTEGRATED
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-slate-200">Unit 1</p>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold">Mon & Wed</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
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
                Outreach & Delivery Audit Trail ({filteredLogs.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Permanent time-stamped proof of patient communication via WhatsApp & Regular SMS
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
                All Channels
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("WHATSAPP")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  channelFilter === "WHATSAPP" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                💬 WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter("SMS")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  channelFilter === "SMS" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                📱 SMS
              </button>
            </div>
          </div>
        </div>

        {logsLoading && logs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Loading outreach audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
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
                  <th className="py-3 px-3">Milestone Stage</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3">Message Payload Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const isSms = (log.trigger_type || "").includes("SMS");
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {new Date(log.sent_at || log.sent_timestamp || "").toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isSms
                            ? "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                            : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        }`}>
                          {isSms ? "📱 Regular SMS" : "💬 WhatsApp"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {log.patient_name || "Patient"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.recipient_phone}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          {(log.trigger_type || "").replace("_WEB_DIRECT", "").replace("_SMS", "")}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "SENT" || log.delivery_status === "SENT"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {log.delivery_status || log.status || "SENT"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] max-w-sm truncate">
                        {log.message_body}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}