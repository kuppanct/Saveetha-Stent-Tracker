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
  Layers,
  ChevronRight,
  Edit3,
  Trash2,
  Sparkles
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface StentTableProps {
  stents: Stent[];
  loading: boolean;
  onLogCall: (stent: Stent) => void;
  onRemove: (stent: Stent) => void;
  onExchange: (stent: Stent) => void;
  onPreviewMessage: (stent: Stent) => void;
  onEdit?: (stent: Stent) => void;
  onDelete?: (stent: Stent) => void;
  onOpenResearch?: (stent: Stent) => void;
}

export default function StentTable({
  stents,
  loading,
  onLogCall,
  onRemove,
  onExchange,
  onPreviewMessage,
  onEdit,
  onDelete,
  onOpenResearch,
}: StentTableProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f293d] p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent mb-3" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading Stent Records...</p>
      </div>
    );
  }

  if (stents.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f293d] p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Stent Records Found</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          No patients match the specified criteria or filters. Try adjusting your search query or add a new patient.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      {/* =========================================================================
          MOBILE VIEW (< 640px): Responsive Action Cards
          ========================================================================= */}
      <div className="block sm:hidden space-y-3">
        {stents.map((stent) => {
          const p = stent.patient;
          const badge = stent.urgency_badge;
          const isLeft = stent.laterality === "Left";
          const isRight = stent.laterality === "Right";
          const chiefName = stent.unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";

          return (
            <div
              key={stent.id}
              className={`bg-white dark:bg-[#111827] rounded-2xl border p-4 shadow-sm space-y-3 transition-all ${
                stent.urgency_level === "SEVERELY_OVERDUE"
                  ? "border-rose-400 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/20"
                  : stent.urgency_level === "DUE_TODAY"
                  ? "border-amber-400 dark:border-amber-800/80 bg-amber-50/20 dark:bg-amber-950/20"
                  : "border-slate-200 dark:border-[#1f293d]"
              }`}
            >
              {/* Header: Name, UHID, Urgency Badge & Discrete Delete Button */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-1">
                    <span>{p?.name}</span>
                    {stent.has_other_side_active && (
                      <span className="text-[9px] bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.2 rounded">
                        DUAL
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    UHID: <span className="font-semibold text-slate-800 dark:text-slate-200">{p?.uhid}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badge.bg} ${badge.color} ${badge.border}`}>
                      {badge.label}
                    </span>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(stent)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Side, Material & Dates */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Kidney & Type</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1 mt-0.5">
                    <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isLeft ? "bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300" : isRight ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300" : "bg-purple-100 text-purple-800"
                    }`}>
                      {stent.laterality}
                    </span>
                    <span>{stent.material}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Removal Due</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400 mt-0.5 block">
                    {format(parseISO(stent.planned_removal_date), "dd/MM/yyyy")}
                  </span>
                </div>
              </div>

              {/* Unit & Unit Chief Name */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-700 dark:text-slate-300">
                  {stent.unit}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
                  {chiefName}
                </span>
              </div>

              {/* Action Buttons */}
              {stent.status === "Active" ? (
                <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => onLogCall(stent)}
                    className="py-2 px-1 bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition shadow-sm"
                    title="Log Call"
                  >
                    <Phone className="w-3.5 h-3.5 mb-0.5" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() => onPreviewMessage(stent)}
                    className="py-2 px-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition shadow-sm"
                    title="WhatsApp Alert"
                  >
                    <MessageSquare className="w-3.5 h-3.5 mb-0.5" />
                    <span>WA</span>
                  </button>

                  {onEdit && (
                    <button
                      onClick={() => onEdit(stent)}
                      className="py-2 px-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition shadow-sm"
                      title="Edit Record"
                    >
                      <Edit3 className="w-3.5 h-3.5 mb-0.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => onExchange(stent)}
                    className="py-2 px-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition shadow-sm"
                    title="Exchange Stent"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mb-0.5" />
                    <span>Exch</span>
                  </button>

                  <button
                    onClick={() => onRemove(stent)}
                    className="py-2 px-1 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-emerald-600 hover:text-white rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition shadow-sm"
                    title="Mark Removed"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mb-0.5" />
                    <span>Done</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400">
                    Archived ({stent.status})
                  </span>
                  {onOpenResearch && (
                    <button
                      onClick={() => onOpenResearch(stent)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>📝 Encrustation Study</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          DESKTOP & TABLET VIEW (>= 640px): Full Data Table
          ========================================================================= */}
      <div className="hidden sm:block bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#1f293d] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-[#1f293d] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient / UHID</th>
                <th className="py-3.5 px-4">Side & Material</th>
                <th className="py-3.5 px-4">Insertion & Due Date</th>
                <th className="py-3.5 px-4">Urgency Status</th>
                <th className="py-3.5 px-4">Unit & Surgeon</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f293d] text-xs">
              {stents.map((stent) => {
                const p = stent.patient;
                const badge = stent.urgency_badge;
                const isLeft = stent.laterality === "Left";
                const isRight = stent.laterality === "Right";
                const chiefName = stent.unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";

                return (
                  <tr
                    key={stent.id}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                      stent.urgency_level === "SEVERELY_OVERDUE"
                        ? "bg-rose-50/30 dark:bg-rose-950/20"
                        : stent.urgency_level === "DUE_TODAY"
                        ? "bg-amber-50/30 dark:bg-amber-950/20"
                        : ""
                    }`}
                  >
                    {/* Patient Info */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center space-x-1.5">
                        <span>{p?.name || "Unknown"}</span>
                        {stent.has_other_side_active && (
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800 flex items-center space-x-0.5">
                            <Layers className="w-3 h-3" />
                            <span>DUAL</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium mt-0.5">
                        UHID: <span className="text-slate-800 dark:text-slate-200 font-semibold">{p?.uhid || "N/A"}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
                        <span>📞 {p?.phone}</span>
                        <span className="text-slate-300 dark:text-slate-600">•</span>
                        <span className="font-medium text-teal-700 dark:text-teal-400">{p?.second_language}</span>
                      </div>
                    </td>

                    {/* Stent Details */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold ${
                            isLeft
                              ? "bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700"
                              : isRight
                              ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                              : "bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                          }`}
                        >
                          {stent.laterality}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {stent.material}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {stent.material === "Regular" ? "90d lifespan" : stent.material === "Carbothane" ? "180d lifespan" : "365d lifespan"}
                      </div>

                      {stent.residual_stone && (
                        <span className="inline-block mt-1 text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded">
                          ⚠️ Residual Stone
                        </span>
                      )}
                    </td>

                    {/* Insertion & Due Date */}
                    <td className="py-4 px-4 align-top">
                      <div className="text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ins: <strong>{format(parseISO(stent.insertion_date), "dd/MM/yyyy")}</strong></span>
                      </div>
                      <div className="text-slate-900 dark:text-slate-100 font-semibold mt-1 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Due: <strong className="text-rose-600 dark:text-rose-400">{format(parseISO(stent.planned_removal_date), "dd/MM/yyyy")}</strong></span>
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
                      <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {stent.unit}
                      </span>
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[160px]" title={chiefName}>
                        {chiefName}
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
                              className="p-2 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 transition"
                            >
                              <Phone className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onPreviewMessage(stent)}
                              title={`WhatsApp Alert for ${stent.laterality} Stent`}
                              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>

                            {onEdit && (
                              <button
                                onClick={() => onEdit(stent)}
                                title={`Edit Stent Record`}
                                className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onExchange(stent)}
                              title={`Exchange ${stent.laterality} Stent`}
                              className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 transition"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => onRemove(stent)}
                              title={`Mark ${stent.laterality} Stent as Removed`}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white border border-slate-300 dark:border-slate-700 transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>

                            {onDelete && (
                              <button
                                onClick={() => onDelete(stent)}
                                title={`Delete Stent Record`}
                                className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-200 dark:border-rose-900/50 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-xs font-semibold text-slate-400 italic">
                              Archived ({stent.status})
                            </span>
                            {onOpenResearch && (
                              <button
                                onClick={() => onOpenResearch(stent)}
                                title="Add/Edit Encrustation Research Data"
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>📝 Research Data</span>
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(stent)}
                                title={`Delete Archived Record`}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
    </div>
  );
}