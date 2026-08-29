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
  onDelete?: (deletedStentId: string) => void;
}

export default function EditStentModal({
  stent,
  isOpen,
  onClose,
  onSuccess,
  onDelete,
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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const password = window.prompt(
      `⚠️ SECURITY CONFIRMATION REQUIRED:\n\nTo delete the ${stent.laterality} stent record for ${stent.patient?.name || "Patient"} (UHID: ${stent.patient?.uhid}), please type the confirmation password below:\n\nPassword: delete`
    );

    if (password === null) return; // User clicked Cancel

    if (password.trim().toLowerCase() !== "delete") {
      alert("❌ Incorrect password. Deletion cancelled.");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/stents/${stent.id}`, { method: "DELETE" });
      if (res.ok) {
        if (onDelete) onDelete(stent.id);
        onClose();
      } else {
        const err = await res.json();
        alert(`Failed to delete stent: ${err.error || "Server error"}`);
      }
    } catch (e) {
      alert("Network error while deleting stent");
    } finally {
      setDeleting(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/stents/${stent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          second_language: secondLanguage,
          unit,
          laterality,
          material,
          insertion_date: insertionDate,
          planned_removal_date: plannedRemovalDate,
          residual_stone: residualStone,
          inserted_by: insertedBy.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update stent");
      }

      const data = await res.json();
      onSuccess(data.stent);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8 text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Edit Stent Record</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                UHID: <strong className="text-slate-800 dark:text-slate-200">{stent.patient?.uhid}</strong> • {stent.laterality} Side
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-200 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Patient Details */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              1. Patient Demographics
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Phone Number (10 Digits) *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-800 dark:text-emerald-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Preferred Language</label>
                <select
                  value={secondLanguage}
                  onChange={(e) => setSecondLanguage(e.target.value as SecondLanguage)}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                >
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Urology Unit & Chief *</label>
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
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="Unit 1">Unit 1 - Prof. N. Muthulatha</option>
                  <option value="Unit 2">Unit 2 - Prof. M. Siva Sankar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stent Specifics */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
              2. Stent & Surgical Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Laterality (Side) *</label>
                <select
                  value={laterality}
                  onChange={(e) => setLaterality(e.target.value as Laterality)}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
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
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
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
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Planned Removal *</label>
                <input
                  type="date"
                  value={plannedRemovalDate}
                  onChange={(e) => setPlannedRemovalDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Operating Surgeon *</label>
                <select
                  value={insertedBy}
                  onChange={(e) => setInsertedBy(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
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

            <div className="flex items-center pt-2">
              <input
                type="checkbox"
                id="edit_residual_stone"
                checked={residualStone}
                onChange={(e) => setResidualStone(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
              />
              <label htmlFor="edit_residual_stone" className="ml-2 font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Residual Stone Present
              </label>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Notes / Remarks</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Clinical remarks or notes"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Action Buttons with Delete Option */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition border border-rose-200 dark:border-rose-900/50 flex items-center space-x-1.5 disabled:opacity-50"
            >
              <span>{deleting ? "Deleting..." : "🗑️ Delete Record"}</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || deleting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving Changes..." : "Save Changes"}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
