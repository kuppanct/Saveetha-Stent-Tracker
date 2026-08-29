"use client";

import { useEffect, useState } from "react";
import { Stent, DashboardStats } from "@/lib/types";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Users,
  Activity,
  Award,
  Sparkles
} from "lucide-react";

export default function StatisticsPage() {
  const [stents, setStents] = useState<Stent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatsData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stents?status=ALL");
      if (res.ok) {
        const data: Stent[] = await res.json();
        setStents(data);
      }
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatsData();
  }, []);

  // Compute analytics
  const totalStents = stents.length;
  const activeStents = stents.filter((s) => s.status === "Active");
  const removedStents = stents.filter((s) => s.status === "Removed");
  const exchangedStents = stents.filter((s) => s.status === "Exchanged");

  // Unit breakdown
  const unit1Stents = stents.filter((s) => s.unit === "Unit 1");
  const unit2Stents = stents.filter((s) => s.unit === "Unit 2");

  // Material breakdown
  const regularStents = stents.filter((s) => s.material === "Regular");
  const carbothaneStents = stents.filter((s) => s.material === "Carbothane");
  const siliconeStents = stents.filter((s) => s.material === "Silicone");

  // Laterality breakdown
  const leftStents = stents.filter((s) => s.laterality === "Left");
  const rightStents = stents.filter((s) => s.laterality === "Right");
  const bilateralStents = stents.filter((s) => s.laterality === "Bilateral");

  // Urgency breakdown (active)
  const overdueCount = activeStents.filter((s) => (s.days_remaining ?? 1) < 0).length;
  const severelyOverdueCount = activeStents.filter((s) => (s.days_remaining ?? 0) <= -180).length;
  const onTimeCount = activeStents.filter((s) => (s.days_remaining ?? 1) >= 0).length;

  const complianceRate = activeStents.length > 0 
    ? Math.round((onTimeCount / activeStents.length) * 100) 
    : 100;

  // Stone correlation
  const withResidualStone = stents.filter((s) => s.residual_stone).length;

  const downloadAuditReport = () => {
    let csv = "UHID,Patient Name,Phone,Unit,Head Professor,Side,Material,Status,Insertion Date,Planned Due Date,Days Remaining,Residual Stone,Surgeon\n";
    stents.forEach((s) => {
      const prof = s.unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";
      csv += `"${s.patient?.uhid || ""}","${s.patient?.name || ""}","${s.patient?.phone || ""}","${s.unit}","${prof}","${s.laterality}","${s.material}","${s.status}","${s.insertion_date}","${s.planned_removal_date}","${s.days_remaining ?? ""}","${s.residual_stone ? "Yes" : "No"}","${s.inserted_by}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `saveetha_urology_stent_audit_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Department Statistics & Clinical Audits
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Department of Urology • Saveetha Medical College & Hospital • Unit 1 (Prof. N. Muthulatha) & Unit 2 (Prof. M. Siva Sankar)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchStatsData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="/api/research/export-csv"
            download
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Export Encrustation Study (CSV)</span>
          </a>

          <button
            onClick={downloadAuditReport}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Department Audit (CSV)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Calculating Department Metrics...</p>
        </div>
      ) : (
        <>
          {/* Key KPI Performance Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Total Stents Tracked</span>
                <Activity className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-3xl font-black text-slate-900">{totalStents}</p>
              <div className="text-xs text-slate-500 flex items-center space-x-2">
                <span className="font-bold text-sky-700">{activeStents.length} Active in Situ</span>
                <span>•</span>
                <span>{removedStents.length} Removed</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>On-Time Compliance Rate</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-600">{complianceRate}%</p>
              <div className="text-xs text-slate-500">
                {onTimeCount} of {activeStents.length} active stents on schedule
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Overdue Stents</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-amber-600">{overdueCount}</p>
              <div className="text-xs text-slate-500">
                <span>{severelyOverdueCount} severely overdue (&gt;180d)</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                <span>Residual Stone Flag</span>
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-3xl font-black text-purple-700">{withResidualStone}</p>
              <div className="text-xs text-slate-500">
                Requires stone clearance check at removal
              </div>
            </div>

          </div>

          {/* Unit 1 vs Unit 2 Detailed Audit Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* Unit 1: Prof. N. Muthulatha */}
            <div className="bg-white rounded-2xl border-2 border-sky-200 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-md uppercase">
                    Urology Unit 1
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Prof. N. Muthulatha</h3>
                  <p className="text-xs text-slate-500">Unit Chief & Professor of Urology</p>
                </div>
                <span className="text-2xl font-black text-sky-700">{unit1Stents.length} <span className="text-xs font-normal text-slate-500">Stents</span></span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 text-[11px]">Active</p>
                  <p className="text-base font-bold text-slate-900">{unit1Stents.filter((s) => s.status === "Active").length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-emerald-700 text-[11px]">Removed</p>
                  <p className="text-base font-bold text-emerald-800">{unit1Stents.filter((s) => s.status === "Removed").length}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <p className="text-amber-700 text-[11px]">Overdue</p>
                  <p className="text-base font-bold text-amber-800">
                    {unit1Stents.filter((s) => s.status === "Active" && (s.days_remaining ?? 0) < 0).length}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Unit 1 Workload Share</span>
                  <span>{totalStents > 0 ? Math.round((unit1Stents.length / totalStents) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2.5 rounded-full"
                    style={{ width: `${totalStents > 0 ? (unit1Stents.length / totalStents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Unit 2: Prof. M. Siva Sankar */}
            <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-md uppercase">
                    Urology Unit 2
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">Prof. M. Siva Sankar</h3>
                  <p className="text-xs text-slate-500">Unit Chief & Professor of Urology</p>
                </div>
                <span className="text-2xl font-black text-indigo-700">{unit2Stents.length} <span className="text-xs font-normal text-slate-500">Stents</span></span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-slate-500 text-[11px]">Active</p>
                  <p className="text-base font-bold text-slate-900">{unit2Stents.filter((s) => s.status === "Active").length}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-emerald-700 text-[11px]">Removed</p>
                  <p className="text-base font-bold text-emerald-800">{unit2Stents.filter((s) => s.status === "Removed").length}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl">
                  <p className="text-amber-700 text-[11px]">Overdue</p>
                  <p className="text-base font-bold text-amber-800">
                    {unit2Stents.filter((s) => s.status === "Active" && (s.days_remaining ?? 0) < 0).length}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-600 font-semibold">
                  <span>Unit 2 Workload Share</span>
                  <span>{totalStents > 0 ? Math.round((unit2Stents.length / totalStents) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${totalStents > 0 ? (unit2Stents.length / totalStents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Distribution Breakdowns: Material & Laterality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Stent Material Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Stent Material Distribution</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Regular Polyurethane (90 Days)</span>
                    <span className="font-bold text-slate-900">{regularStents.length} ({totalStents > 0 ? Math.round((regularStents.length / totalStents) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: `${totalStents > 0 ? (regularStents.length / totalStents) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Carbothane Stent (180 Days)</span>
                    <span className="font-bold text-slate-900">{carbothaneStents.length} ({totalStents > 0 ? Math.round((carbothaneStents.length / totalStents) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${totalStents > 0 ? (carbothaneStents.length / totalStents) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Silicone Long-Term (365 Days)</span>
                    <span className="font-bold text-slate-900">{siliconeStents.length} ({totalStents > 0 ? Math.round((siliconeStents.length / totalStents) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${totalStents > 0 ? (siliconeStents.length / totalStents) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Laterality Distribution */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>Laterality & Side Breakdown</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Right Kidney Only</span>
                    <span className="font-bold text-slate-900">{rightStents.length} ({totalStents > 0 ? Math.round((rightStents.length / totalStents) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${totalStents > 0 ? (rightStents.length / totalStents) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Left Kidney Only</span>
                    <span className="font-bold text-slate-900">{leftStents.length} ({totalStents > 0 ? Math.round((leftStents.length / totalStents) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sky-600 h-2 rounded-full" style={{ width: `${totalStents > 0 ? (leftStents.length / totalStents) * 100 : 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">Bilateral Stents</span>
                    <span className="font-bold text-slate-900">{bilateralStents.length} ({totalStents > 0 ? Math.round((bilateralStents.length / totalStents) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${totalStents > 0 ? (bilateralStents.length / totalStents) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
