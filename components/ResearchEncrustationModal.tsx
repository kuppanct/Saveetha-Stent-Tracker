"use client";

import { useState, useEffect } from "react";
import { Stent, ResearchEncrustation } from "@/lib/types";
import { Sparkles, X, Save, CheckCircle2, RefreshCw } from "lucide-react";
import ResearchEncrustationForm from "./ResearchEncrustationForm";

interface ResearchEncrustationModalProps {
  stent: Stent | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ResearchEncrustationModal({
  stent,
  isOpen,
  onClose,
  onSuccess,
}: ResearchEncrustationModalProps) {
  const [researchData, setResearchData] = useState<Partial<ResearchEncrustation>>({});
  const [initialData, setInitialData] = useState<ResearchEncrustation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !stent) return;

    let isMounted = true;
    setLoading(true);
    setSavedSuccess(false);

    // Fetch existing research encrustation record if available
    fetch(`/api/research/encrustation/${stent.id}`)
      .then((res) => res.json())
      .then((json) => {
        if (isMounted) {
          if (json.success && json.data) {
            setInitialData(json.data);
            setResearchData(json.data);
          } else {
            setInitialData(null);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load existing research record:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [stent, isOpen]);

  if (!isOpen || !stent) return null;

  const handleSaveResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/research/encrustation/${stent.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...researchData,
          patient_id: stent.patient_id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        alert("Failed to save research record: " + (json.error || "Server error"));
      }
    } catch (err: any) {
      alert("Error saving research record: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="bg-indigo-900 dark:bg-indigo-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-800 text-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Clinical Research Study: Encrustation &amp; Biocompatibility
              </h3>
              <p className="text-xs text-indigo-200">
                Patient: {stent.patient?.name} ({stent.patient?.uhid}) • {stent.laterality} ({stent.material})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-indigo-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold">Loading research record...</p>
          </div>
        ) : (
          <form onSubmit={handleSaveResearch} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {savedSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 p-3 rounded-2xl text-emerald-900 dark:text-emerald-200 font-bold flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Research study data saved successfully! Closing...</span>
              </div>
            )}

            <ResearchEncrustationForm
              stent={stent}
              initialData={initialData}
              onDataChange={setResearchData}
            />

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Study..." : "Save Research Data (UPSERT)"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
