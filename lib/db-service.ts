import { supabase, isSupabaseConfigured } from "./supabase";
import {
  Patient,
  Stent,
  CallLog,
  NotificationLog,
  StentRegistrationInput,
  ExchangeStentInput,
  CallOutcome,
  DashboardStats,
} from "./types";
import {
  calculatePlannedRemovalDate,
  getDaysRemaining,
  getUrgencyInfo,
  sortStentsByUrgency,
} from "./stent-calculator";
import { format, subDays, addDays } from "date-fns";

// ==========================================
// LOCAL IN-MEMORY/STORAGE FALLBACK STATE
// (Ensures zero-setup instant local preview)
// ==========================================
const mockPatients: Patient[] = [
  {
    id: "p-001",
    uhid: "SMCH-2026-00101",
    name: "Kavitha Murugan",
    phone: "9840123456",
    address: "Thandalam, Chennai - 602105",
    second_language: "Tamil",
    created_at: format(subDays(new Date(), 40), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  {
    id: "p-002",
    uhid: "SMCH-2026-00142",
    name: "Rajesh Sharma",
    phone: "9876543210",
    address: "Poonamallee, Chennai - 600056",
    second_language: "Hindi",
    created_at: format(subDays(new Date(), 105), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  {
    id: "p-003",
    uhid: "SMCH-2026-00205",
    name: "Annamalai S",
    phone: "9444112233",
    address: "Kanchipuram Main Road",
    second_language: "Tamil",
    created_at: format(subDays(new Date(), 90), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  {
    id: "p-004",
    uhid: "SMCH-2026-00318",
    name: "Priya Velu",
    phone: "9176998877",
    address: "Sriperumbudur",
    second_language: "Tamil",
    created_at: format(subDays(new Date(), 60), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  {
    id: "p-005",
    uhid: "SMCH-2026-00450",
    name: "Meenakshi Sundaram",
    phone: "9841098765",
    address: "Saveetha Nagar, Kanchipuram",
    second_language: "Tamil",
    created_at: format(subDays(new Date(), 280), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
];

const mockStents: Stent[] = [
  // 1. Kavitha: Regular Stent, Right Side, Due in 50 days (Safe)
  {
    id: "s-001",
    patient_id: "p-001",
    unit: "Unit 1",
    laterality: "Right",
    material: "Regular",
    insertion_date: format(subDays(new Date(), 40), "yyyy-MM-dd"),
    planned_removal_date: format(addDays(new Date(), 50), "yyyy-MM-dd"),
    status: "Active",
    residual_stone: false,
    inserted_by: "Prof. N. Muthulatha (Unit 1)",
    created_at: format(subDays(new Date(), 40), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  // 2. Rajesh: Regular Stent, Left Side, Overdue by 15 days (T+14 Overdue category)
  {
    id: "s-002",
    patient_id: "p-002",
    unit: "Unit 2",
    laterality: "Left",
    material: "Regular",
    insertion_date: format(subDays(new Date(), 105), "yyyy-MM-dd"),
    planned_removal_date: format(subDays(new Date(), 15), "yyyy-MM-dd"),
    status: "Active",
    residual_stone: true,
    inserted_by: "Prof. M. Sivasankar (Unit 2)",
    created_at: format(subDays(new Date(), 105), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  // 3. Annamalai: Left Side, Due TODAY (T-0)
  {
    id: "s-003",
    patient_id: "p-003",
    unit: "Unit 1",
    laterality: "Left",
    material: "Regular",
    insertion_date: format(subDays(new Date(), 90), "yyyy-MM-dd"),
    planned_removal_date: format(new Date(), "yyyy-MM-dd"),
    status: "Active",
    residual_stone: false,
    inserted_by: "Prof. N. Muthulatha (Unit 1)",
    created_at: format(subDays(new Date(), 90), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  // 4A. Priya Velu: DUAL MATERIAL BILATERAL CASE:
  // Left Side: Regular 90d Stent (Due in 12 days - T-14 Pre-Expiry)
  {
    id: "s-004-L",
    patient_id: "p-004",
    unit: "Unit 1",
    laterality: "Left",
    material: "Regular",
    insertion_date: format(subDays(new Date(), 78), "yyyy-MM-dd"),
    planned_removal_date: format(addDays(new Date(), 12), "yyyy-MM-dd"),
    status: "Active",
    residual_stone: true,
    inserted_by: "Prof. N. Muthulatha (Unit 1)",
    created_at: format(subDays(new Date(), 78), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  // 4B. Priya Velu: Right Side: Silicone 365d Stent (Due in 287 days - Long-term Active)
  {
    id: "s-004-R",
    patient_id: "p-004",
    unit: "Unit 1",
    laterality: "Right",
    material: "Silicone",
    insertion_date: format(subDays(new Date(), 78), "yyyy-MM-dd"),
    planned_removal_date: format(addDays(new Date(), 287), "yyyy-MM-dd"),
    status: "Active",
    residual_stone: false,
    inserted_by: "Prof. N. Muthulatha (Unit 1)",
    created_at: format(subDays(new Date(), 78), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
  // 5. Meenakshi: Silicone Stent, Carbothane 180d, Overdue 100 days (T+90 Overdue category)
  {
    id: "s-005",
    patient_id: "p-005",
    unit: "Unit 2",
    laterality: "Bilateral",
    material: "Carbothane",
    insertion_date: format(subDays(new Date(), 280), "yyyy-MM-dd"),
    planned_removal_date: format(subDays(new Date(), 100), "yyyy-MM-dd"),
    status: "Active",
    residual_stone: true,
    inserted_by: "Prof. M. Sivasankar (Unit 2)",
    created_at: format(subDays(new Date(), 280), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
  },
];

const mockCallLogs: CallLog[] = [
  {
    id: "c-001",
    stent_id: "s-002",
    patient_id: "p-002",
    outcome: "Patient not answering",
    notes: "Tried calling 2 times at 10:30 AM. Phone rang completely.",
    logged_by: "Sister Revathi (Technician)",
    created_at: format(subDays(new Date(), 1), "yyyy-MM-dd'T'10:30:00.000xxx"),
  },
];

const mockNotificationLogs: NotificationLog[] = [
  {
    id: "n-001",
    stent_id: "s-003",
    patient_id: "p-003",
    trigger_type: "T-0",
    recipient_phone: "9444112233",
    message_body: "URGENT REMINDER: Dear Annamalai S, your DJ stent removal is scheduled for TODAY...",
    status: "SENT",
    sent_at: format(new Date(), "yyyy-MM-dd'T'08:00:00.000xxx"),
  },
];

function enrichStent(stent: Stent, patient?: Patient, allStents?: Stent[]): Stent {
  const urgency = getUrgencyInfo(stent.planned_removal_date, stent.status);
  
  // Check if patient has an active stent on the other side
  let hasOtherSide = false;
  if (allStents && stent.status === "Active") {
    if (stent.laterality === "Left") {
      hasOtherSide = allStents.some(
        (s) => s.patient_id === stent.patient_id && s.id !== stent.id && s.laterality === "Right" && s.status === "Active"
      );
    } else if (stent.laterality === "Right") {
      hasOtherSide = allStents.some(
        (s) => s.patient_id === stent.patient_id && s.id !== stent.id && s.laterality === "Left" && s.status === "Active"
      );
    }
  }

  return {
    ...stent,
    patient,
    days_remaining: urgency.daysRemaining,
    urgency_level: urgency.level,
    urgency_badge: urgency.badge,
    has_other_side_active: hasOtherSide,
  };
}

// ==========================================
// DB SERVICE METHODS
// ==========================================

export async function getPatients(): Promise<Patient[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) return data as Patient[];
  }
  return [...mockPatients];
}

export async function getPatientByUHID(uhid: string): Promise<Patient | null> {
  const normalizedUhid = uhid.trim().toUpperCase();
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .ilike("uhid", normalizedUhid)
      .maybeSingle();
    if (!error && data) return data as Patient;
  }
  return mockPatients.find((p) => p.uhid.toUpperCase() === normalizedUhid) || null;
}

export async function checkActiveStentDuplicate(
  uhid: string,
  laterality: string
): Promise<{ hasDuplicate: boolean; activeStents: Stent[]; existingPatient: Patient | null }> {
  const patient = await getPatientByUHID(uhid);
  if (!patient) {
    return { hasDuplicate: false, activeStents: [], existingPatient: null };
  }

  let activeStents: Stent[] = [];
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("stents")
      .select("*")
      .eq("patient_id", patient.id)
      .eq("status", "Active");
    if (!error && data) {
      activeStents = data as Stent[];
    }
  } else {
    activeStents = mockStents.filter(
      (s) => s.patient_id === patient.id && s.status === "Active"
    );
  }

  // Duplicate logic:
  // If user is adding "Left", duplicate only if patient already has active "Left" or "Bilateral"
  // If user is adding "Right", duplicate only if patient already has active "Right" or "Bilateral"
  // If user is adding "Bilateral", duplicate if patient already has ANY active stent
  let duplicate = false;
  if (laterality === "Bilateral" || laterality === "DUAL_BILATERAL") {
    duplicate = activeStents.length > 0;
  } else if (laterality === "Left") {
    duplicate = activeStents.some((s) => s.laterality === "Left" || s.laterality === "Bilateral");
  } else if (laterality === "Right") {
    duplicate = activeStents.some((s) => s.laterality === "Right" || s.laterality === "Bilateral");
  }

  return {
    hasDuplicate: duplicate,
    activeStents: activeStents.map((s) => enrichStent(s, patient, activeStents)),
    existingPatient: patient,
  };
}

export async function getStents(filters?: {
  status?: string;
  unit?: string;
  laterality?: string;
  search?: string;
  urgency?: string;
}): Promise<Stent[]> {
  let stents: Stent[] = [];
  let patients: Patient[] = [];

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("stents").select("*, patient:patients(*)");
    if (filters?.status && filters.status !== "ALL") {
      query = query.eq("status", filters.status);
    }
    if (filters?.unit && filters.unit !== "ALL") {
      query = query.eq("unit", filters.unit);
    }
    if (filters?.laterality && filters.laterality !== "ALL") {
      query = query.eq("laterality", filters.laterality);
    }

    const { data, error } = await query;
    if (!error && data) {
      stents = data.map((item: any) => enrichStent(item, item.patient, data));
    }
  } else {
    patients = mockPatients;
    let list = mockStents.map((s) => {
      const p = patients.find((pat) => pat.id === s.patient_id);
      return enrichStent(s, p, mockStents);
    });

    if (filters?.status && filters.status !== "ALL") {
      list = list.filter((s) => s.status === filters.status);
    }
    if (filters?.unit && filters.unit !== "ALL") {
      list = list.filter((s) => s.unit === filters.unit);
    }
    if (filters?.laterality && filters.laterality !== "ALL") {
      list = list.filter((s) => s.laterality === filters.laterality);
    }

    stents = list;
  }

  // Search filter
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    stents = stents.filter(
      (s) =>
        s.patient?.name.toLowerCase().includes(q) ||
        s.patient?.uhid.toLowerCase().includes(q) ||
        s.patient?.phone.includes(q) ||
        s.inserted_by.toLowerCase().includes(q)
    );
  }

  // Urgency filter
  if (filters?.urgency && filters.urgency !== "ALL") {
    stents = stents.filter((s) => s.urgency_level === filters.urgency);
  }

  // Apply Bilateral Priority & Urgency Sorting (earliest remaining days first)
  return sortStentsByUrgency(stents);
}

export async function getStentById(id: string): Promise<Stent | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("stents")
      .select("*, patient:patients(*)")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      return enrichStent(data, data.patient);
    }
  }

  const stent = mockStents.find((s) => s.id === id);
  if (!stent) return null;
  const patient = mockPatients.find((p) => p.id === stent.patient_id);
  return enrichStent(stent, patient, mockStents);
}

export async function registerPatientAndStent(
  input: StentRegistrationInput
): Promise<{ patient: Patient; stent: Stent; secondaryStent?: Stent }> {
  const normalizedUhid = input.uhid.trim().toUpperCase();

  // Handle Dual Material Registration (Different materials on Left & Right)
  if (input.is_dual_material) {
    const leftPlanned =
      input.left_planned_removal_date ||
      calculatePlannedRemovalDate(input.left_insertion_date || input.insertion_date, input.left_material || "Regular");
    const rightPlanned =
      input.right_planned_removal_date ||
      calculatePlannedRemovalDate(input.right_insertion_date || input.insertion_date, input.right_material || "Silicone");

    if (isSupabaseConfigured && supabase) {
      // 1. Upsert Patient
      const { data: patientData, error: pError } = await supabase
        .from("patients")
        .upsert(
          {
            uhid: normalizedUhid,
            name: input.name.trim(),
            phone: input.phone.trim(),
            address: input.address?.trim() || null,
            second_language: input.second_language,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "uhid" }
        )
        .select()
        .single();

      if (pError || !patientData) {
        throw new Error(`Failed to save patient: ${pError?.message}`);
      }

      // 2. Insert Left Stent
      const { data: leftData, error: leftErr } = await supabase
        .from("stents")
        .insert({
          patient_id: patientData.id,
          unit: input.unit,
          laterality: "Left",
          material: input.left_material || "Regular",
          insertion_date: input.left_insertion_date || input.insertion_date,
          planned_removal_date: leftPlanned,
          status: "Active",
          residual_stone: Boolean(input.left_residual_stone),
          inserted_by: input.inserted_by.trim(),
          notes: input.notes?.trim() || null,
        })
        .select()
        .single();

      // 3. Insert Right Stent
      const { data: rightData, error: rightErr } = await supabase
        .from("stents")
        .insert({
          patient_id: patientData.id,
          unit: input.unit,
          laterality: "Right",
          material: input.right_material || "Silicone",
          insertion_date: input.right_insertion_date || input.insertion_date,
          planned_removal_date: rightPlanned,
          status: "Active",
          residual_stone: Boolean(input.right_residual_stone),
          inserted_by: input.inserted_by.trim(),
          notes: input.notes?.trim() || null,
        })
        .select()
        .single();

      return {
        patient: patientData as Patient,
        stent: enrichStent(leftData as Stent, patientData as Patient),
        secondaryStent: enrichStent(rightData as Stent, patientData as Patient),
      };
    }

    // Local Fallback
    let patient = mockPatients.find((p) => p.uhid.toUpperCase() === normalizedUhid);
    if (!patient) {
      patient = {
        id: `p-${Date.now()}`,
        uhid: normalizedUhid,
        name: input.name.trim(),
        phone: input.phone.trim(),
        address: input.address?.trim(),
        second_language: input.second_language,
        created_at: new Date().toISOString(),
      };
      mockPatients.unshift(patient);
    }

    const leftStent: Stent = {
      id: `s-L-${Date.now()}`,
      patient_id: patient.id,
      unit: input.unit,
      laterality: "Left",
      material: input.left_material || "Regular",
      insertion_date: input.left_insertion_date || input.insertion_date,
      planned_removal_date: leftPlanned,
      status: "Active",
      residual_stone: Boolean(input.left_residual_stone),
      inserted_by: input.inserted_by.trim(),
      notes: input.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const rightStent: Stent = {
      id: `s-R-${Date.now() + 1}`,
      patient_id: patient.id,
      unit: input.unit,
      laterality: "Right",
      material: input.right_material || "Silicone",
      insertion_date: input.right_insertion_date || input.insertion_date,
      planned_removal_date: rightPlanned,
      status: "Active",
      residual_stone: Boolean(input.right_residual_stone),
      inserted_by: input.inserted_by.trim(),
      notes: input.notes?.trim() || null,
      created_at: new Date().toISOString(),
    };

    mockStents.unshift(rightStent);
    mockStents.unshift(leftStent);

    return {
      patient,
      stent: enrichStent(leftStent, patient, mockStents),
      secondaryStent: enrichStent(rightStent, patient, mockStents),
    };
  }

  // Single Stent (or regular bilateral same-material)
  const plannedRemoval =
    input.planned_removal_date ||
    calculatePlannedRemovalDate(input.insertion_date, input.material);

  if (isSupabaseConfigured && supabase) {
    const { data: patientData, error: pError } = await supabase
      .from("patients")
      .upsert(
        {
          uhid: normalizedUhid,
          name: input.name.trim(),
          phone: input.phone.trim(),
          address: input.address?.trim() || null,
          second_language: input.second_language,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "uhid" }
      )
      .select()
      .single();

    if (pError || !patientData) {
      throw new Error(`Failed to save patient: ${pError?.message}`);
    }

    const { data: stentData, error: sError } = await supabase
      .from("stents")
      .insert({
        patient_id: patientData.id,
        unit: input.unit,
        laterality: input.laterality,
        material: input.material,
        insertion_date: input.insertion_date,
        planned_removal_date: plannedRemoval,
        status: "Active",
        residual_stone: input.residual_stone,
        inserted_by: input.inserted_by.trim(),
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (sError || !stentData) {
      throw new Error(`Failed to insert stent: ${sError?.message}`);
    }

    return {
      patient: patientData as Patient,
      stent: enrichStent(stentData as Stent, patientData as Patient),
    };
  }

  // Local Fallback
  let patient = mockPatients.find((p) => p.uhid.toUpperCase() === normalizedUhid);
  if (!patient) {
    patient = {
      id: `p-${Date.now()}`,
      uhid: normalizedUhid,
      name: input.name.trim(),
      phone: input.phone.trim(),
      address: input.address?.trim(),
      second_language: input.second_language,
      created_at: new Date().toISOString(),
    };
    mockPatients.unshift(patient);
  } else {
    patient.name = input.name.trim();
    patient.phone = input.phone.trim();
    patient.address = input.address?.trim();
    patient.second_language = input.second_language;
  }

  const newStent: Stent = {
    id: `s-${Date.now()}`,
    patient_id: patient.id,
    unit: input.unit,
    laterality: input.laterality,
    material: input.material,
    insertion_date: input.insertion_date,
    planned_removal_date: plannedRemoval,
    status: "Active",
    residual_stone: input.residual_stone,
    inserted_by: input.inserted_by.trim(),
    notes: input.notes?.trim() || null,
    created_at: new Date().toISOString(),
  };

  mockStents.unshift(newStent);
  return { patient, stent: enrichStent(newStent, patient, mockStents) };
}

/**
 * Exchange Rule:
 * 1. Mark existing stent as 'Exchanged', set removal_date to current date, archive it.
 * 2. Create a new active stent row referencing old stent via exchanged_from_id, resetting the clock for that specific stent/side.
 */
export async function exchangeStent(
  input: ExchangeStentInput
): Promise<{ oldStent: Stent; newStent: Stent }> {
  const plannedRemoval =
    input.planned_removal_date ||
    calculatePlannedRemovalDate(input.insertion_date, input.material);
  const nowIso = new Date().toISOString();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  if (isSupabaseConfigured && supabase) {
    const { data: oldStentData, error: oldError } = await supabase
      .from("stents")
      .update({
        status: "Exchanged",
        removal_date: todayStr,
        updated_at: nowIso,
      })
      .eq("id", input.old_stent_id)
      .select("*, patient:patients(*)")
      .single();

    if (oldError || !oldStentData) {
      throw new Error(`Failed to archive exchanged stent: ${oldError?.message}`);
    }

    const { data: newStentData, error: newError } = await supabase
      .from("stents")
      .insert({
        patient_id: oldStentData.patient_id,
        unit: input.unit,
        laterality: input.laterality,
        material: input.material,
        insertion_date: input.insertion_date,
        planned_removal_date: plannedRemoval,
        status: "Active",
        residual_stone: input.residual_stone,
        inserted_by: input.inserted_by.trim(),
        exchanged_from_id: input.old_stent_id,
        notes: input.notes?.trim() || null,
      })
      .select("*, patient:patients(*)")
      .single();

    if (newError || !newStentData) {
      throw new Error(`Failed to insert exchanged stent: ${newError?.message}`);
    }

    return {
      oldStent: enrichStent(oldStentData as Stent, oldStentData.patient),
      newStent: enrichStent(newStentData as Stent, newStentData.patient),
    };
  }

  // Local fallback
  const oldStent = mockStents.find((s) => s.id === input.old_stent_id);
  if (!oldStent) throw new Error("Stent not found for exchange");

  oldStent.status = "Exchanged";
  oldStent.removal_date = todayStr;
  oldStent.updated_at = nowIso;

  const patient = mockPatients.find((p) => p.id === oldStent.patient_id);

  const newStent: Stent = {
    id: `s-${Date.now()}`,
    patient_id: oldStent.patient_id,
    unit: input.unit,
    laterality: input.laterality,
    material: input.material,
    insertion_date: input.insertion_date,
    planned_removal_date: plannedRemoval,
    status: "Active",
    residual_stone: input.residual_stone,
    inserted_by: input.inserted_by.trim(),
    exchanged_from_id: input.old_stent_id,
    notes: input.notes?.trim() || null,
    created_at: nowIso,
  };

  mockStents.unshift(newStent);
  return {
    oldStent: enrichStent(oldStent, patient, mockStents),
    newStent: enrichStent(newStent, patient, mockStents),
  };
}

/**
 * Marks a specific stent as Removed. If the patient has another stent in the other kidney,
 * that stent remains untouched and Active!
 */
export async function removeStent(
  stentId: string,
  removalDate?: string,
  notes?: string
): Promise<Stent> {
  const finalRemovalDate = removalDate || format(new Date(), "yyyy-MM-dd");
  const nowIso = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("stents")
      .update({
        status: "Removed",
        removal_date: finalRemovalDate,
        notes: notes || undefined,
        updated_at: nowIso,
      })
      .eq("id", stentId)
      .select("*, patient:patients(*)")
      .single();

    if (error || !data) {
      throw new Error(`Failed to remove stent: ${error?.message}`);
    }
    return enrichStent(data as Stent, data.patient);
  }

  const stent = mockStents.find((s) => s.id === stentId);
  if (!stent) throw new Error("Stent not found");

  stent.status = "Removed";
  stent.removal_date = finalRemovalDate;
  if (notes) stent.notes = notes;
  stent.updated_at = nowIso;

  const patient = mockPatients.find((p) => p.id === stent.patient_id);
  return enrichStent(stent, patient, mockStents);
}

export async function logCall(
  stentId: string,
  patientId: string,
  outcome: CallOutcome,
  notes: string,
  loggedBy: string = "Technician"
): Promise<CallLog> {
  const newLog: CallLog = {
    id: `c-${Date.now()}`,
    stent_id: stentId,
    patient_id: patientId,
    outcome,
    notes,
    logged_by: loggedBy,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("call_logs")
      .insert({
        stent_id: stentId,
        patient_id: patientId,
        outcome,
        notes,
        logged_by: loggedBy,
      })
      .select()
      .single();

    if (!error && data) return data as CallLog;
  }

  mockCallLogs.unshift(newLog);
  return newLog;
}

export async function getCallLogs(stentId?: string, patientId?: string): Promise<CallLog[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from("call_logs").select("*, patient:patients(name, uhid)");
    if (stentId) query = query.eq("stent_id", stentId);
    if (patientId) query = query.eq("patient_id", patientId);
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data) {
      return data.map((item: any) => ({
        ...item,
        patient_name: item.patient?.name,
        uhid: item.patient?.uhid,
      }));
    }
  }

  let logs = [...mockCallLogs];
  if (stentId) logs = logs.filter((l) => l.stent_id === stentId);
  if (patientId) logs = logs.filter((l) => l.patient_id === patientId);

  return logs.map((l) => {
    const pat = mockPatients.find((p) => p.id === l.patient_id);
    return {
      ...l,
      patient_name: pat?.name,
      uhid: pat?.uhid,
    };
  });
}

export async function logNotification(
  stentId: string,
  patientId: string,
  triggerType: string,
  recipientPhone: string,
  messageBody: string,
  status: "SENT" | "FAILED" | "PENDING",
  errorMessage?: string
): Promise<NotificationLog> {
  const newLog: NotificationLog = {
    id: `n-${Date.now()}`,
    stent_id: stentId,
    patient_id: patientId,
    trigger_type: triggerType,
    recipient_phone: recipientPhone,
    message_body: messageBody,
    status,
    sent_at: new Date().toISOString(),
    error_message: errorMessage,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("notification_logs")
      .insert({
        stent_id: stentId,
        patient_id: patientId,
        trigger_type: triggerType,
        recipient_phone: recipientPhone,
        message_body: messageBody,
        status,
        error_message: errorMessage,
      })
      .select()
      .single();

    if (!error && data) return data as NotificationLog;
  }

  mockNotificationLogs.unshift(newLog);
  return newLog;
}

export async function getNotificationLogs(limit: number = 50): Promise<NotificationLog[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("notification_logs")
      .select("*, patient:patients(name)")
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (!error && data) {
      return data.map((item: any) => ({
        ...item,
        patient_name: item.patient?.name,
      }));
    }
  }

  return mockNotificationLogs.slice(0, limit).map((l) => {
    const pat = mockPatients.find((p) => p.id === l.patient_id);
    return {
      ...l,
      patient_name: pat?.name,
    };
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const stents = await getStents();
  const patients = await getPatients();

  let totalActive = 0;
  let dueToday = 0;
  let overdue = 0;
  let severelyOverdue = 0;
  let removedThisMonth = 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  for (const s of stents) {
    if (s.status === "Active") {
      totalActive++;
      const days = s.days_remaining ?? getDaysRemaining(s.planned_removal_date);
      if (days === 0) {
        dueToday++;
      } else if (days < 0) {
        overdue++;
        if (Math.abs(days) >= 180) {
          severelyOverdue++;
        }
      }
    } else if (s.status === "Removed" && s.removal_date) {
      const rDate = new Date(s.removal_date);
      if (rDate.getMonth() === currentMonth && rDate.getFullYear() === currentYear) {
        removedThisMonth++;
      }
    }
  }

  return {
    totalActive,
    dueToday,
    overdue,
    severelyOverdue,
    removedThisMonth,
    totalPatients: patients.length,
  };
}

export async function getTechnicianQueue(): Promise<Stent[]> {
  const allStents = await getStents({ status: "Active" });
  return allStents.filter((s) => (s.days_remaining ?? getDaysRemaining(s.planned_removal_date)) <= 0);
}