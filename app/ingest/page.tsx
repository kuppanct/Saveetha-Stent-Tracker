"use client";

import { useState, useRef } from "react";
import { 
  PlusCircle, 
  MessageSquare, 
  Camera, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  Send, 
  Copy, 
  Check, 
  Download, 
  Sparkles,
  RefreshCw,
  Eye,
  ShieldCheck
} from "lucide-react";
import Papa from "papaparse";
import { createWorker } from "tesseract.js";
import { ParsedStentEntry } from "@/lib/text-parser";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TabChannel = "FORM" | "BOT" | "OCR" | "CSV";

export default function IngestionHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabChannel>("OCR");

  // ==========================================
  // CHANNEL 2: BOT SIMULATOR STATE
  // ==========================================
  const [botMessage, setBotMessage] = useState(
    "#STENT SMCH-2026-00890 Ravi Kumar 9876543210 Right Regular RIRS Residual:Yes Unit1"
  );
  const [botTesting, setBotTesting] = useState(false);
  const [botResponse, setBotResponse] = useState<any>(null);

  const handleTestBot = async () => {
    setBotTesting(true);
    setBotResponse(null);
    try {
      const res = await fetch("/api/ingest/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: botMessage, sender: "Resident OT Mobile" }),
      });
      const data = await res.json();
      setBotResponse(data);
    } catch (e: any) {
      setBotResponse({ error: e.message });
    } finally {
      setBotTesting(false);
    }
  };

  // ==========================================
  // CHANNEL 3: CAMERA OCR SNAPPER STATE
  // ==========================================
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrRawText, setOcrRawText] = useState("");
  const [parsedDraft, setParsedDraft] = useState<ParsedStentEntry | null>(null);
  const [ocrSaving, setOcrSaving] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgUrl = e.target?.result as string;
      setOcrImage(imgUrl);
      await runOCR(imgUrl);
    };
    reader.readAsDataURL(file);
  };

  const runOCR = async (imageSrc: string) => {
    setOcrScanning(true);
    setOcrProgress(10);
    setParsedDraft(null);
    try {
      const worker = await createWorker("eng");
      setOcrProgress(40);
      const ret = await worker.recognize(imageSrc);
      setOcrProgress(80);
      await worker.terminate();

      const text = ret.data.text;
      setOcrRawText(text);

      // Parse with backend OCR parser
      const res = await fetch("/api/ingest/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: text }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedDraft(data.parsed);
      }
      setOcrProgress(100);
    } catch (err: any) {
      alert("OCR scanning failed: " + err.message);
    } finally {
      setOcrScanning(false);
    }
  };

  const handleSaveOcrDraft = async () => {
    if (!parsedDraft) return;
    setOcrSaving(true);
    try {
      const res = await fetch("/api/stents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedDraft),
      });
      if (res.ok) {
        setOcrSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        const err = await res.json();
        alert(`Error saving stent: ${err.error || "Failed to commit record"}`);
      }
    } catch (e) {
      alert("Error committing stent record");
    } finally {
      setOcrSaving(false);
    }
  };

  // Sample OCR test images
  const loadSampleOCR = async (type: "viana" | "ot_log") => {
    const sampleVianaText = `
SAVEETHA MEDICAL COLLEGE & HOSPITAL
DEPARTMENT OF UROLOGY - OPERATIVE REPORT
PATIENT NAME: Soundararajan M
UHID / HOSPITAL NO: SMCH-2026-00741
CONTACT PHONE: 9840998877
PROCEDURE DONE: Right URSL + DJ Stenting
INDICATION: 11mm Upper Ureteric Calculus
STENT DETAILS: Right Polyurethane 6Fr / 26cm Regular Stent
POST-OP NOTE: Residual stone present in lower pole. Advised ESWL after 2 weeks.
OPERATING SURGEON: Dr. Balaji MS, MCh (Uro) - Unit 2
DATE: ${new Date().toISOString().split("T")[0]}
    `;

    setOcrRawText(sampleVianaText);
    setOcrScanning(true);
    setOcrProgress(100);
    setTimeout(async () => {
      const res = await fetch("/api/ingest/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: sampleVianaText }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedDraft(data.parsed);
      }
      setOcrScanning(false);
    }, 400);
  };

  // ==========================================
  // CHANNEL 4: CSV BULK BACKLOG UPLOADER
  // ==========================================
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<any>(null);

  const handleCsvFileChange = (file: File) => {
    setCsvFile(file);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvPreview(results.data);
      },
    });
  };

  const handleBulkImport = async () => {
    if (csvPreview.length === 0) return;
    setCsvImporting(true);
    setCsvResult(null);
    try {
      const res = await fetch("/api/ingest/csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: csvPreview }),
      });
      const data = await res.json();
      setCsvResult(data);
    } catch (e: any) {
      setCsvResult({ error: e.message });
    } finally {
      setCsvImporting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent = "UHID,Patient Name,Phone,Laterality,Material,Unit,Insertion Date,Residual Stone,Surgeon\nSMCH-2026-00901,Murugan V,9840112233,Right,Regular,Unit 1,2026-06-01,No,Dr. Arunkumar\nSMCH-2026-00902,Sita Devi,9876554433,Left,Carbothane,Unit 2,2026-04-15,Yes,Dr. Balaji\nSMCH-2026-00903,Praveen K,9444332211,Bilateral,Silicone,Unit 1,2026-01-10,No,Dr. Saravanan";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saveetha_urology_stent_backlog_template.csv";
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Frictionless Data Entry & Ingestion Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            4 redundant pathways designed to eliminate data entry fatigue among Urology residents & nurses.
          </p>
        </div>

        <Link
          href="/"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition self-start md:self-auto"
        >
          ← Return to Dashboard
        </Link>
      </div>

      {/* 4 Pathway Channel Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300">
        
        {/* Channel 1 */}
        <Link
          href="/register"
          className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-bold transition text-slate-700 hover:bg-white/80"
        >
          <PlusCircle className="w-4 h-4 text-sky-600" />
          <span>1. Quick Form (PWA)</span>
        </Link>

        {/* Channel 2 */}
        <button
          type="button"
          onClick={() => setActiveTab("BOT")}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === "BOT"
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-700 hover:bg-white/80"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span>2. WhatsApp Bot</span>
        </button>

        {/* Channel 3 */}
        <button
          type="button"
          onClick={() => setActiveTab("OCR")}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === "OCR"
              ? "bg-white text-indigo-800 shadow-sm"
              : "text-slate-700 hover:bg-white/80"
          }`}
        >
          <Camera className="w-4 h-4 text-indigo-600" />
          <span>3. Camera OCR (Viana)</span>
        </button>

        {/* Channel 4 */}
        <button
          type="button"
          onClick={() => setActiveTab("CSV")}
          className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl text-xs font-bold transition ${
            activeTab === "CSV"
              ? "bg-white text-amber-900 shadow-sm"
              : "text-slate-700 hover:bg-white/80"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          <span>4. CSV Backlog</span>
        </button>
      </div>

      {/* =========================================================================
          CHANNEL 2: WHATSAPP / TELEGRAM RESIDENT BOT
          ========================================================================= */}
      {activeTab === "BOT" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>OT Resident WhatsApp & Telegram Ingestion Bot</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Post-case quick logging: Residents send a short structured syntax directly on WhatsApp after completing an OT procedure.
              </p>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              Zero-Friction Text / Voice
            </span>
          </div>

          {/* Syntax Guide Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
            <p className="font-bold text-emerald-900">Standard Syntax Format:</p>
            <div className="bg-white p-3 rounded-xl font-mono text-emerald-800 border border-emerald-300 select-all">
              #STENT &lt;UHID&gt; &lt;Patient Name&gt; &lt;Phone&gt; &lt;Side: Left/Right/Bilateral&gt; &lt;Material: Regular/Carbothane/Silicone&gt; &lt;Procedure: RIRS/URSL/PCNL&gt; Residual:&lt;Yes/No&gt; &lt;Unit1/Unit2&gt;
            </div>
            <p className="text-[11px] text-emerald-700">
              💡 <em>Example:</em> <code>#STENT 12345678 Ravi Kumar 9876543210 Right Regular RIRS Residual:Yes Unit1</code>
            </p>
          </div>

          {/* Interactive Bot Simulator */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Test Live Bot Ingestion Console
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={botMessage}
                onChange={(e) => setBotMessage(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleTestBot}
                disabled={botTesting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{botTesting ? "Parsing..." : "Simulate Bot Receive"}</span>
              </button>
            </div>
          </div>

          {/* Bot Response Output */}
          {botResponse && (
            <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-fadeIn ${
              botResponse.success ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-rose-50 border-rose-300 text-rose-900"
            }`}>
              <div className="flex items-center space-x-2 font-bold text-sm">
                {botResponse.success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Bot Parse & Ingestion Successful!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <span>Bot Ingestion Failed</span>
                  </>
                )}
              </div>

              {botResponse.success ? (
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 font-mono text-[11px] space-y-1">
                  <p>👤 Patient: <strong>{botResponse.stent?.patient?.name}</strong> (UHID: {botResponse.stent?.patient?.uhid})</p>
                  <p>📍 Side: <strong>{botResponse.stent?.laterality}</strong> Kidney ({botResponse.stent?.material} Stent)</p>
                  <p>📅 Due Date: <strong>{botResponse.stent?.planned_removal_date}</strong> (Auto calculated)</p>
                  <p>⚠️ Residual Stone: {botResponse.stent?.residual_stone ? "Yes" : "No"} • Unit: {botResponse.stent?.unit}</p>
                </div>
              ) : (
                <p className="font-semibold">{botResponse.error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CHANNEL 3: CAMERA OCR (VIANA HEALTH / OT REGISTER SNAPPER)
          ========================================================================= */}
      {activeTab === "OCR" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <span>Camera OCR Snapper (Viana Health / OT Register)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Take a photo of the Viana Health monitor screen or handwritten OT register logbook. OCR automatically extracts UHID, Name, Side, and Procedure for 1-tap confirmation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadSampleOCR("viana")}
              className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 transition"
            >
              Load Sample OT Note
            </button>
          </div>

          {/* Upload Dropzone & Camera Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 min-h-[160px]"
            >
              <Camera className="w-8 h-8 text-indigo-600" />
              <p className="text-xs font-bold text-slate-800">
                Snap Photo or Upload OT Note Image
              </p>
              <p className="text-[11px] text-slate-500">
                Supports JPG, PNG photos of Viana EMR & OT logbook
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            {/* OCR Processing & Progress */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-center space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>OCR Scanning Engine</span>
                <span>{ocrScanning ? `${ocrProgress}%` : parsedDraft ? "Extraction Ready" : "Standby"}</span>
              </div>

              {ocrScanning && (
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              )}

              {ocrRawText && (
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 max-h-24 overflow-y-auto text-[10px] font-mono text-slate-600">
                  {ocrRawText}
                </div>
              )}
            </div>
          </div>

          {/* Parsed 1-Tap Confirmation Card */}
          {parsedDraft && (
            <div className="bg-indigo-50/70 border-2 border-indigo-300 rounded-2xl p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
                <span className="font-bold text-indigo-950 text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Extracted Stent Draft (Review & 1-Tap Confirm)</span>
                </span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded">
                  AI OCR Parsed
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">UHID</label>
                  <input
                    type="text"
                    value={parsedDraft.uhid}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, uhid: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold text-indigo-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Patient Name</label>
                  <input
                    type="text"
                    value={parsedDraft.name}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Phone</label>
                  <input
                    type="text"
                    value={parsedDraft.phone}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, phone: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Side (Laterality)</label>
                  <select
                    value={parsedDraft.laterality}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, laterality: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold text-indigo-900"
                  >
                    <option value="Right">Right Kidney</option>
                    <option value="Left">Left Kidney</option>
                    <option value="Bilateral">Bilateral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Material</label>
                  <select
                    value={parsedDraft.material}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, material: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg font-bold"
                  >
                    <option value="Regular">Regular (90d)</option>
                    <option value="Carbothane">Carbothane (180d)</option>
                    <option value="Silicone">Silicone (365d)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">Due Date (Auto)</label>
                  <input
                    type="date"
                    value={parsedDraft.planned_removal_date}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, planned_removal_date: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-indigo-100 border border-indigo-300 rounded-lg font-bold text-indigo-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ocr_res_stone"
                    checked={parsedDraft.residual_stone}
                    onChange={(e) => setParsedDraft({ ...parsedDraft, residual_stone: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <label htmlFor="ocr_res_stone" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Residual Stone Present
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSaveOcrDraft}
                  disabled={ocrSaving || ocrSuccess}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {ocrSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Stent Ingested Successfully!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{ocrSaving ? "Saving..." : "1-Tap Confirm & Register"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          CHANNEL 4: CSV / EXCEL BULK BACKLOG UPLOADER
          ========================================================================= */}
      {activeTab === "CSV" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <span>CSV / Excel Bulk Backlog Uploader</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Import historical or backlog stent records in bulk with automated date parsing and deduplication checking.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadSampleCsv}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          {/* File Selector */}
          <div className="border-2 border-dashed border-amber-300 bg-amber-50/30 rounded-2xl p-6 text-center">
            <Upload className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">Select or Drag CSV File Here</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Columns: UHID, Patient Name, Phone, Laterality, Material, Insertion Date, Residual Stone</p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                if (e.target.files?.[0]) handleCsvFileChange(e.target.files[0]);
              }}
              className="mt-3 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer"
            />
          </div>

          {/* Preview Table */}
          {csvPreview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Preview Backlog Records ({csvPreview.length} Rows)
                </h4>

                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={csvImporting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>{csvImporting ? "Importing..." : `Commit ${csvPreview.length} Records`}</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">UHID</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Phone</th>
                      <th className="p-2.5">Side</th>
                      <th className="p-2.5">Material</th>
                      <th className="p-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {csvPreview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{row.UHID || row.uhid || "N/A"}</td>
                        <td className="p-2.5">{row["Patient Name"] || row.name || "N/A"}</td>
                        <td className="p-2.5">{row.Phone || row.phone || "N/A"}</td>
                        <td className="p-2.5">{row.Laterality || row.laterality || "Right"}</td>
                        <td className="p-2.5">{row.Material || row.material || "Regular"}</td>
                        <td className="p-2.5">{row["Insertion Date"] || row.insertion_date || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CSV Import Results Summary */}
          {csvResult && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center space-x-2 font-bold text-slate-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Bulk Import Complete</span>
              </div>
              <div className="flex items-center space-x-4 font-semibold text-slate-700">
                <span className="text-emerald-700">✅ Imported: {csvResult.imported}</span>
                <span className="text-amber-700">⚠️ Duplicates Skipped: {csvResult.duplicates}</span>
                <span className="text-rose-700">❌ Failed: {csvResult.failed}</span>
              </div>
              {csvResult.errors?.length > 0 && (
                <div className="text-[11px] text-rose-700 max-h-24 overflow-y-auto font-mono">
                  {csvResult.errors.map((e: string, i: number) => (
                    <div key={i}>• {e}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
