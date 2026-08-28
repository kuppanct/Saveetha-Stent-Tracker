"use client";

import { useState, useEffect } from "react";
import { 
  SecondLanguage, 
  UnitType, 
  Laterality, 
  StentMaterial, 
  Stent, 
  Patient 
} from "@/lib/types";
import { calculatePlannedRemovalDate, STENT_LIFESPANS } from "@/lib/stent-calculator";
import { 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  ShieldAlert,
  Layers,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import ExchangeModal from "@/components/ExchangeModal";

type InsertionMode = "SINGLE" | "DUAL_DIFFERENT";

export default function QuickAddStentPage() {
  const router = useRouter();

  // Patient Fields
  const [uhid, setUhid] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [secondLanguage, setSecondLanguage] = useState<SecondLanguage>("Tamil");

  // Mode: Single / Bilateral Same vs Bilateral Different Materials
  const [insertionMode, setInsertionMode] = useState<InsertionMode>("SINGLE");

  // Single / Standard Stent Fields
  const [unit, setUnit] = useState<UnitType>("Unit 1");
  const [laterality, setLaterality] = useState<Laterality>("Right");
  const [material, setMaterial] = useState<StentMaterial>("Regular");
  const [insertionDate, setInsertionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [plannedRemovalDate, setPlannedRemovalDate] = useState(
    calculatePlannedRemovalDate(format(new Date(), "yyyy-MM-dd"), "Regular")
  );
  const [residualStone, setResidualStone] = useState(false);
  const [insertedBy, setInsertedBy] = useState("Dr. Arunkumar MS, MCh (Uro)");
  const [notes, setNotes] = useState("");

  // Dual Material Specific Fields (Left & Right independent)
  const [leftMaterial, setLeftMaterial] = useState<StentMaterial>("Regular");
  const [leftInsertionDate, setLeftInsertionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [leftPlannedDate, setLeftPlannedDate] = useState(
    calculatePlannedRemovalDate(format(new Date(), "yyyy-MM-dd"), "Regular")
  );
  const [leftResidualStone, setLeftResidualStone] = useState(false);

  const [rightMaterial, setRightMaterial] = useState<StentMaterial>("Silicone");
  const [rightInsertionDate, setRightInsertionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rightPlannedDate, setRightPlannedDate] = useState(
    calculatePlannedRemovalDate(format(new Date(), "yyyy-MM-dd"), "Silicone")
  );
  const [rightResidualStone, setRightResidualStone] = useState(false);

  // Deduplication & State
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasDuplicate: boolean;
    activeStents: Stent[];
    existingPatient: Patient | null;
  } | null>(null);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [exchangeStentTarget, setExchangeStentTarget] = useState<Stent | null>(null);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  // Material and Date updates for standard
  const handleMaterialChange = (newMaterial: StentMaterial) => {
    setMaterial(newMaterial);
    setPlannedRemovalDate(calculatePlannedRemovalDate(insertionDate, newMaterial));
  };

  const handleInsertionDateChange = (newDate: string) => {
    setInsertionDate(newDate);
    setPlannedRemovalDate(calculatePlannedRemovalDate(newDate, material));
  };

  // Material and Date updates for Dual Left
  const handleLeftMaterialChange = (newMaterial: StentMaterial) => {
    setLeftMaterial(newMaterial);
    setLeftPlannedDate(calculatePlannedRemovalDate(leftInsertionDate, newMaterial));
  };

  const handleLeftInsertionDateChange = (newDate: string) => {
    setLeftInsertionDate(newDate);
    setLeftPlannedDate(calculatePlannedRemovalDate(newDate, leftMaterial));
  };

  // Material and Date updates for Dual Right
  const handleRightMaterialChange = (newMaterial: StentMaterial) => {
    setRightMaterial(newMaterial);
    setRightPlannedDate(calculatePlannedRemovalDate(rightInsertionDate, newMaterial));
  };

  const handleRightInsertionDateChange = (newDate: string) => {
    setRightInsertionDate(newDate);
    setRightPlannedDate(calculatePlannedRemovalDate(newDate, rightMaterial));
  };

  // Live Deduplication Check
  useEffect(() => {
    const trimmedUhid = uhid.trim();
    if (trimmedUhid.length < 4) {
      setDuplicateWarning(null);
      return;
    }

    const checkSide = insertionMode === "DUAL_DIFFERENT" ? "Bilateral" : laterality;

    const timer = setTimeout(async () => {
      setDuplicateCheckLoading(true);
      try {
        const res = await fetch(
          `/api/stents?checkDuplicate=true&uhid=${encodeURIComponent(trimmedUhid)}&laterality=${encodeURIComponent(checkSide)}`
        );
        if (res.ok) {
          const data = await res.json();
          setDuplicateWarning(data);
          if (data.existingPatient) {
            if (!name) setName(data.existingPatient.name);
            if (!phone) setPhone(data.existingPatient.phone);
            if (!address && data.existingPatient.address) setAddress(data.existingPatient.address);
            if (data.existingPatient.second_language) setSecondLanguage(data.existingPatient.second_language);
          }
        }
      } catch (e) {
        console.error("Deduplication check error", e);
      } finally {
        setDuplicateCheckLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [uhid, laterality, insertionMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        uhid: uhid.trim().toUpperCase(),
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        second_language: secondLanguage,
        unit,
        inserted_by: insertedBy.trim(),
        notes: notes.trim() || undefined,
      };

      if (insertionMode === "DUAL_DIFFERENT") {
        payload.is_dual_material = true;
        payload.laterality = "Bilateral";
        payload.material = leftMaterial;
        payload.insertion_date = leftInsertionDate;
        payload.residual_stone = leftResidualStone || rightResidualStone;
        // Left Stent specs
        payload.left_material = leftMaterial;
        payload.left_insertion_date = leftInsertionDate;
        payload.left_planned_removal_date = leftPlannedDate;
        payload.left_residual_stone = leftResidualStone;
        // Right Stent specs
        payload.right_material = rightMaterial;
        payload.right_insertion_date = rightInsertionDate;
        payload.right_planned_removal_date = rightPlannedDate;
        payload.right_residual_stone = rightResidualStone;
      } else {
        payload.is_dual_material = false;
        payload.laterality = laterality;
        payload.material = material;
        payload.insertion_date = insertionDate;
        payload.planned_removal_date = plannedRemovalDate;
        payload.residual_stone = residualStone;
      }

      const res = await fetch("/api/stents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        const err = await res.json();
        alert(`Error registering stent: ${err.error || "Please check required fields"}`);
      }
    } catch (e) {
      alert("Failed to submit form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-100 text-sky-700">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Quick-Add DJ Stent Registration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports single stents or Bilateral cases with different materials per side. Planned removal dates calculate automatically.
            </p>
          </div>
        </div>
      </div>

      {/* DEDUPLICATION ALERT BANNER */}
      {duplicateWarning?.hasDuplicate && (
        <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-5 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Active Stent Duplicate Warning for UHID: {uhid.toUpperCase()}
              </h3>
              <p className="text-xs text-rose-700 mt-1">
                An active stent already exists on the <strong>{laterality}</strong> side for patient <strong>{duplicateWarning.existingPatient?.name}</strong>.
                If exchanging this stent, use the Exchange workflow below. If stenting the opposite side, change Laterality.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl p-3 border border-rose-200 text-xs space-y-1.5">
            <p className="font-bold text-slate-800">Existing Active Stents in Patient:</p>
            {duplicateWarning.activeStents.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-slate-700">
                <span>
                  • <strong>{s.laterality} Side</strong> ({s.material} Stent) • Inserted: {s.insertion_date} • Due: {s.planned_removal_date}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setExchangeStentTarget(s);
                    setIsExchangeModalOpen(true);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 shadow-sm transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Exchange This Stent</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Section 1: Patient Demographics */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <User className="w-4 h-4 text-sky-600" />
            <span>1. Patient Demographics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital UHID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={uhid}
                onChange={(e) => setUhid(e.target.value)}
                placeholder="e.g. SMCH-2026-00512"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold tracking-wide focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
              {duplicateCheckLoading && (
                <span className="text-[10px] text-sky-600 italic">Checking for duplicates...</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                WhatsApp Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9840123456"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Second Language (SMS / WhatsApp) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Tamil", "Hindi"] as SecondLanguage[]).map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    onClick={() => setSecondLanguage(lang)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      secondLanguage === lang
                        ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    {lang === "Tamil" ? "தமிழ் (Tamil)" : "हिंदी (Hindi)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Patient Address / Area
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Thandalam, Kanchipuram / Poonamallee"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* Section 2: Insertion Configuration & Laterality Selection */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>2. Stent Insertion & Side Configuration</span>
            </h3>

            {/* Mode Toggle: Single Side vs Bilateral Dual Materials */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setInsertionMode("SINGLE")}
                className={`px-3 py-1.5 rounded-lg transition ${
                  insertionMode === "SINGLE"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Standard (Single / Same Material)
              </button>

              <button
                type="button"
                onClick={() => {
                  setInsertionMode("DUAL_DIFFERENT");
                  setLaterality("Bilateral");
                }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                  insertionMode === "DUAL_DIFFERENT"
                    ? "bg-purple-700 text-white shadow-sm"
                    : "text-slate-600 hover:text-purple-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bilateral (2 Different Materials)</span>
              </button>
            </div>
          </div>

          {/* DUAL DIFFERENT MATERIALS MODE */}
          {insertionMode === "DUAL_DIFFERENT" ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-xl text-xs text-purple-900">
                <p className="font-bold">✨ Dual Material Bilateral Protocol</p>
                <p className="mt-0.5">
                  Creates two independent stent records (<strong>Left</strong> and <strong>Right</strong>) under this UHID. Each side tracks its own material lifespan, triggers reminders independently, and can be marked <strong>"Removed"</strong> separately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Left Side Stent Box */}
                <div className="bg-sky-50/50 border-2 border-sky-300 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                    <span className="font-bold text-sky-900 text-sm flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded-full bg-sky-500" />
                      <span>LEFT KIDNEY STENT</span>
                    </span>
                    <span className="text-[10px] bg-sky-200 text-sky-800 font-bold px-2 py-0.5 rounded">
                      {STENT_LIFESPANS[leftMaterial]} Days Lifespan
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Left Material <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["Regular", "Carbothane", "Silicone"] as StentMaterial[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => handleLeftMaterialChange(m)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition text-center ${
                            leftMaterial === m
                              ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                          }`}
                        >
                          <div>{m}</div>
                          <div className="text-[9px] font-normal opacity-80">{STENT_LIFESPANS[m]}d</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Left Insertion Date
                      </label>
                      <input
                        type="date"
                        value={leftInsertionDate}
                        onChange={(e) => handleLeftInsertionDateChange(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Left Due Date
                      </label>
                      <input
                        type="date"
                        value={leftPlannedDate}
                        onChange={(e) => setLeftPlannedDate(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-sky-100 border border-sky-300 rounded-lg text-xs font-bold text-sky-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="left_res_stone"
                      checked={leftResidualStone}
                      onChange={(e) => setLeftResidualStone(e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300"
                    />
                    <label htmlFor="left_res_stone" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Left Residual Stone Present
                    </label>
                  </div>
                </div>

                {/* Right Side Stent Box */}
                <div className="bg-purple-50/50 border-2 border-purple-300 rounded-2xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                    <span className="font-bold text-purple-900 text-sm flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded-full bg-purple-500" />
                      <span>RIGHT KIDNEY STENT</span>
                    </span>
                    <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded">
                      {STENT_LIFESPANS[rightMaterial]} Days Lifespan
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Right Material <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["Regular", "Carbothane", "Silicone"] as StentMaterial[]).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => handleRightMaterialChange(m)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition text-center ${
                            rightMaterial === m
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                          }`}
                        >
                          <div>{m}</div>
                          <div className="text-[9px] font-normal opacity-80">{STENT_LIFESPANS[m]}d</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Right Insertion Date
                      </label>
                      <input
                        type="date"
                        value={rightInsertionDate}
                        onChange={(e) => handleRightInsertionDateChange(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Right Due Date
                      </label>
                      <input
                        type="date"
                        value={rightPlannedDate}
                        onChange={(e) => setRightPlannedDate(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-purple-100 border border-purple-300 rounded-lg text-xs font-bold text-purple-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="right_res_stone"
                      checked={rightResidualStone}
                      onChange={(e) => setRightResidualStone(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300"
                    />
                    <label htmlFor="right_res_stone" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Right Residual Stone Present
                    </label>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* STANDARD SINGLE STENT MODE */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Laterality <span className="text-rose-500">*</span>
                </label>
                <select
                  value={laterality}
                  onChange={(e) => setLaterality(e.target.value as Laterality)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:bg-white"
                >
                  <option value="Right">Right Kidney</option>
                  <option value="Left">Left Kidney</option>
                  <option value="Bilateral">Bilateral (Same Material)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Stent Material & Lifespan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["Regular", "Carbothane", "Silicone"] as StentMaterial[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => handleMaterialChange(m)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition text-center ${
                        material === m
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                    >
                      <div>{m}</div>
                      <div className="text-[10px] font-normal opacity-80">{STENT_LIFESPANS[m]}d</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Insertion Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={insertionDate}
                  onChange={(e) => handleInsertionDateChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Planned Removal Date
                </label>
                <input
                  type="date"
                  value={plannedRemovalDate}
                  onChange={(e) => setPlannedRemovalDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-sky-50/70 border border-sky-300 rounded-xl text-sm font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                />
                <span className="text-[10px] text-slate-500">
                  Default: +{STENT_LIFESPANS[material]} days ({material})
                </span>
              </div>

              <div className="sm:col-span-2 flex items-center space-x-2.5 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  id="res_stone_single"
                  checked={residualStone}
                  onChange={(e) => setResidualStone(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <label htmlFor="res_stone_single" className="text-xs font-bold text-amber-900 cursor-pointer">
                  Residual Stone Present in Kidney / Ureter
                </label>
              </div>
            </div>
          )}

          {/* Common General Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urology Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-sky-500 focus:bg-white"
              >
                <option value="Unit 1">Unit 1</option>
                <option value="Unit 2">Unit 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operating Surgeon / Doctor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={insertedBy}
                onChange={(e) => setInsertedBy(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinical Procedure Remarks / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Left URSL + DJ stenting done for 12mm stone; Right silicone stent placed for ureteric stricture prophylaxis."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="pt-4 flex items-center justify-end space-x-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving || savedSuccess}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Stent Records Saved Successfully!</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>
                  {saving
                    ? "Registering..."
                    : insertionMode === "DUAL_DIFFERENT"
                    ? "Register Dual Stents (Left & Right)"
                    : "Save DJ Stent Record"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Exchange Modal for Deduplication Trigger */}
      <ExchangeModal
        stent={exchangeStentTarget}
        isOpen={isExchangeModalOpen}
        onClose={() => {
          setIsExchangeModalOpen(false);
          setExchangeStentTarget(null);
        }}
        onSuccess={() => {
          router.push("/");
        }}
      />
    </div>
  );
}