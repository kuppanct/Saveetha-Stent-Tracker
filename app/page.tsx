"use client";

import { useEffect, useState, useCallback } from "react";
import { Stent, DashboardStats } from "@/lib/types";
import StatsCard from "@/components/StatsCard";
import StentTable from "@/components/StentTable";
import CallLogModal from "@/components/CallLogModal";
import RemovalModal from "@/components/RemovalModal";
import ExchangeModal from "@/components/ExchangeModal";
import MessagePreviewModal from "@/components/MessagePreviewModal";
import { 
  Activity, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw,
  PlusCircle,
  Play
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [stents, setStents] = useState<Stent[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalActive: 0,
    dueToday: 0,
    overdue: 0,
    severelyOverdue: 0,
    removedThisMonth: 0,
    totalPatients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [lateralityFilter, setLateralityFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");

  // Modals state
  const [selectedStent, setSelectedStent] = useState<Stent | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false);
  const [cronTriggering, setCronTriggering] = useState(false);
  const [cronNotification, setCronNotification] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (unitFilter && unitFilter !== "ALL") params.set("unit", unitFilter);
      if (lateralityFilter && lateralityFilter !== "ALL") params.set("laterality", lateralityFilter);
      if (search) params.set("search", search);
      if (urgencyFilter && urgencyFilter !== "ALL") params.set("urgency", urgencyFilter);

      const [stentsRes, statsRes] = await Promise.all([
        fetch(`/api/stents?${params.toString()}`),
        fetch("/api/stents?stats=true"),
      ]);

      if (stentsRes.ok) {
        const stentsData = await stentsRes.json();
        setStents(stentsData);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, unitFilter, lateralityFilter, search, urgencyFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunCron = async () => {
    setCronTriggering(true);
    setCronNotification(null);
    try {
      const res = await fetch("/api/cron/trigger", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCronNotification(
          `Checked ${data.activeStentsChecked} stents. ${data.notificationsTriggered} notifications processed.`
        );
        fetchData();
      }
    } catch {
      setCronNotification("Error executing daily check");
    } finally {
      setCronTriggering(false);
      setTimeout(() => setCronNotification(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center space-x-2">
            <span>DJ Stent Triage & Monitoring Dashboard</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Department of Urology • Saveetha Medical College & Hospital • Tracks Left, Right & Dual-Material Stents Independently
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleRunCron}
            disabled={cronTriggering}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition shadow-sm disabled:opacity-50"
            title="Execute daily stent expiry evaluation and trigger queued WhatsApp notifications"
          >
            <Play className={`w-3.5 h-3.5 ${cronTriggering ? "animate-spin" : ""}`} />
            <span>{cronTriggering ? "Evaluating..." : "Run Daily Check"}</span>
          </button>

          <Link
            href="/register"
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Quick Add Stent</span>
          </Link>
        </div>
      </div>

      {cronNotification && (
        <div className="p-3 bg-sky-50 border border-sky-200 text-sky-900 text-xs font-semibold rounded-xl animate-fadeIn">
          ⏰ {cronNotification}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Active Stents"
          value={stats.totalActive}
          description="In situ (Left & Right)"
          icon={Activity}
          themeType="sky"
          onClick={() => {
            setStatusFilter("Active");
            setUrgencyFilter("ALL");
          }}
        />

        <StatsCard
          title="Due Today (T-0)"
          value={stats.dueToday}
          description="Requires removal"
          icon={Clock}
          themeType="amber"
          badgeText="Day of Removal"
          onClick={() => {
            setStatusFilter("Active");
            setUrgencyFilter("DUE_TODAY");
          }}
        />

        <StatsCard
          title="Overdue Stents"
          value={stats.overdue}
          description="Past planned date"
          icon={AlertTriangle}
          themeType="rose"
          badgeText="High Urgency"
          onClick={() => {
            setStatusFilter("Active");
            setUrgencyFilter("OVERDUE_14");
          }}
        />

        <StatsCard
          title="Severely Overdue"
          value={stats.severelyOverdue}
          description="> 180 days overdue"
          icon={AlertOctagon}
          themeType="red"
          badgeText="Critical Alert"
          onClick={() => {
            setStatusFilter("Active");
            setUrgencyFilter("SEVERELY_OVERDUE");
          }}
        />

        <StatsCard
          title="Removed / Exchanged"
          value={stats.removedThisMonth}
          description="This month"
          icon={CheckCircle2}
          themeType="emerald"
          badgeText="Completed"
          onClick={() => {
            setStatusFilter("Removed");
            setUrgencyFilter("ALL");
          }}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by UHID, Patient Name, Phone, Doctor, or Side (Left/Right)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="Active">Status: Active Only</option>
              <option value="Removed">Status: Removed</option>
              <option value="Exchanged">Status: Exchanged</option>
              <option value="ALL">Status: All Records</option>
            </select>

            {/* Side / Laterality Filter */}
            <select
              value={lateralityFilter}
              onChange={(e) => setLateralityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Sides (Left & Right)</option>
              <option value="Left">Left Kidney Only</option>
              <option value="Right">Right Kidney Only</option>
              <option value="Bilateral">Bilateral</option>
            </select>

            {/* Unit Filter */}
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Units</option>
              <option value="Unit 1">Unit 1</option>
              <option value="Unit 2">Unit 2</option>
            </select>

            {/* Urgency Filter */}
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Urgencies</option>
              <option value="DUE_TODAY">⚡ Due Today (T-0)</option>
              <option value="SEVERELY_OVERDUE">🚨 Severely Overdue (+180d)</option>
              <option value="OVERDUE_90">⚠️ Overdue (+90d)</option>
              <option value="OVERDUE_30">⚠️ Overdue (+30d)</option>
              <option value="OVERDUE_14">Overdue (+14d)</option>
              <option value="PRE_EXPIRY_14">Pre-Expiry (T-14)</option>
              <option value="PRE_EXPIRY_30">Pre-Expiry (T-30)</option>
              <option value="NORMAL">Safe (&gt; 30d)</option>
            </select>

            <button
              onClick={fetchData}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Informational Priority Tag */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>
            📋 Showing <strong>{stents.length}</strong> stent records • <em>Each kidney side is tracked independently with its own lifespan clock</em>
          </span>
          {(search || statusFilter !== "Active" || unitFilter !== "ALL" || lateralityFilter !== "ALL" || urgencyFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("Active");
                setUnitFilter("ALL");
                setLateralityFilter("ALL");
                setUrgencyFilter("ALL");
              }}
              className="text-sky-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Stent Table */}
      <StentTable
        stents={stents}
        loading={loading}
        onLogCall={(stent) => {
          setSelectedStent(stent);
          setIsCallModalOpen(true);
        }}
        onRemove={(stent) => {
          setSelectedStent(stent);
          setIsRemoveModalOpen(true);
        }}
        onExchange={(stent) => {
          setSelectedStent(stent);
          setIsExchangeModalOpen(true);
        }}
        onPreviewMessage={(stent) => {
          setSelectedStent(stent);
          setIsMsgModalOpen(true);
        }}
      />

      {/* Modals */}
      <CallLogModal
        stent={selectedStent}
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <RemovalModal
        stent={selectedStent}
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <ExchangeModal
        stent={selectedStent}
        isOpen={isExchangeModalOpen}
        onClose={() => setIsExchangeModalOpen(false)}
        onSuccess={() => fetchData()}
      />

      <MessagePreviewModal
        stent={selectedStent}
        isOpen={isMsgModalOpen}
        onClose={() => setIsMsgModalOpen(false)}
      />
    </div>
  );
}