"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Smartphone, 
  Terminal, 
  Copy, 
  Check, 
  Calendar,
  User,
  Clock
} from "lucide-react";
import { SecondLanguage, Laterality, NotificationLog } from "@/lib/types";
import { buildBilingualMessage, TemplateType } from "@/lib/message-templates";

export default function WhatsAppCenterPage() {
  // WhatsApp Daemon Status
  const [waStatus, setWaStatus] = useState<{
    status: string;
    qrCodeDataUrl?: string | null;
    connectedPhone?: string | null;
    daemonRunning?: boolean;
    instructions?: string;
  }>({ status: "INITIALIZING", daemonRunning: false });

  const [loadingStatus, setLoadingStatus] = useState(true);

  // Template Sandbox State
  const [templateType, setTemplateType] = useState<TemplateType>("DUE_TODAY");
  const [language, setLanguage] = useState<SecondLanguage>("Tamil");
  const [unit, setUnit] = useState<"Unit 1" | "Unit 2">("Unit 1");
  const [patientName, setPatientName] = useState("Kavitha Murugan");
  const [laterality, setLaterality] = useState<Laterality>("Right");
  const [insertionDate, setInsertionDate] = useState("2026-05-30");
  const [dueDate, setDueDate] = useState("2026-08-28");
  const [testPhone, setTestPhone] = useState("9840123456");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Notification Logs
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch {
      setWaStatus({ status: "DISCONNECTED", daemonRunning: false });
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await fetch("/api/notification-logs?limit=50");
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
    fetchStatus();
    fetchLogs();
    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchLogs]);

  const { fullMessage, englishPart, regionalPart } = buildBilingualMessage(
    templateType,
    {
      patientName,
      laterality,
      insertionDate,
      dueDate,
      unit,
    },
    language
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTest = async () => {
    if (!testPhone) {
      alert("Please provide a recipient phone number");
      return;
    }
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: fullMessage,
          trigger_type: `TEST_${templateType}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult("✅ Test WhatsApp message dispatched successfully!");
      } else {
        setTestResult(`ℹ️ ${data.message || data.error}`);
      }
    } catch (e: any) {
      setTestResult("❌ Failed to reach WhatsApp daemon service");
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Patient Outreach Center (WhatsApp & Regular SMS)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Multi-channel patient outreach with bilingual messaging (English + Tamil / Hindi) and complete audit logging.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
          <span>Refresh Audit Logs</span>
        </button>
      </div>

      {/* Grid: Outreach Architecture & Template Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Active Outreach Channels & Operational Architecture (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Active Outreach Channels</span>
            </h3>

            {/* Channel 1: WhatsApp */}
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                  <span>💬 WhatsApp Web / App</span>
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                1-tap direct dispatch from technician/resident device. Pre-filled with Unit OPD days & Saveetha helpline.
              </p>
            </div>

            {/* Channel 2: SMS */}
            <div className="p-3.5 bg-sky-50/60 rounded-xl border border-sky-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-900 flex items-center space-x-1.5">
                  <span>📱 Regular SMS Messenger</span>
                </span>
                <span className="text-[10px] font-extrabold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                  READY
                </span>
              </div>
              <p className="text-[11px] text-sky-800">
                Native SMS backup for patients who do not use WhatsApp or claim message non-receipt.
              </p>
            </div>

            {/* Channel 3: Proof of Contact Audit */}
            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                  <span>🛡️ Legal & NABH Audit Trail</span>
                </span>
                <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  AUTO-LOGGED
                </span>
              </div>
              <p className="text-[11px] text-indigo-800">
                Every WhatsApp and SMS dispatch is recorded with timestamp, recipient UHID, phone, and payload.
              </p>
            </div>

            {/* Unit Schedule Quick Reference */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                OPD Schedule Integration
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800">Unit 1 (Prof. N. Muthulatha)</p>
                  <p className="text-indigo-600 font-semibold">Monday & Wednesday</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800">Unit 2 (Prof. M. Siva Sankar)</p>
                  <p className="text-indigo-600 font-semibold">Tuesday & Thursday</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Bilingual Template Generator & Live Variable Tester (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Bilingual Template Engine & Variable Sandbox</span>
              </h3>
            </div>

            {/* Template Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Template Stage
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { type: "PRE_EXPIRY", label: "1. Pre-Expiry (T-30/14)" },
                  { type: "DUE_TODAY", label: "2. Due Today (T-0)" },
                  { type: "OVERDUE", label: "3. Overdue Alert" },
                  { type: "REMOVED", label: "4. Removal Confirmed" },
                ].map((t) => (
                  <button
                    type="button"
                    key={t.type}
                    onClick={() => setTemplateType(t.type as TemplateType)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                      templateType === t.type
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Variable Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">[Patient Name]</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">[Laterality]</label>
                <select
                  value={laterality}
                  onChange={(e) => setLaterality(e.target.value as Laterality)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                >
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Bilateral">Bilateral</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Unit & OP Schedule</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setUnit("Unit 1")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                      unit === "Unit 1" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border"
                    }`}
                  >
                    Unit 1 (Mon/Wed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("Unit 2")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                      unit === "Unit 2" ? "bg-indigo-600 text-white" : "bg-white text-slate-700 border"
                    }`}
                  >
                    Unit 2 (Tue/Thu)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Second Language</label>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setLanguage("Tamil")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                      language === "Tamil" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border"
                    }`}
                  >
                    Tamil
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("Hindi")}
                    className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition ${
                      language === "Hindi" ? "bg-sky-600 text-white" : "bg-white text-slate-700 border"
                    }`}
                  >
                    Hindi
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">[Insertion Date]</label>
                <input
                  type="date"
                  value={insertionDate}
                  onChange={(e) => setInsertionDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">[Due Date]</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-rose-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Test Phone Number</label>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Rendered Live Payload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Live Bilingual Payload (English + {language})
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Payload"}</span>
                </button>
              </div>

              <div className="bg-emerald-50/60 border border-emerald-300 rounded-2xl p-4 text-xs font-mono text-slate-900 whitespace-pre-wrap leading-relaxed shadow-inner">
                {fullMessage}
              </div>
            </div>

            {testResult && (
              <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium">
                {testResult}
              </div>
            )}

            {/* Test Send Trigger */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <a
                href={`https://wa.me/91${testPhone.replace(/\D/g, "")}?text=${encodeURIComponent(fullMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Open in WhatsApp Web
              </a>

              <button
                type="button"
                onClick={handleSendTest}
                disabled={sendingTest}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className={`w-4 h-4 ${sendingTest ? "animate-spin" : ""}`} />
                <span>{sendingTest ? "Sending Test..." : `Dispatch Test to ${testPhone}`}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Outreach & Delivery Audit Log */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  WhatsApp Outreach & Audit Log
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time record of all automated milestones and manual patient alerts
                </p>
              </div>
            </div>
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
              <span>Refresh Log</span>
            </button>
          </div>

          {logsLoading && logs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-semibold">Loading notification audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs italic">
              No WhatsApp notifications recorded yet. Automated alerts will appear here as daily checks run.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Patient / UHID</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Milestone / Trigger</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Message Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {new Date(log.sent_at || log.sent_timestamp || "").toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        {log.patient_name || "Patient"}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.recipient_phone}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[11px] border border-emerald-200 dark:border-emerald-800">
                          {log.trigger_type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === "SENT" || log.delivery_status === "SENT"
                            ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {log.delivery_status || log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-mono text-[11px] max-w-xs truncate">
                        {log.message_body}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}