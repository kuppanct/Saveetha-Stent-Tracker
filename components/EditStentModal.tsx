"use client";

import { useState } from "react";
import { Stent, Laterality, StentMaterial, UnitType, SecondLanguage, UROLOGY_SURGEONS } from "@/lib/types";
import { calculatePlannedRemovalDate } from "@/lib/stent-calculator";
import { 
  X, 
  Save, 
  User, 
  Phone, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  AlertTriangle,
  Edit3
} from "lucide-react";

interface EditStentModalProps {
  stent: Stent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Stent) => void;
}

export default function EditStentModal({
  stent,
  isOpen,
  onClose,
  onSuccess,
}: EditStentModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState(stent.patient?.name || "");
  const [phone, setPhone] = useState(stent.patient?.phone || "");
  const [secondLanguage, setSecondLanguage] = useState<SecondLanguage>(
    stent.patient?.second_language || "Tamil"
  );
  const [unit, setUnit] = useState<UnitType>(stent.unit || "Unit 1");
  const [laterality, setLaterality] = useState<Laterality>(stent.laterality || "Right");
  const [material, setMaterial] = useState<StentMaterial>(stent.material || "Carbothane");
  const [insertionDate, setInsertionDate] = useState(stent.insertion_date || "");
  const [plannedRemovalDate, setPlannedRemovalDate] = useState(stent.planned_removal_date || "");
  const [residualStone, setResidualStone] = useState(Boolean(stent.residual_stone));
  const [insertedBy, setInsertedBy] = useState(stent.inserted_by || "");
  const [notes, setNotes] = useState(stent.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMaterialChange = (newMaterial: StentMaterial) => {
    setMaterial(newMaterial);
    if (insertionDate) {
      setPlannedRemovalDate(calculatePlannedRemovalDate(insertionDate, newMaterial));
    }
  };

  const handleInsertionDateChange = (newDate: string) => {
    setInsertionDate(newDate);
    if (newDate && material) {
      setPlannedRemovalDate(calculatePlannedRemovalDate(newDate, material));
    }
  };

  const handleUnitChange = (newUnit: UnitType) => {
    setUnit(newUnit);
    if (newUnit === "Unit 1") {
      setInsertedBy("Prof. N. Muthulatha");
      setMaterial("Carbothane");
      if (insertionDate) setPlannedRemovalDate(calculatePlannedRemovalDate(insertionDate, "Carbothane"));
    } else {
      setInsertedBy("Prof. M. Siva Sankar");
      setMaterial("Regular");
      if (insertionDate) setPlannedRemovalDate(calculatePlannedRemovalDate(insertionDate, "Regular"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stents/${stent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          second_language: secondLanguage,
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

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(data.stent);
        onClose();
      } else {
        setError(data.error || "Failed to update record");
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit updates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1f293d] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Edit Stent Record</h3>
              <p className="text-xs text-teal-100 font-mono">
                UHID: {stent.patient?.uhid} • {stent.laterality} Kidney
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Demographics */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 pb-1">
              1. Patient Demographics
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Reminder Language</label>
                <select
                  value={secondLanguage}
                  onChange={(e) => setSecondLanguage(e.target.value as SecondLanguage)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Surgical & Stent Configuration */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 pb-1">
              2. Stent & Surgical Parameters
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Urology Unit *</label>
                <select
                  value={unit}
                  onChange={(e) => handleUnitChange(e.target.value as UnitType)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="Unit 1">Unit 1 - Prof. N. Muthulatha</option>
                  <option value="Unit 2">Unit 2 - Prof. M. Siva Sankar</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Laterality (Side) *</label>
                <select
                  value={laterality}
                  onChange={(e) => setLaterality(e.target.value as Laterality)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="Right">Right Kidney</option>
                  <option value="Left">Left Kidney</option>
                  <option value="Bilateral">Bilateral</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Stent Material *</label>
                <select
                  value={material}
                  onChange={(e) => handleMaterialChange(e.target.value as StentMaterial)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="Carbothane">Carbothane (180 Days)</option>
                  <option value="Regular">Regular Polyurethane (90 Days)</option>
                  <option value="Silicone">Silicone Long-term (365 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Insertion Date *</label>
                <input
                  type="date"
                  value={insertionDate}
                  onChange={(e) => handleInsertionDateChange(e.target.value)}
                  required
                  className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Planned Removal Due Date *</label>
                <input
                  type="date"
                  value={plannedRemovalDate}
                  onChange={(e) => setPlannedRemovalDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 py-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700 rounded-xl font-bold text-teal-900 dark:text-teal-200"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Operating Surgeon *</label>
                <select
                  value={insertedBy}
                  onChange={(e) => setInsertedBy(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
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

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="edit_residual_stone"
                checked={residualStone}
                onChange={(e) => setResidualStone(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <label htmlFor="edit_residual_stone" className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                Residual Stone Present in Kidney / Ureter
              </label>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Notes / Procedure Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Clinical remarks or notes"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
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
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
