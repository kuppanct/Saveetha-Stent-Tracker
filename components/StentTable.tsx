"use client";

import { Stent } from "@/lib/types";
import { 
  Phone, 
  CheckCircle2, 
  RefreshCw, 
  MessageSquare, 
  Calendar, 
  AlertTriangle,
  FileText,
  User,
  Layers
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface StentTableProps {
  stents: Stent[];
  loading: boolean;
  onLogCall: (stent: Stent) => void;
  onRemove: (stent: Stent) => void;
  onExchange: (stent: Stent) => void;
  onPreviewMessage: (stent: Stent) => void;
}

export default function StentTable({
  stents,
  loading,
  onLogCall,
  onRemove,
  onExchange,
  onPreviewMessage,
}: StentTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-slate-700">Loading Stent Records...</p>
      </div>
    );
  }

  if (stents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800">No Stent Records Found</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          No patients match the specified criteria or filters. Try adjusting your search query or add a new patient.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3.5 px-4">Patient / UHID</th>
              <th className="py-3.5 px-4">Stent Side & Material</th>
              <th className="py-3.5 px-4">Insertion & Planned Date</th>
              <th className="py-3.5 px-4">Urgency Status</th>
              <th className="py-3.5 px-4">Unit & Surgeon</th>
              <th className="py-3.5 px-4 text-right">Side Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {stents.map((stent) => {
              const p = stent.patient;
              const badge = stent.urgency_badge;
              const isBilateral = stent.laterality === "Bilateral";
              const isLeft = stent.laterality === "Left";
              const isRight = stent.laterality === "Right";

              return (
                <tr
                  key={stent.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    stent.urgency_level === "SEVERELY_OVERDUE"
                      ? "bg-rose-50/30"
                      : stent.urgency_level === "DUE_TODAY"
                      ? "bg-amber-50/30"
                      : ""
                  }`}
                >
                  {/* Patient Info */}
                  <td className="py-4 px-4 align-top">
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                      <span>{p?.name || "Unknown"}</span>
                      {stent.has_other_side_active && (
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200 flex items-center space-x-0.5" title="Patient has dual stents with independent materials">
                          <Layers className="w-3 h-3" />
                          <span>DUAL STENT</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono font-medium mt-0.5">
                      UHID: <span className="text-slate-800 font-semibold">{p?.uhid || "N/A"}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 flex items-center space-x-2">
                      <span>📞 {p?.phone}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-medium text-sky-700">Lang: {p?.second_language}</span>
                    </div>
                  </td>

                  {/* Stent Details with Clear Side & Material distinction */}
                  <td className="py-4 px-4 align-top">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                          isLeft
                            ? "bg-sky-100 text-sky-800 border border-sky-300"
                            : isRight
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : "bg-purple-100 text-purple-800 border border-purple-300"
                        }`}
                      >
                        {stent.laterality} Kidney
                      </span>
                      <span className="font-bold text-slate-800">
                        {stent.material}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      {stent.material === "Regular" ? "90d standard" : stent.material === "Carbothane" ? "180d mid-term" : "365d long-term"}
                    </div>

                    {stent.residual_stone && (
                      <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                        ⚠️ Residual Stone
                      </span>
                    )}
                    {stent.exchanged_from_id && (
                      <span className="inline-block mt-1 text-[10px] bg-purple-100 text-purple-800 font-medium px-1.5 py-0.5 rounded ml-1">
                        Exchanged
                      </span>
                    )}
                  </td>

                  {/* Insertion & Due Date */}
                  <td className="py-4 px-4 align-top">
                    <div className="text-slate-600 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Inserted: <strong>{format(parseISO(stent.insertion_date), "dd/MM/yyyy")}</strong></span>
                    </div>
                    <div className="text-slate-900 font-semibold mt-1 flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: <strong>{format(parseISO(stent.planned_removal_date), "dd/MM/yyyy")}</strong></span>
                    </div>
                  </td>

                  {/* Urgency Badge */}
                  <td className="py-4 px-4 align-top">
                    {badge && (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.color} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                    )}
                  </td>

                  {/* Unit & Doctor */}
                  <td className="py-4 px-4 align-top">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {stent.unit}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[160px]" title={stent.inserted_by}>
                      {stent.inserted_by}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 align-top text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {stent.status === "Active" ? (
                        <>
                          <button
                            onClick={() => onLogCall(stent)}
                            title={`Log Call for ${stent.laterality} Stent`}
                            className="p-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 border border-sky-200 transition"
                          >
                            <Phone className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onPreviewMessage(stent)}
                            title={`Generate WhatsApp Alert for ${stent.laterality} Stent`}
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 transition"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onExchange(stent)}
                            title={`Exchange ${stent.laterality} Stent`}
                            className="p-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border border-purple-200 transition"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onRemove(stent)}
                            title={`Mark ${stent.laterality} Stent as Removed`}
                            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-600 hover:text-white border border-slate-300 transition"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">
                          Archived ({stent.laterality} - {stent.status})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}