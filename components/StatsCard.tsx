"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  themeType?: "sky" | "amber" | "rose" | "red" | "emerald" | "purple";
  badgeText?: string;
  onClick?: () => void;
}

const THEME_STYLES = {
  sky: {
    border: "border-sky-200 dark:border-sky-900/60 hover:border-sky-400 dark:hover:border-sky-700",
    bg: "bg-white dark:bg-[#111827]",
    iconBg: "bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
    valueColor: "text-slate-900 dark:text-white",
    badge: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800",
  },
  amber: {
    border: "border-amber-300 dark:border-amber-900/80 hover:border-amber-400 dark:hover:border-amber-600",
    bg: "bg-amber-50/30 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
    valueColor: "text-amber-900 dark:text-amber-200",
    badge: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
  },
  rose: {
    border: "border-orange-300 dark:border-orange-900/80 hover:border-orange-400 dark:hover:border-orange-600",
    bg: "bg-orange-50/30 dark:bg-orange-950/20",
    iconBg: "bg-orange-100 dark:bg-orange-900/70 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
    valueColor: "text-orange-900 dark:text-orange-200",
    badge: "bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700",
  },
  red: {
    border: "border-rose-400 dark:border-rose-900 hover:border-rose-500 dark:hover:border-rose-600",
    bg: "bg-rose-50/40 dark:bg-rose-950/30",
    iconBg: "bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 border border-rose-300 dark:border-rose-700",
    valueColor: "text-rose-950 dark:text-rose-200",
    badge: "bg-rose-100 dark:bg-rose-900/70 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700",
  },
  emerald: {
    border: "border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400 dark:hover:border-emerald-700",
    bg: "bg-white dark:bg-[#111827]",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
    valueColor: "text-slate-900 dark:text-white",
    badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  },
  purple: {
    border: "border-purple-200 dark:border-purple-900/60 hover:border-purple-400",
    bg: "bg-white dark:bg-[#111827]",
    iconBg: "bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
    valueColor: "text-slate-900 dark:text-white",
    badge: "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  },
};

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  themeType = "sky",
  badgeText,
  onClick,
}: StatsCardProps) {
  const t = THEME_STYLES[themeType] || THEME_STYLES.sky;

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden p-5 rounded-2xl border shadow-sm transition-all duration-200 ${t.bg} ${t.border} ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
          <p className={`text-3xl font-black mt-1 tracking-tight ${t.valueColor}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-2xl ${t.iconBg} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span>{description}</span>
        {badgeText && (
          <span className={`font-bold px-2 py-0.5 rounded-lg text-[10px] ${t.badge}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}