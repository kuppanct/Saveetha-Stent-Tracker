export type SecondLanguage = "Tamil" | "Hindi";
export type UnitType = "Unit 1" | "Unit 2";
export type Laterality = "Left" | "Right" | "Bilateral";
export type StentMaterial = "Regular" | "Carbothane" | "Silicone";
export type StentStatus = "Active" | "Removed" | "Exchanged";

export type UrgencyLevel = 
  | "PRE_EXPIRY_30" 
  | "PRE_EXPIRY_14" 
  | "DUE_TODAY" 
  | "OVERDUE_14" 
  | "OVERDUE_30" 
  | "OVERDUE_90" 
  | "OVERDUE_180" 
  | "SEVERELY_OVERDUE" 
  | "NORMAL" 
  | "REMOVED" 
  | "EXCHANGED";

export interface Patient {
  id: string;
  uhid: string;
  name: string;
  phone: string;
  address?: string;
  second_language: SecondLanguage;
  created_at: string;
  updated_at?: string;
}

export interface Stent {
  id: string;
  patient_id: string;
  unit: UnitType;
  laterality: Laterality;
  material: StentMaterial;
  insertion_date: string; // YYYY-MM-DD
  planned_removal_date: string; // YYYY-MM-DD
  removal_date?: string | null;
  status: StentStatus;
  residual_stone: boolean;
  inserted_by: string;
  exchanged_from_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined fields
  patient?: Patient;
  days_remaining?: number;
  urgency_level?: UrgencyLevel;
  urgency_badge?: {
    label: string;
    color: string;
    bg: string;
    border: string;
  };
  has_other_side_active?: boolean;
  other_side_stent?: Stent;
}

export type CallOutcome =
  | "Patient not answering"
  | "Promised to come"
  | "Refused - High Risk"
  | "Number Invalid / Switched Off"
  | "Family Notified"
  | "Scheduled for OPD"
  | "Other";

export interface CallLog {
  id: string;
  stent_id: string;
  patient_id: string;
  outcome: CallOutcome;
  notes?: string;
  logged_by: string;
  created_at: string;
  patient_name?: string;
  uhid?: string;
}

export interface NotificationLog {
  id: string;
  stent_id: string;
  patient_id: string;
  trigger_type: string;
  recipient_phone: string;
  message_body: string;
  status: "SENT" | "FAILED" | "PENDING";
  sent_at: string;
  error_message?: string;
  patient_name?: string;
}

export interface StentRegistrationInput {
  uhid: string;
  name: string;
  phone: string;
  address?: string;
  second_language: SecondLanguage;
  unit: UnitType;
  laterality: Laterality;
  material: StentMaterial;
  insertion_date: string;
  planned_removal_date?: string;
  residual_stone: boolean;
  inserted_by: string;
  notes?: string;
  // Dual Stent Support (Different Materials per side)
  is_dual_material?: boolean;
  left_material?: StentMaterial;
  left_insertion_date?: string;
  left_planned_removal_date?: string;
  left_residual_stone?: boolean;
  right_material?: StentMaterial;
  right_insertion_date?: string;
  right_planned_removal_date?: string;
  right_residual_stone?: boolean;
}

export interface ExchangeStentInput {
  old_stent_id: string;
  unit: UnitType;
  laterality: Laterality;
  material: StentMaterial;
  insertion_date: string;
  planned_removal_date?: string;
  residual_stone: boolean;
  inserted_by: string;
  notes?: string;
}

export interface DashboardStats {
  totalActive: number;
  dueToday: number;
  overdue: number;
  severelyOverdue: number;
  removedThisMonth: number;
  totalPatients: number;
}

export const UROLOGY_SURGEONS = [
  "Prof. N. Muthulatha",
  "Prof. M. Siva Sankar",
  "Prof. M. Griffin",
  "Dr. C. Dev Krishna Barathi",
  "Dr. Mohammed Farooq",
  "Dr. Arvind Ramachandran",
  "Dr. Kuppan C T",
] as const;

export type UrologySurgeon = (typeof UROLOGY_SURGEONS)[number];