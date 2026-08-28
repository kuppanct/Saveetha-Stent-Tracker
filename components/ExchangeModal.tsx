"use client";

import { useState } from "react";
import { Stent, UnitType, Laterality, StentMaterial } from "@/lib/types";
import { RefreshCw, X, AlertCircle } from "lucide-react";
import { calculatePlannedRemovalDate, STENT_LIFESPANS } from "@/lib/stent-calculator";
import { format } from "date-fns";

interface ExchangeModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExchangeModal({ stent, isOpen, onClose, onSuccess }: ExchangeModalProps) {
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
  const [loading, setLoading] = useState(false);

  // When stent opens, preset default values
  useState(() => {
    if (stent) {
      setUnit(stent.unit);
      setLaterality(stent.laterality);
      setMaterial(stent.material);
      setInsertedBy(stent.inserted_by);
      setResidualStone(stent.residual_stone);
    }
  });

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
      const res = await fetch(`/api/stents/${stent.id}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unit,
          laterality,
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
    } catch (e) {
      alert("Error processing exchange");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-purple-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-800 text-purple-200">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Exchange DJ Stent & Reset Clock</h3>
              <p className="text-xs text-purple-200">
                Patient: {stent.patient?.name} ({stent.patient?.uhid})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleExchange} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-purple-900">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Automated Exchange & Clock Reset Protocol</p>
              <p>
                The existing stent (Inserted: {stent.insertion_date}) will be marked <strong>"Exchanged"</strong> and archived. A new stent will be activated with a fresh lifespan clock.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Urology Unit <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white"
              >
                <option value="Unit 1">Unit 1</option>
                <option value="Unit 2">Unit 2</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Laterality <span className="text-rose-500">*</span>
              </label>
              <select
                value={laterality}
                onChange={(e) => setLaterality(e.target.value as Laterality)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white"
              >
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Bilateral">Bilateral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Stent Material <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["Regular", "Carbothane", "Silicone"] as StentMaterial[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => handleMaterialChange(m)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    material === m
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  <div>{m}</div>
                  <div className="text-[10px] font-normal opacity-80">({STENT_LIFESPANS[m]} days)</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Insertion Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={insertionDate}
                onChange={(e) => handleInsertionDateChange(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="exch_residual_stone"
              checked={residualStone}
              onChange={(e) => setResidualStone(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
            />
            <label htmlFor="exch_residual_stone" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Residual Stone Present in Kidney / Ureter
            </label>
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinical Notes / Indications for Exchange
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. DJ Stent exchanged for persistent lower ureteric calculus before ESWL."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Processing..." : "Complete Stent Exchange"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}