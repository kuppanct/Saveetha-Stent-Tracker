"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  PhoneCall, 
  UserPlus, 
  MessageSquare, 
  Hospital,
  Sparkles,
  RefreshCw,
  Bell
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
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
      label: "Technician Queue", 
      icon: PhoneCall,
      badge: stats.overdue + stats.dueToday > 0 ? stats.overdue + stats.dueToday : undefined,
      badgeColor: stats.overdue > 0 ? "bg-rose-500" : "bg-amber-500"
    },
    { 
      href: "/ingest", 
      label: "Entry Hub (4 Channels)", 
      icon: Sparkles,
      highlight: true
    },
    { 
      href: "/whatsapp-center", 
      label: "WhatsApp Center", 
      icon: MessageSquare,
      statusDot: waConnected ? "bg-emerald-400" : "bg-amber-400"
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Hospital Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Hospital className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">SAVEETHA</span>
                <span className="text-xs bg-sky-600/30 text-sky-300 font-semibold px-2 py-0.5 rounded border border-sky-500/30">UROLOGY</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">DJ Stent Tracking & Prevention System</p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sky-600 text-white shadow-inner"
                      : item.highlight
                      ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.label}</span>
                  
                  {item.badge !== undefined && (
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold text-white rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}

                  {item.statusDot && (
                    <span className={`w-2 h-2 rounded-full ${item.statusDot} animate-pulse`} title={waConnected ? "WhatsApp Ready" : "WhatsApp Setup Needed"} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}