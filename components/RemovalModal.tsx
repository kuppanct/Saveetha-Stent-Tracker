"use client";

import { useState } from "react";
import { Stent, ResearchEncrustation } from "@/lib/types";
import { CheckCircle2, X, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import ResearchEncrustationForm from "./ResearchEncrustationForm";

interface RemovalModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemovalModal({
  stent,
  isOpen,
  onClose,
  onSuccess,
}: RemovalModalProps) {
  const [removalDate, setRemovalDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [notes, setNotes] = useState("");
  const [logResearch, setLogResearch] = useState(false);
  const [researchData, setResearchData] = useState<Partial<ResearchEncrustation>>({});
  const [loading, setLoading] = useState(false);

  if (!isOpen || !stent) return null;

  const handleConfirmRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Mark Stent Removed
      const res = await fetch(`/api/stents/${stent.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removal_date: removalDate, notes }),
      });

      if (!res.ok) {
        alert("Failed to mark stent as removed");
        setLoading(false);
        return;
      }

      // 2. If Research Toggle is ON, Save/Upsert Research Encrustation Data
      if (logResearch) {
        try {
          await fetch(`/api/research/encrustation/${stent.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...researchData,
              patient_id: stent.patient_id,
            }),
          });
        } catch (researchErr) {
          console.warn("Failed to log research data:", researchErr);
        }
      }

      onSuccess();
      onClose();
    } catch (e) {
      alert("Error marking stent removed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className={`bg-white dark:bg-[#111827] w-full ${
          logResearch ? "max-w-2xl" : "max-w-lg"
        } rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`}
      >
        {/* Header */}
        <div className="bg-emerald-700 dark:bg-emerald-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-800 dark:bg-emerald-950 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Confirm {stent.laterality} DJ Stent Removal
              </h3>
              <p className="text-xs text-emerald-100">
                {stent.patient?.name} ({stent.patient?.uhid}) • {stent.laterality} ({stent.material})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleConfirmRemoval}
          className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs"
        >
          {/* Top Section: Stent info reminder */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3.5 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
            <AlertTriangle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Selective Stent Removal & Discharge</p>
              <p className="text-[11px] mt-0.5">
                Marks only the <strong>{stent.laterality}</strong> kidney stent as removed.
                {stent.has_other_side_active && (
                  <span className="block mt-1 font-bold text-sky-800 dark:text-sky-300">
                    ℹ️ Opposite kidney stent remains ACTIVE with its own timeline.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Removal Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Actual Removal Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={removalDate}
              onChange={(e) => setRemovalDate(e.target.value)}
              required
              className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Procedure Remarks
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`e.g., ${stent.laterality} stent removed smoothly under local anesthesia in OPD cystoscopy suite.`}
              className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* RESEARCH ENCRUSTATION TOGGLE SWITCH */}
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                    📊 Log Research Encrustation Data
                  </h4>
                  <p className="text-[10px] text-indigo-800/70 dark:text-indigo-300/70">
                    For Residents & Consultants • Stent photography & encrustation grading
                  </p>
                </div>
              </div>

              {/* Custom Animated Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={logResearch}
                  onChange={(e) => setLogResearch(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* EXPANDABLE RESEARCH FORM */}
            {logResearch && (
              <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800/60 animate-fadeIn">
                <ResearchEncrustationForm
                  stent={stent}
                  onDataChange={setResearchData}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
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
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {loading
                  ? "Saving..."
                  : logResearch
                  ? "Confirm Removal & Save Research Study"
                  : `Confirm ${stent.laterality} Stent Removed`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}