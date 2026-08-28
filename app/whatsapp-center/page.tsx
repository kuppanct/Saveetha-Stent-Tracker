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
      // fetch recent logs via local fallback or DB
      const res = await fetch("/api/cron/trigger");
      // Logs are also available
    } catch (e) {
      // quiet
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const { fullMessage, englishPart, regionalPart } = buildBilingualMessage(
    templateType,
    {
      patientName,
      laterality,
      insertionDate,
      dueDate,
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
              WhatsApp Messaging Gateway Control
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Zero-cost automated WhatsApp communication hub with bilingual engine (English + Tamil / Hindi).
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? "animate-spin" : ""}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Grid: WhatsApp Connection Manager & Template Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: WhatsApp Web Live Connection Status & QR Code (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Gateway Session Status</span>
              </h3>
              
              {waStatus.status === "READY" ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Client Connected</span>
                </span>
              ) : waStatus.status === "QR_READY" ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span>Scan QR Code</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
                  <span>Daemon Standby</span>
                </span>
              )}
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center flex flex-col items-center justify-center min-h-[260px]">
              {waStatus.status === "READY" ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">WhatsApp Gateway Active</h4>
                  <p className="text-xs text-slate-500">
                    Connected Number: <strong className="text-slate-800">+{waStatus.connectedPhone || "Hospital Device"}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    Automated reminders and technician triggers will dispatch directly from this phone.
                  </p>
                </div>
              ) : waStatus.qrCodeDataUrl ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={waStatus.qrCodeDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-48 h-48 mx-auto border-4 border-white rounded-xl shadow-md"
                  />
                  <p className="text-xs font-bold text-slate-800">
                    Scan with WhatsApp on Department Phone
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Open WhatsApp &gt; Linked Devices &gt; Link a Device
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Gateway Service Ready</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    To connect your hospital WhatsApp device for 100% free automated messaging, run the local daemon command:
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-xs text-left">
                    <code>npm run whatsapp-service</code>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Setup Instructions */}
            <div className="bg-sky-50 rounded-xl p-3.5 border border-sky-200 text-xs space-y-1.5 text-sky-900">
              <p className="font-bold flex items-center space-x-1.5">
                <Terminal className="w-4 h-4 text-sky-700" />
                <span>Zero-Cost WhatsApp Architecture</span>
              </p>
              <p className="text-[11px] text-sky-800">
                Uses local WhatsApp Web session automation (<code>whatsapp-web.js</code>). No Meta Business API fees, no third-party SMS costs.
              </p>
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

      </div>
    </div>
  );
}