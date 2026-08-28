"use client";

import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  badgeText?: string;
  onClick?: () => void;
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  colorClass,
  badgeText,
  onClick,
}: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white p-5 rounded-2xl border shadow-sm transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${colorClass}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-100/80 text-slate-700">
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{description}</span>
        {badgeText && (
          <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}