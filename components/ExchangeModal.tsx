"use client";

import { useState, useEffect } from "react";
import { Stent, UnitType, Laterality, StentMaterial, UROLOGY_SURGEONS } from "@/lib/types";
import { RefreshCw, X, AlertCircle, CheckCircle2, Split } from "lucide-react";
import { calculatePlannedRemovalDate, STENT_LIFESPANS } from "@/lib/stent-calculator";
import { format } from "date-fns";

interface ExchangeModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type BilateralActionType = "FULL_EXCHANGE" | "RETAIN_ONE_SIDE" | "EXCHANGE_ONE_SIDE";

export default function ExchangeModal({ stent, isOpen, onClose, onSuccess }: ExchangeModalProps) {
  const isBilateral = stent?.laterality === "Bilateral";

  const [bilateralAction, setBilateralAction] = useState<BilateralActionType>("FULL_EXCHANGE");
  const [removedSide, setRemovedSide] = useState<"Left" | "Right">("Left");
  const [retainedSide, setRetainedSide] = useState<"Right" | "Left">("Right");

  const [unit, setUnit] = useState<UnitType>("Unit 1");
  const [laterality, setLaterality] = useState<Laterality>("Right");
  const [material, setMaterial] = useState<StentMaterial>("Carbothane");
  const [insertionDate, setInsertionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [plannedRemovalDate, setPlannedRemovalDate] = useState("");
  const [residualStone, setResidualStone] = useState(false);
  const [insertedBy, setInsertedBy] = useState("Prof. N. Muthulatha");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stent) {
      setUnit(stent.unit || "Unit 1");
      setLaterality(stent.laterality || "Right");
      const mat = stent.material || (stent.unit === "Unit 2" ? "Regular" : "Carbothane");
      setMaterial(mat);
      const defaultDoc = stent.unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";
      setInsertedBy(stent.inserted_by || defaultDoc);
      setResidualStone(Boolean(stent.residual_stone));
      const today = format(new Date(), "yyyy-MM-dd");
      setInsertionDate(today);
      setPlannedRemovalDate(calculatePlannedRemovalDate(today, mat));
      setBilateralAction("FULL_EXCHANGE");
      setRemovedSide("Left");
      setRetainedSide("Right");
      setNotes("");
    }
  }, [stent, isOpen]);

  const handleMaterialChange = (newMaterial: StentMaterial) => {
    setMaterial(newMaterial);
    setPlannedRemovalDate(calculatePlannedRemovalDate(insertionDate, newMaterial));
  };

  const handleInsertionDateChange = (newDate: string) => {
    setInsertionDate(newDate);
    setPlannedRemovalDate(calculatePlannedRemovalDate(newDate, material));
  };

  if (!isOpen || !stent) return null;

  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isBilateral && bilateralAction === "RETAIN_ONE_SIDE") {
        // Scenario B: Removed one side, Retain the other side with its ORIGINAL countdown timer!
        const res = await fetch(`/api/stents/${stent.id}/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit: stent.unit,
            laterality: retainedSide,
            material: stent.material,
            insertion_date: stent.insertion_date, // Keep original insertion date!
            planned_removal_date: stent.planned_removal_date, // Keep original due date!
            residual_stone: residualStone,
            inserted_by: insertedBy,
            notes: `${removedSide} stent removed on ${format(new Date(), "dd/MM/yyyy")}. ${retainedSide} stent retained in situ without exchange. ${notes ? `Notes: ${notes}` : ""}`,
          }),
        });

        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          alert("Failed to update bilateral staging record");
        }
      } else if (isBilateral && bilateralAction === "EXCHANGE_ONE_SIDE") {
        // Scenario A: Removed one side, and Placed a FRESH stent on the operated side!
        const res = await fetch(`/api/stents/${stent.id}/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit,
            laterality: retainedSide, // Place fresh stent on operated side
            material,
            insertion_date: insertionDate,
            planned_removal_date: plannedRemovalDate,
            residual_stone: residualStone,
            inserted_by: insertedBy,
            notes: `${removedSide} stent removed on ${format(new Date(), "dd/MM/yyyy")}. Placed NEW ${retainedSide} stent today. ${notes ? `Notes: ${notes}` : ""}`,
          }),
        });

        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          alert("Failed to process stent exchange");
        }
      } else {
        // Standard Exchange
        const res = await fetch(`/api/stents/${stent.id}/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unit,
            laterality: isBilateral ? "Bilateral" : laterality,
            material,
            insertion_date: insertionDate,
            planned_removal_date: plannedRemovalDate,
            residual_stone: residualStone,
            inserted_by: insertedBy,
            notes,
          }),
        });

        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          alert("Failed to perform stent exchange");
        }
      }
    } catch (e) {
      alert("Error processing exchange");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-purple-900 dark:bg-purple-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-800 text-purple-200">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Exchange & Surgical Staging Protocol</h3>
              <p className="text-xs text-purple-200">
                Patient: {stent.patient?.name} ({stent.patient?.uhid}) • Currently: {stent.laterality} ({stent.material})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-purple-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExchange} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* BILATERAL CASE SPECIFIC SELECTOR */}
          {isBilateral && (
            <div className="bg-purple-50/80 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 dark:text-purple-300 font-bold">
                <Split className="w-4 h-4" />
                <span>Bilateral Surgical Procedure Done Today:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBilateralAction("FULL_EXCHANGE")}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    bilateralAction === "FULL_EXCHANGE"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <div className="font-bold">1. Full Exchange</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Replaced both Left & Right stents with fresh ones</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBilateralAction("RETAIN_ONE_SIDE")}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    bilateralAction === "RETAIN_ONE_SIDE"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <div className="font-bold">2. Remove 1 & Retain 1</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Removed 1 side stent, left other side stent as it is</div>
                </button>

                <button
                  type="button"
                  onClick={() => setBilateralAction("EXCHANGE_ONE_SIDE")}
                  className={`p-2.5 rounded-xl text-left border transition ${
                    bilateralAction === "EXCHANGE_ONE_SIDE"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <div className="font-bold">3. Remove 1 & Fresh 1</div>
                  <div className="text-[10px] opacity-80 mt-0.5">Removed 1 side stent, placed a NEW stent on other side</div>
                </button>
              </div>

              {/* Side Selector for Scenario B & C */}
              {(bilateralAction === "RETAIN_ONE_SIDE" || bilateralAction === "EXCHANGE_ONE_SIDE") && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-200 dark:border-purple-800">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase mb-1">
                      Side REMOVED Today:
                    </label>
                    <select
                      value={removedSide}
                      onChange={(e) => {
                        const rem = e.target.value as "Left" | "Right";
                        setRemovedSide(rem);
                        setRetainedSide(rem === "Left" ? "Right" : "Left");
                      }}
                      className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                    >
                      <option value="Left">Left Kidney Stent</option>
                      <option value="Right">Right Kidney Stent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase mb-1">
                      {bilateralAction === "RETAIN_ONE_SIDE" ? "Side RETAINED in situ:" : "Side with NEW Stent:"}
                    </label>
                    <div className="h-10 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl font-bold text-emerald-900 dark:text-emerald-200 flex items-center">
                      {retainedSide} Kidney ({bilateralAction === "RETAIN_ONE_SIDE" ? `Keeps original due date: ${stent.planned_removal_date}` : "Gets fresh due date"})
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Standard Exchange / New Stent Fields (Visible if Full Exchange or Exchange One Side) */}
          {(!isBilateral || bilateralAction !== "RETAIN_ONE_SIDE") && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Urology Unit & Chief *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => {
                      const newUnit = e.target.value as UnitType;
                      setUnit(newUnit);
                      if (newUnit === "Unit 1") {
                        handleMaterialChange("Carbothane");
                        setInsertedBy("Prof. N. Muthulatha");
                      } else {
                        handleMaterialChange("Regular");
                        setInsertedBy("Prof. M. Siva Sankar");
                      }
                    }}
                    className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                  >
                    <option value="Unit 1">Unit 1 - Prof. N. Muthulatha</option>
                    <option value="Unit 2">Unit 2 - Prof. M. Siva Sankar</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Operating Surgeon *
                  </label>
                  <select
                    value={insertedBy}
                    onChange={(e) => setInsertedBy(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {UROLOGY_SURGEONS.map((doc) => (
                      <option key={doc} value={doc}>
                        {doc}
                      </option>
                    ))}
                    {!UROLOGY_SURGEONS.includes(insertedBy as any) && insertedBy && (
                      <option value={insertedBy}>{insertedBy}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  New Stent Material *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Regular", "Carbothane", "Silicone"] as StentMaterial[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => handleMaterialChange(m)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                        material === m
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <div>{m}</div>
                      <div className="text-[10px] font-normal opacity-80">({STENT_LIFESPANS[m]} days)</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    New Insertion Date *
                  </label>
                  <input
                    type="date"
                    value={insertionDate}
                    onChange={(e) => handleInsertionDateChange(e.target.value)}
                    required
                    className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Planned Due Date
                  </label>
                  <input
                    type="date"
                    value={plannedRemovalDate}
                    onChange={(e) => setPlannedRemovalDate(e.target.value)}
                    required
                    className="w-full h-10 px-3 py-2 bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-700 rounded-xl font-bold text-purple-950 dark:text-purple-200"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="exch_res_stone"
              checked={residualStone}
              onChange={(e) => setResidualStone(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300"
            />
            <label htmlFor="exch_res_stone" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              Residual Stone Present in Kidney / Ureter
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Procedure Remarks / Surgical Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Left URSL done with stent removal. Right kidney stone treated."
              className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>
                {loading
                  ? "Processing..."
                  : isBilateral && bilateralAction === "RETAIN_ONE_SIDE"
                  ? `Confirm: Remove ${removedSide} & Retain ${retainedSide}`
                  : "Confirm Stent Exchange"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}