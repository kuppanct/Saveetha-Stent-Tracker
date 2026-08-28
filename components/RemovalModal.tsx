"use client";

import { useState } from "react";
import { Stent } from "@/lib/types";
import { CheckCircle2, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface RemovalModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RemovalModal({ stent, isOpen, onClose, onSuccess }: RemovalModalProps) {
  const [removalDate, setRemovalDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !stent) return null;

  const handleConfirmRemoval = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/stents/${stent.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removal_date: removalDate, notes }),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to mark stent as removed");
      }
    } catch (e) {
      alert("Error marking stent removed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-emerald-800 text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Confirm {stent.laterality} DJ Stent Removal
              </h3>
              <p className="text-xs text-emerald-100">
                {stent.patient?.name} ({stent.patient?.uhid}) - {stent.laterality} Side ({stent.material})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirmRemoval} className="p-6 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-emerald-900">
            <AlertTriangle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Selective Stent Removal</p>
              <p>
                This will mark only the <strong>{stent.laterality}</strong> kidney stent ({stent.material}) as Removed and archive it.
                {stent.has_other_side_active && (
                  <span className="block mt-1 font-bold text-sky-800">
                    ℹ️ The stent in the opposite kidney remains ACTIVE with its own scheduled removal timeline.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Removal Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={removalDate}
              onChange={(e) => setRemovalDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Clinical Notes / Procedure Remarks
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`e.g., ${stent.laterality} stent removed under local anesthesia in OPD cystoscopy suite. Stent intact.`}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
            >
              {loading ? "Confirming..." : `Confirm ${stent.laterality} Stent Removed`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}