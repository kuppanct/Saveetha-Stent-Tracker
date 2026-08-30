"use client";

import { useState, useEffect, useCallback } from "react";
import { Stent, SecondLanguage, NotificationLog } from "@/lib/types";
import { MessageSquare, X, Send, Copy, Check, ExternalLink, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { buildBilingualMessage, TemplateType } from "@/lib/message-templates";

interface MessagePreviewModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MessagePreviewModal({ stent, isOpen, onClose }: MessagePreviewModalProps) {
  const [templateType, setTemplateType] = useState<TemplateType>("DUE_TODAY");
  const [selectedLang, setSelectedLang] = useState<SecondLanguage>("Tamil");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!stent) return;
    try {
      setHistoryLoading(true);
      const res = await fetch(`/api/notification-logs?stentId=${stent.id}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [stent]);

  useEffect(() => {
    if (isOpen && stent) {
      fetchHistory();
      setSendSuccess(null);
    }
  }, [isOpen, stent, fetchHistory]);

  if (!isOpen || !stent) return null;

  const currentLang = stent.patient?.second_language || selectedLang;

  const { englishPart, regionalPart, fullMessage } = buildBilingualMessage(
    templateType,
    {
      patientName: stent.patient?.name || "Patient",
      laterality: stent.laterality,
      insertionDate: stent.insertion_date,
      dueDate: stent.planned_removal_date,
    },
    currentLang
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = async () => {
    if (!stent.patient?.phone) return;
    setSending(true);
    setSendSuccess(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: stent.patient.phone,
          message: fullMessage,
          stent_id: stent.id,
          patient_id: stent.patient_id,
          trigger_type: templateType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendSuccess("WhatsApp message dispatched successfully!");
        fetchHistory();
      } else {
        setSendSuccess(data.message || data.error || "Logged to notification records.");
        fetchHistory();
      }
    } catch (e: any) {
      setSendSuccess("Error contacting messaging service");
    } finally {
      setSending(false);
    }
  };

  const handleDirectWebClick = async () => {
    if (!stent.patient?.phone) return;
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: stent.patient.phone,
          message: fullMessage,
          stent_id: stent.id,
          patient_id: stent.patient_id,
          trigger_type: `${templateType}_WEB_DIRECT`,
        }),
      });
      fetchHistory();
    } catch {}
  };

  const handleDirectSmsClick = async () => {
    if (!stent.patient?.phone) return;
    try {
      await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: stent.patient.phone,
          message: fullMessage,
          stent_id: stent.id,
          patient_id: stent.patient_id,
          trigger_type: `${templateType}_SMS`,
        }),
      });
      fetchHistory();
    } catch {}
  };

  const waDirectUrl = `https://wa.me/91${stent.patient?.phone?.replace(/\D/g, "")}?text=${encodeURIComponent(fullMessage)}`;
  const smsDirectUrl = `sms:+91${stent.patient?.phone?.replace(/\D/g, "")}?&body=${encodeURIComponent(fullMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-emerald-800 dark:bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-900 text-emerald-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Bilingual Patient Outreach (WhatsApp & SMS)</h3>
              <p className="text-xs text-emerald-200">
                To: {stent.patient?.name} ({stent.patient?.phone}) | Language: {currentLang}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Select Message Category
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
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                    templateType === t.type
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bilingual Message Preview Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Live Generated Bilingual Payload
              </span>
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 font-semibold px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                1st Half: English | 2nd Half: {currentLang}
              </span>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
              {fullMessage}
            </div>
          </div>

          {sendSuccess && (
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs text-sky-800 dark:text-sky-200 font-medium">
              ℹ️ {sendSuccess}
            </div>
          )}

          {/* Dual Action Buttons: WhatsApp & Normal SMS */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={waDirectUrl}
                target="_blank"
                rel="noreferrer"
                onClick={handleDirectWebClick}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>💬 WhatsApp (Auto-Logged)</span>
              </a>

              <a
                href={smsDirectUrl}
                onClick={handleDirectSmsClick}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>📱 Regular SMS (Auto-Logged)</span>
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-medium transition"
            >
              Close
            </button>
          </div>

          {/* Multi-Channel Outreach History */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Communication History for this Patient ({history.length})</span>
            </h4>

            {historyLoading ? (
              <p className="text-xs text-slate-500 italic">Loading outreach history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No WhatsApp or SMS records found yet for this stent.</p>
            ) : (
              <div className="space-y-2.5 max-h-44 overflow-y-auto pr-1">
                {history.map((item) => {
                  const isSms = item.trigger_type.includes("SMS");
                  return (
                    <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-semibold">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isSms
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}>
                            {isSms ? "📱 Regular SMS" : "💬 WhatsApp"}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                            {item.trigger_type.replace("_WEB_DIRECT", "").replace("_SMS", "")}
                          </span>
                          <span className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {item.status || "SENT"}
                          </span>
                        </div>
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {new Date(item.sent_at || item.sent_timestamp || "").toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2 font-mono text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                        {item.message_body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}