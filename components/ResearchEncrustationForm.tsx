"use client";

import { useState, useEffect, useRef } from "react";
import {
  Stent,
  ResearchEncrustation,
  UrineCulture,
  ProcedureType,
  StoneClearanceStatus,
  EncrustationGrade,
  EncrustationLocation,
  RemovalDifficulty,
  AnatomicalAbnormality,
} from "@/lib/types";
import { compressStentImage } from "@/lib/image-compression";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Activity,
  Beaker,
  ShieldAlert,
  Sparkles,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

interface ResearchEncrustationFormProps {
  stent: Stent;
  initialData?: ResearchEncrustation | null;
  onDataChange: (data: Partial<ResearchEncrustation>) => void;
}

const URINE_CULTURES: UrineCulture[] = [
  "Sterile",
  "E.coli",
  "Proteus",
  "Klebsiella",
  "Pseudomonas",
  "Other",
];

const PROCEDURE_TYPES: ProcedureType[] = [
  "URSL",
  "RIRS",
  "PCNL",
  "ESWL",
  "Endopyelotomy",
  "Stricture Dilatation",
  "Malignancy",
  "Other",
];

const STONE_CLEARANCE: StoneClearanceStatus[] = [
  "Complete",
  "Residual Fragments",
  "Not Applicable",
];

const ENCRUSTATION_LOCATIONS: EncrustationLocation[] = [
  "Renal",
  "Ureter",
  "Bladder",
];

const REMOVAL_DIFFICULTIES: RemovalDifficulty[] = [
  "Simple",
  "Moderate",
  "Complex",
];

const ANATOMICAL_ABNORMALITIES: { value: AnatomicalAbnormality; label: string }[] = [
  { value: "None", label: "🟢 None (Normal Anatomy)" },
  { value: "PUJO", label: "PUJO (Pelviureteric Junction)" },
  { value: "Horseshoe Kidney", label: "Horseshoe Kidney" },
  { value: "Duplicated System", label: "Duplicated / Duplex System" },
  { value: "Ectopic Kidney", label: "Ectopic / Pelvic Kidney" },
  { value: "Malrotated Kidney", label: "Malrotated Kidney" },
  { value: "Ureterocele", label: "Ureterocele" },
  { value: "Other", label: "Other Abnormality" },
];

const STENT_CALIBER_OPTIONS = [
  { value: 3.8, label: "3.8 Fr (Pediatric / Slim)" },
  { value: 5.0, label: "5.0 Fr (5 Fr)" },
  { value: 6.0, label: "6.0 Fr (6 Fr - Standard Adult)" },
];

const STENT_LENGTH_OPTIONS = [
  { value: 16, label: "16 cm (Pediatric)" },
  { value: 20, label: "20 cm" },
  { value: 22, label: "22 cm" },
  { value: 24, label: "24 cm" },
  { value: 26, label: "26 cm (Standard Adult)" },
  { value: 28, label: "28 cm (Tall Patient / Complex)" },
  { value: 30, label: "30 cm" },
];

export default function ResearchEncrustationForm({
  stent,
  initialData,
  onDataChange,
}: ResearchEncrustationFormProps) {
  // Context-aware defaults based on stent notes/procedure
  const inferProcedureType = (): ProcedureType => {
    const text = `${stent.notes || ""} ${stent.inserted_by || ""}`.toUpperCase();
    if (text.includes("RIRS")) return "RIRS";
    if (text.includes("PCNL")) return "PCNL";
    if (text.includes("URSL")) return "URSL";
    if (text.includes("ESWL")) return "ESWL";
    if (text.includes("ENDOPYELOTOMY")) return "Endopyelotomy";
    if (text.includes("STRICTURE")) return "Stricture Dilatation";
    if (text.includes("MALIGNANCY") || text.includes("CA ")) return "Malignancy";
    return "URSL";
  };

  // BMI Calculation Mode
  const [bmiMode, setBmiMode] = useState<"CALCULATE" | "MANUAL">("CALCULATE");
  const [weightKg, setWeightKg] = useState<string>(
    initialData?.weight_kg ? String(initialData.weight_kg) : ""
  );
  const [heightCm, setHeightCm] = useState<string>(
    initialData?.height_cm ? String(initialData.height_cm) : ""
  );
  const [bmi, setBmi] = useState<string>(
    initialData?.bmi ? String(initialData.bmi) : ""
  );

  // Patient Comorbidities & Anatomical Abnormalities
  const [isDiabetic, setIsDiabetic] = useState<boolean>(
    Boolean(initialData?.is_diabetic)
  );
  const [hasCkd, setHasCkd] = useState<boolean>(Boolean(initialData?.has_ckd));
  const [pregnancyStatus, setPregnancyStatus] = useState<boolean>(
    Boolean(initialData?.pregnancy_status)
  );
  const [recurrentStoneFormer, setRecurrentStoneFormer] = useState<boolean>(
    initialData?.recurrent_stone_former !== undefined
      ? Boolean(initialData.recurrent_stone_former)
      : Boolean(stent.residual_stone)
  );
  const [anatomicalAbnormality, setAnatomicalAbnormality] = useState<AnatomicalAbnormality>(
    initialData?.anatomical_abnormality || "None"
  );

  // Pre-op Urine
  const [urineCulture, setUrineCulture] = useState<UrineCulture>(
    initialData?.urine_culture || "Sterile"
  );
  const [urinePh, setUrinePh] = useState<string>(
    initialData?.urine_ph !== undefined && initialData?.urine_ph !== null
      ? String(initialData.urine_ph)
      : "6.0"
  );

  // Surgery Details
  const [procedureType, setProcedureType] = useState<ProcedureType>(
    initialData?.procedure_type || inferProcedureType()
  );
  const [stoneClearance, setStoneClearance] = useState<StoneClearanceStatus>(
    initialData?.stone_clearance_status || "Complete"
  );
  const [stentSizeFr, setStentSizeFr] = useState<number>(
    initialData?.stent_size_fr ?? 6.0
  );
  const [stentLengthCm, setStentLengthCm] = useState<number>(
    initialData?.stent_length_cm ?? 26
  );

  // Encrustation Findings
  const [encrustationGrade, setEncrustationGrade] = useState<EncrustationGrade>(
    initialData?.encrustation_grade ?? 0
  );
  const [encrustationLocations, setEncrustationLocations] = useState<
    EncrustationLocation[]
  >(initialData?.encrustation_location || []);
  const [removalDifficulty, setRemovalDifficulty] = useState<RemovalDifficulty>(
    initialData?.removal_difficulty || "Simple"
  );
  const [ancillaryProcedure, setAncillaryProcedure] = useState<boolean>(
    Boolean(initialData?.ancillary_procedure_required)
  );

  // Additional Variables
  const [alkalinizerUsed, setAlkalinizerUsed] = useState<boolean>(
    Boolean(initialData?.alkalinizer_used)
  );
  const [symptomaticIndwelling, setSymptomaticIndwelling] = useState<boolean>(
    Boolean(initialData?.symptomatic_indwelling)
  );

  // Image Upload & Compression
  const [stentImageUrl, setStentImageUrl] = useState<string | null>(
    initialData?.stent_image_url || null
  );
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageCompressionInfo, setImageCompressionInfo] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-calculate BMI whenever Height or Weight changes
  useEffect(() => {
    if (bmiMode === "CALCULATE") {
      const wt = parseFloat(weightKg);
      const ht = parseFloat(heightCm);
      if (wt > 0 && ht > 0) {
        const htMeters = ht / 100;
        const calculatedBmi = (wt / (htMeters * htMeters)).toFixed(1);
        setBmi(calculatedBmi);
      } else {
        setBmi("");
      }
    }
  }, [weightKg, heightCm, bmiMode]);

  // Synchronize state changes to parent form
  useEffect(() => {
    onDataChange({
      patient_id: stent.patient_id,
      stent_id: stent.id,
      weight_kg: weightKg ? parseFloat(weightKg) : null,
      height_cm: heightCm ? parseFloat(heightCm) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      is_diabetic: isDiabetic,
      has_ckd: hasCkd,
      pregnancy_status: pregnancyStatus,
      recurrent_stone_former: recurrentStoneFormer,
      anatomical_abnormality: anatomicalAbnormality,
      urine_culture: urineCulture,
      urine_ph: urinePh ? parseFloat(urinePh) : null,
      procedure_type: procedureType,
      stone_clearance_status: stoneClearance,
      stent_size_fr: stentSizeFr,
      stent_length_cm: stentLengthCm,
      encrustation_grade: encrustationGrade,
      encrustation_location: encrustationLocations,
      removal_difficulty: removalDifficulty,
      ancillary_procedure_required: ancillaryProcedure,
      alkalinizer_used: alkalinizerUsed,
      symptomatic_indwelling: symptomaticIndwelling,
      stent_image_url: stentImageUrl,
    });
  }, [
    weightKg,
    heightCm,
    bmi,
    isDiabetic,
    hasCkd,
    pregnancyStatus,
    recurrentStoneFormer,
    anatomicalAbnormality,
    urineCulture,
    urinePh,
    procedureType,
    stoneClearance,
    stentSizeFr,
    stentLengthCm,
    encrustationGrade,
    encrustationLocations,
    removalDifficulty,
    ancillaryProcedure,
    alkalinizerUsed,
    symptomaticIndwelling,
    stentImageUrl,
  ]);

  // Handle Location Multi-Select Toggle
  const toggleLocation = (loc: EncrustationLocation) => {
    if (encrustationLocations.includes(loc)) {
      setEncrustationLocations(encrustationLocations.filter((l) => l !== loc));
    } else {
      setEncrustationLocations([...encrustationLocations, loc]);
    }
  };

  // Handle Photo Capture with Canvas Compression
  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const rawFile = files[0];
    setUploadingImage(true);
    setImageCompressionInfo("Compressing photo (<150KB)...");

    try {
      // 1. Client-Side Image Compression
      const compressed = await compressStentImage(rawFile, 1200, 145);
      setImageCompressionInfo(
        `Compressed: ${compressed.originalSizeKb}KB ➔ ${compressed.compressedSizeKb}KB`
      );

      // 2. Upload to Server / Supabase Storage
      const formData = new FormData();
      formData.append("file", compressed.file);
      formData.append("stentId", stent.id);

      const res = await fetch("/api/research/upload-image", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setStentImageUrl(json.url);
      } else {
        alert("Failed to upload image. Using local preview.");
        setStentImageUrl(compressed.dataUrl);
      }
    } catch (err: any) {
      alert("Error compressing photo: " + (err.message || "Unknown error"));
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-4 pt-3 text-slate-900 dark:text-slate-100">
      
      {/* Research Module Header Banner */}
      <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-3.5 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <h4 className="font-bold text-indigo-950 dark:text-indigo-200">
            Clinical Research Protocol: Stent Encrustation & Biocompatibility Study
          </h4>
          <p className="text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
            Department of Urology • Saveetha Medical College & Hospital • NABH & Academic Research Registry
          </p>
        </div>
      </div>

      {/* SECTION 1: PATIENT DEMOGRAPHICS & CLINICAL FACTORS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200">
            <Activity className="w-4 h-4 text-teal-600" />
            <span>1. Patient Factors & BMI Calculator</span>
          </div>

          {/* BMI Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setBmiMode("CALCULATE")}
              className={`px-2 py-1 rounded-md transition ${
                bmiMode === "CALCULATE"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Calculate Ht/Wt
            </button>
            <button
              type="button"
              onClick={() => setBmiMode("MANUAL")}
              className={`px-2 py-1 rounded-md transition ${
                bmiMode === "MANUAL"
                  ? "bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Enter Manual
            </button>
          </div>
        </div>

        {/* Height, Weight & BMI Inputs */}
        <div className="grid grid-cols-3 gap-2.5">
          {bmiMode === "CALCULATE" ? (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 68"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  placeholder="e.g. 165"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Auto BMI (kg/m²)
                </label>
                <div className="w-full h-9 px-2.5 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-black text-teal-800 dark:text-teal-200 flex items-center justify-center">
                  {bmi ? `${bmi} kg/m²` : "Auto"}
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-3">
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Direct BMI Value (kg/m²)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 24.5"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
                className="w-full h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>
          )}
        </div>

        {/* 4 Comorbidity 1-Tap Toggle Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isDiabetic}
              onChange={(e) => setIsDiabetic(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Diabetes Mellitus
            </span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={hasCkd}
              onChange={(e) => setHasCkd(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Chronic Kidney Dis (CKD)
            </span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={pregnancyStatus}
              onChange={(e) => setPregnancyStatus(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Pregnancy
            </span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={recurrentStoneFormer}
              onChange={(e) => setRecurrentStoneFormer(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Recurrent Stone Former
            </span>
          </label>
        </div>

        {/* Anatomical Abnormality Select */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
            Urological Anatomical Abnormality / Congenital Variant
          </label>
          <select
            value={anatomicalAbnormality}
            onChange={(e) =>
              setAnatomicalAbnormality(e.target.value as AnatomicalAbnormality)
            }
            className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
          >
            {ANATOMICAL_ABNORMALITIES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 2: PRE-OP URINE & PH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Beaker className="w-4 h-4 text-sky-600" />
          <span>2. Pre-Operative Urine Microbiology & Biochemistry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Pre-Op Urine Culture & Sensitivity
            </label>
            <select
              value={urineCulture}
              onChange={(e) => setUrineCulture(e.target.value as UrineCulture)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              {URINE_CULTURES.map((c) => (
                <option key={c} value={c}>
                  {c === "Sterile" ? "🟢 Sterile / No Growth" : `🔴 ${c}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Pre-Op Urine pH (Range: 5.0 - 8.5)
            </label>
            <input
              type="number"
              step="0.1"
              min="4.5"
              max="9.0"
              placeholder="e.g. 6.0"
              value={urinePh}
              onChange={(e) => setUrinePh(e.target.value)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: SURGICAL PROCEDURE & STENT SPECS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
          <ShieldAlert className="w-4 h-4 text-purple-600" />
          <span>3. Surgical Index Procedure & Stent Specifications</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Index Surgery Procedure Type
            </label>
            <select
              value={procedureType}
              onChange={(e) => setProcedureType(e.target.value as ProcedureType)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              {PROCEDURE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Stone Clearance Status Post-Op
            </label>
            <select
              value={stoneClearance}
              onChange={(e) =>
                setStoneClearance(e.target.value as StoneClearanceStatus)
              }
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              {STONE_CLEARANCE.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stent Dimensions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Stent Caliber (French Size)
            </label>
            <select
              value={String(stentSizeFr)}
              onChange={(e) => setStentSizeFr(parseFloat(e.target.value))}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              {STENT_CALIBER_OPTIONS.map((c) => (
                <option key={c.value} value={String(c.value)}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Stent Length (cm)
            </label>
            <select
              value={String(stentLengthCm)}
              onChange={(e) => setStentLengthCm(parseInt(e.target.value, 10))}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            >
              {STENT_LENGTH_OPTIONS.map((l) => (
                <option key={l.value} value={String(l.value)}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 4: ENCRUSTATION GRADING & FINDINGS AT REMOVAL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>4. Encrustation Grade & Removal Findings (Direct Visual / Tactile)</span>
        </div>

        {/* Encrustation Grade 0 - 3 Interactive Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
            Encrustation Severity Grade (FEC / KUB Scale)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                grade: 0 as EncrustationGrade,
                title: "Grade 0: None",
                desc: "Clean Stent Surface",
                color: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
              },
              {
                grade: 1 as EncrustationGrade,
                title: "Grade 1: Mild",
                desc: "Thin Biofilm / Scattered Crystals",
                color: "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
              },
              {
                grade: 2 as EncrustationGrade,
                title: "Grade 2: Moderate",
                desc: "Thick Crust / Fragmented",
                color: "border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
              },
              {
                grade: 3 as EncrustationGrade,
                title: "Grade 3: Severe",
                desc: "Heavy Calcified Sheath / Blocked",
                color: "border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
              },
            ].map((g) => (
              <button
                type="button"
                key={g.grade}
                onClick={() => setEncrustationGrade(g.grade)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  encrustationGrade === g.grade
                    ? `ring-2 ring-indigo-500 shadow-sm ${g.color} font-bold`
                    : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="text-xs font-black">{g.title}</div>
                <div className="text-[10px] opacity-80 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Anatomical Locations Multi-Select */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
            Encrustation Anatomical Location(s)
          </label>
          <div className="flex flex-wrap gap-2">
            {ENCRUSTATION_LOCATIONS.map((loc) => {
              const isSelected = encrustationLocations.includes(loc);
              return (
                <button
                  type="button"
                  key={loc}
                  onClick={() => toggleLocation(loc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "opacity-100" : "opacity-30"
                    }`}
                  />
                  <span>{loc} Coil / Segment</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Removal Difficulty & Ancillary Procedures */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
              Removal Difficulty
            </label>
            <select
              value={removalDifficulty}
              onChange={(e) =>
                setRemovalDifficulty(e.target.value as RemovalDifficulty)
              }
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
            >
              {REMOVAL_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d} Removal
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ancillaryProcedure}
                onChange={(e) => setAncillaryProcedure(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Ancillary Procedure Needed (Cystolithotripsy/ESWL/Pushback)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 5: MEDICATIONS & SYMPTOMS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>5. Indwelling Course & Patient Symptoms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={alkalinizerUsed}
              onChange={(e) => setAlkalinizerUsed(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Urine Alkalinizer Used
              </span>
              <span className="text-[10px] text-slate-500">
                Potassium Citrate / Sodabicarb / Syrup Citralka
              </span>
            </div>
          </label>

          <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={symptomaticIndwelling}
              onChange={(e) => setSymptomaticIndwelling(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Symptomatic While Stented
              </span>
              <span className="text-[10px] text-slate-500">
                Gross Hematuria / Severe LUTS / Flank Pain
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* SECTION 6: STENT PHOTO CAPTURE & COMPRESSION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center space-x-2 font-bold text-xs text-slate-800 dark:text-slate-200">
            <Camera className="w-4 h-4 text-teal-600" />
            <span>6. Stent Visual Artifact Photography (&lt;150KB Auto-Compressed)</span>
          </div>

          {imageCompressionInfo && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              {imageCompressionInfo}
            </span>
          )}
        </div>

        {/* Hidden Camera File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleImageCapture}
          className="hidden"
        />

        {stentImageUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={stentImageUrl}
                alt="Removed DJ Stent Photo"
                className="w-16 h-16 object-cover rounded-xl border border-slate-300 dark:border-slate-600"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Stent Photo Attached
                </p>
                <p className="text-[10px] text-slate-500">
                  Saved in Supabase Stent Images Cloud
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStentImageUrl(null);
                setImageCompressionInfo(null);
              }}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              title="Remove Photo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 rounded-2xl flex flex-col items-center justify-center space-y-1 text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition bg-slate-50/50 dark:bg-slate-800/30 disabled:opacity-50"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">
              {uploadingImage
                ? "Compressing & Uploading Photo..."
                : "📸 Capture Stent Photo (Camera / Gallery)"}
            </span>
            <span className="text-[10px] text-slate-400">
              Auto-compressed on device to strictly under 150KB for fast uploading
            </span>
          </button>
        )}
      </div>

    </div>
  );
}
