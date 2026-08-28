import { StentMaterial, StentStatus, UrgencyLevel, Stent } from "./types";
import { addDays, format, parseISO, startOfDay, differenceInCalendarDays } from "date-fns";

export const STENT_LIFESPANS: Record<StentMaterial, number> = {
  Regular: 90,
  Carbothane: 180,
  Silicone: 365,
};

/**
 * Calculates planned removal date based on insertion date and stent material.
 */
export function calculatePlannedRemovalDate(
  insertionDateStr: string,
  material: StentMaterial
): string {
  const insertionDate = parseISO(insertionDateStr);
  const lifespanDays = STENT_LIFESPANS[material] || 90;
  const plannedDate = addDays(insertionDate, lifespanDays);
  return format(plannedDate, "yyyy-MM-dd");
}

/**
 * Returns difference in days from today to planned removal date.
 * Positive = days left in future
 * 0 = Due today (T-0)
 * Negative = overdue by N days
 */
export function getDaysRemaining(plannedRemovalDateStr: string): number {
  const today = startOfDay(new Date());
  const plannedDate = startOfDay(parseISO(plannedRemovalDateStr));
  return differenceInCalendarDays(plannedDate, today);
}

/**
 * Computes the urgency level and visual badge configuration for UI.
 */
export function getUrgencyInfo(
  plannedRemovalDateStr: string,
  status: StentStatus
): {
  level: UrgencyLevel;
  daysRemaining: number;
  badge: { label: string; color: string; bg: string; border: string };
} {
  if (status === "Removed") {
    return {
      level: "REMOVED",
      daysRemaining: 0,
      badge: {
        label: "Removed",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      },
    };
  }

  if (status === "Exchanged") {
    return {
      level: "EXCHANGED",
      daysRemaining: 0,
      badge: {
        label: "Exchanged / Archived",
        color: "text-purple-700",
        bg: "bg-purple-50",
        border: "border-purple-200",
      },
    };
  }

  const daysRemaining = getDaysRemaining(plannedRemovalDateStr);

  // Overdue Logic (daysRemaining < 0)
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);

    if (overdueDays >= 180) {
      return {
        level: "SEVERELY_OVERDUE",
        daysRemaining,
        badge: {
          label: `🚨 Severely Overdue (+${overdueDays}d)`,
          color: "text-rose-900",
          bg: "bg-rose-100 animate-pulse font-bold",
          border: "border-rose-400",
        },
      };
    }
    if (overdueDays >= 90) {
      return {
        level: "OVERDUE_90",
        daysRemaining,
        badge: {
          label: `⚠️ Overdue (+${overdueDays}d)`,
          color: "text-rose-800",
          bg: "bg-rose-50 font-semibold",
          border: "border-rose-300",
        },
      };
    }
    if (overdueDays >= 30) {
      return {
        level: "OVERDUE_30",
        daysRemaining,
        badge: {
          label: `⚠️ Overdue (+${overdueDays}d)`,
          color: "text-red-700",
          bg: "bg-red-50 font-semibold",
          border: "border-red-300",
        },
      };
    }
    return {
      level: "OVERDUE_14",
      daysRemaining,
      badge: {
        label: `Overdue (+${overdueDays}d)`,
        color: "text-orange-800",
        bg: "bg-orange-100 font-medium",
        border: "border-orange-300",
      },
    };
  }

  // Due Today
  if (daysRemaining === 0) {
    return {
      level: "DUE_TODAY",
      daysRemaining: 0,
      badge: {
        label: "⚡ Due Today (T-0)",
        color: "text-amber-900",
        bg: "bg-amber-100 font-bold border-amber-400",
        border: "border-amber-400",
      },
    };
  }

  // Pre-Expiry
  if (daysRemaining <= 14) {
    return {
      level: "PRE_EXPIRY_14",
      daysRemaining,
      badge: {
        label: `Due in ${daysRemaining} days (T-14)`,
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
    };
  }

  if (daysRemaining <= 30) {
    return {
      level: "PRE_EXPIRY_30",
      daysRemaining,
      badge: {
        label: `Due in ${daysRemaining} days (T-30)`,
        color: "text-blue-700",
        bg: "bg-blue-50",
        border: "border-blue-200",
      },
    };
  }

  return {
    level: "NORMAL",
    daysRemaining,
    badge: {
      label: `Safe (${daysRemaining} days left)`,
      color: "text-slate-700",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  };
}

/**
 * Evaluates whether a stent qualifies for a cron notification on the current day.
 * Notification Matrix:
 * - T-30: Exactly 30 days before planned removal
 * - T-14: Exactly 14 days before planned removal
 * - T-0: Day of planned removal
 * - T+14: Exactly 14 days overdue
 * - T+30: Exactly 30 days overdue
 * - T+90: Exactly 90 days overdue
 * - T+180: Exactly 180 days overdue
 * - Severely Overdue: Every 30 days after 180 days (210, 240, 270...)
 */
export function evaluateNotificationTrigger(
  plannedRemovalDateStr: string,
  status: StentStatus
): { shouldNotify: boolean; triggerType: string | null; category: "PRE_EXPIRY" | "DUE_TODAY" | "OVERDUE" | "REMOVED" | null } {
  if (status !== "Active") {
    return { shouldNotify: false, triggerType: null, category: null };
  }

  const daysRemaining = getDaysRemaining(plannedRemovalDateStr);

  // Pre-Expiry
  if (daysRemaining === 30) {
    return { shouldNotify: true, triggerType: "T-30", category: "PRE_EXPIRY" };
  }
  if (daysRemaining === 14) {
    return { shouldNotify: true, triggerType: "T-14", category: "PRE_EXPIRY" };
  }

  // Day of Removal
  if (daysRemaining === 0) {
    return { shouldNotify: true, triggerType: "T-0", category: "DUE_TODAY" };
  }

  // Overdue triggers (daysRemaining < 0)
  if (daysRemaining < 0) {
    const overdueDays = Math.abs(daysRemaining);

    if (overdueDays === 14) {
      return { shouldNotify: true, triggerType: "T+14", category: "OVERDUE" };
    }
    if (overdueDays === 30) {
      return { shouldNotify: true, triggerType: "T+30", category: "OVERDUE" };
    }
    if (overdueDays === 90) {
      return { shouldNotify: true, triggerType: "T+90", category: "OVERDUE" };
    }
    if (overdueDays === 180) {
      return { shouldNotify: true, triggerType: "T+180", category: "OVERDUE" };
    }
    // Severely overdue: every 30 days sequentially after 180
    if (overdueDays > 180 && (overdueDays - 180) % 30 === 0) {
      return { shouldNotify: true, triggerType: `T+${overdueDays}`, category: "OVERDUE" };
    }
  }

  return { shouldNotify: false, triggerType: null, category: null };
}

/**
 * Bilateral Priority Rule:
 * Sorts stents prioritizing the shortest remaining time (most urgent first).
 * If a patient has multiple stents (e.g. Left and Right, or Bilateral), the list sorts
 * by the smallest daysRemaining first.
 */
export function sortStentsByUrgency(stents: Stent[]): Stent[] {
  return [...stents].sort((a, b) => {
    // Active stents come before Removed/Exchanged
    if (a.status === "Active" && b.status !== "Active") return -1;
    if (a.status !== "Active" && b.status === "Active") return 1;

    const daysA = a.days_remaining ?? getDaysRemaining(a.planned_removal_date);
    const daysB = b.days_remaining ?? getDaysRemaining(b.planned_removal_date);

    // Smallest days remaining (most overdue/earliest due) first
    return daysA - daysB;
  });
}