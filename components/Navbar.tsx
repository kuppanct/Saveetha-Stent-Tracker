"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  PhoneCall, 
  UserPlus, 
  MessageSquare, 
  Sparkles, 
  RefreshCw, 
  Bell, 
  BarChart3,
  Moon,
  Sun,
  ShieldCheck,
  PlusCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<{ overdue: number; dueToday: number }>({ overdue: 0, dueToday: 0 });
  const [waConnected, setWaConnected] = useState<boolean>(false);

  useEffect(() => {
    async function loadNavData() {
      try {
        const res = await fetch("/api/stents?stats=true");
        if (res.ok) {
          const data = await res.json();
          setStats({ overdue: data.overdue || 0, dueToday: data.dueToday || 0 });
        }

        const waRes = await fetch("/api/whatsapp/status");
        if (waRes.ok) {
          const waData = await waRes.json();
          setWaConnected(waData.status === "READY");
        }
      } catch (e) {
        // quiet error
      }
    }

    loadNavData();
    const interval = setInterval(loadNavData, 15000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { 
      href: "/technician-queue", 
      label: "Call Alert Queue", 
      icon: PhoneCall,
      badge: stats.overdue + stats.dueToday > 0 ? stats.overdue + stats.dueToday : undefined,
      badgeColor: stats.overdue > 0 ? "bg-rose-500" : "bg-amber-500"
    },
    { 
      href: "/ingest", 
      label: "Stent Entry", 
      icon: Sparkles,
      highlight: true
    },
    {
      href: "/statistics",
      label: "Statistics",
      icon: BarChart3,
    },
    { 
      href: "/whatsapp-center", 
      label: "Outreach Center", 
      icon: MessageSquare,
      statusDot: waConnected ? "bg-emerald-400" : "bg-amber-400"
    },
  ];

  return (
    <>
      {/* Top Desktop & Tablet Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-[#0c121e]/95 backdrop-blur-md text-white shadow-sm border-b border-slate-800 dark:border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand */}
            <Link href="/" className="flex items-center space-x-3 group">
              <img
                src="/logo.png?v=6"
                alt="StentSync Saveetha Logo"
                className="w-11 h-11 sm:w-12 sm:h-12 object-cover rounded-2xl shadow-md border border-slate-700/60 group-hover:scale-105 transition-transform"
              />

              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-lg tracking-tight text-white">StentSync</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.2 rounded border border-teal-500/30">
                    SAVEETHA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Urology DJ Stent Registry</p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-teal-600 text-white shadow-sm"
                        : item.highlight
                        ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    
                    {item.badge !== undefined && (
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}

                    {item.statusDot && (
                      <span className={`w-2 h-2 rounded-full ${item.statusDot} animate-pulse`} title={waConnected ? "WhatsApp Gateway Connected" : "WhatsApp Setup Needed"} />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Controls: Quick Add Button & Dark Mode Toggle */}
            <div className="flex items-center space-x-2">
              
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Stent</span>
              </Link>

              {/* Dark / Light Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition shadow-sm flex items-center justify-center"
                title={theme === "dark" ? "Switch to Eye-Pleasing Light Mode" : "Switch to Calming Dark Mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-200" />
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (App Bar for Smart Phones) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 dark:bg-[#0c121e]/95 backdrop-blur-lg border-t border-slate-800 dark:border-[#1e293b] px-2 py-1.5 safe-area-pb">
        <div className="grid grid-cols-5 gap-1 text-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all relative ${
                  isActive
                    ? "text-teal-400 bg-slate-800/80"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 mb-0.5" />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 w-2.5 h-2.5 rounded-full bg-rose-500" />
                  )}
                  {item.statusDot && (
                    <span className={`absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full ${item.statusDot}`} />
                  )}
                </div>
                <span className="truncate max-w-[56px]">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}