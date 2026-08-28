import { Laterality, StentMaterial, UnitType, SecondLanguage } from "./types";
import { calculatePlannedRemovalDate } from "./stent-calculator";
import { format } from "date-fns";

export interface ParsedStentEntry {
  uhid: string;
  name: string;
  phone: string;
  gender?: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  second_language: SecondLanguage;
  unit: UnitType;
  laterality: Laterality;
  material: StentMaterial;
  insertion_date: string;
  planned_removal_date: string;
  residual_stone: boolean;
  inserted_by: string;
  indication?: string;
  notes?: string;
  confidence?: number;
  raw_text?: string;
}

/**
 * Parses resident WhatsApp / Telegram bot structured syntax:
 * Example: #STENT 12345678 Ravi Kumar 9876543210 Right Regular RIRS Residual:Yes Unit1
 */
export function parseBotSyntax(message: string): { success: boolean; data?: ParsedStentEntry; error?: string } {
  const clean = message.trim();
  if (!clean.toUpperCase().startsWith("#STENT") && !clean.toUpperCase().startsWith("/STENT") && !clean.toUpperCase().startsWith("#DJ")) {
    return { success: false, error: "Message must start with #STENT or /STENT" };
  }

  // Remove command prefix
  const content = clean.replace(/^(#STENT|\/STENT|#DJ)\s+/i, "").trim();

  // Residual Stone
  const residualMatch = content.match(/Residual\s*:\s*(Yes|No|True|False|1|0)/i);
  const residual_stone = residualMatch ? /^(Yes|True|1)$/i.test(residualMatch[1]) : false;

  // Unit & Professor
  const unitMatch = content.match(/Unit\s*([12])/i);
  const unit: UnitType = unitMatch && unitMatch[1] === "2" ? "Unit 2" : "Unit 1";
  const defaultProf = unit === "Unit 2" ? "Prof. M. Sivasankar" : "Prof. N. Muthulatha";

  // Laterality
  let laterality: Laterality = "Right";
  if (/\b(Left|Lt)\b/i.test(content)) laterality = "Left";
  else if (/\b(Bilateral|Both|Bilat)\b/i.test(content)) laterality = "Bilateral";
  else if (/\b(Right|Rt)\b/i.test(content)) laterality = "Right";

  // Stent Material
  let material: StentMaterial = "Regular";
  if (/\b(Silicone|Silicon)\b/i.test(content)) material = "Silicone";
  else if (/\b(Carbothane|Carbo)\b/i.test(content)) material = "Carbothane";
  else if (/\b(Regular|Polyurethane|PU|Standard)\b/i.test(content)) material = "Regular";

  // Phone (10 digits)
  const phoneMatch = content.match(/\b([6-9]\d{9})\b/);
  const phone = phoneMatch ? phoneMatch[1] : "9840123456";

  // UHID
  const uhidMatch = content.match(/\b(SMCH[-\d]+|\d{6,14})\b/i);
  const uhid = uhidMatch ? uhidMatch[1].toUpperCase() : `SMCH-${Math.floor(100000 + Math.random() * 900000)}`;

  // Indication
  const indicationMatch = content.match(/\b(RIRS|URSL|PCNL|ESWL|Pyeloplasty|Stricture|Transplant|Calculus|Ureteric Stone)\b/i);
  const indication = indicationMatch ? indicationMatch[1].toUpperCase() : "Urology Procedure";

  // Remaining tokens for patient name
  let nameStr = content
    .replace(/^(#STENT|\/STENT|#DJ)/i, "")
    .replace(/Residual\s*:\s*(Yes|No|True|False|1|0)/i, "")
    .replace(/Unit\s*[12]/i, "")
    .replace(/\b(Left|Right|Bilateral|Lt|Rt|Bilat)\b/gi, "")
    .replace(/\b(Regular|Carbothane|Silicone|Polyurethane|PU|Standard)\b/gi, "")
    .replace(/\b(RIRS|URSL|PCNL|ESWL|Pyeloplasty|Stricture|Transplant)\b/gi, "")
    .replace(/\b[6-9]\d{9}\b/g, "")
    .replace(/\b(SMCH[-\d]+|\d{6,14})\b/gi, "")
    .trim();

  nameStr = nameStr.replace(/[^a-zA-Z\s]/g, " ").replace(/\s+/g, " ").trim();
  const name = nameStr.length > 2 ? nameStr : "Patient";

  const today = format(new Date(), "yyyy-MM-dd");
  const plannedRemoval = calculatePlannedRemovalDate(today, material);

  return {
    success: true,
    data: {
      uhid,
      name,
      phone,
      second_language: "Tamil",
      unit,
      laterality,
      material,
      insertion_date: today,
      planned_removal_date: plannedRemoval,
      residual_stone,
      inserted_by: defaultProf,
      indication,
      notes: `Ingested via OT Bot. Indication: ${indication}`,
      raw_text: message,
    },
  };
}

/**
 * Intelligent OCR Text Parser:
 * Specially tuned for Saveetha / Viana Health Patient Profile modal cards:
 * - FULL NAME -> Patient Name
 * - PATIENT ID -> UHID (e.g. 260826056037)
 * - CONTACT -> Mobile Phone Number (e.g. 6374989972)
 * - GENDER, DOB, BLOOD GROUP
 */
export function parseOCRText(ocrText: string): ParsedStentEntry {
  const text = ocrText || "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Extract Patient ID / UHID
  let uhid = "";
  // Look for PATIENT ID followed by number or on next line
  const patientIdRegex = /(?:PATIENT\s*ID|UHID|HOSPITAL\s*NO|IP\s*NO|MRN|REG\s*NO)[\s.:-]*([0-9A-Za-z-]{6,16})/i;
  const patientIdMatch = text.match(patientIdRegex);
  
  if (patientIdMatch) {
    uhid = patientIdMatch[1].trim();
  } else {
    // Look for lines containing "PATIENT ID" and check next line for numbers
    const pIdIndex = lines.findIndex((l) => /PATIENT\s*ID/i.test(l));
    if (pIdIndex !== -1 && lines[pIdIndex + 1]) {
      const candidate = lines[pIdIndex + 1].replace(/[^0-9A-Za-z-]/g, "");
      if (candidate.length >= 6) uhid = candidate;
    }
  }

  // Fallback: look for 10-12 digit sequence
  if (!uhid) {
    const rawDigits = text.match(/\b([0-9]{10,14})\b/);
    if (rawDigits) uhid = rawDigits[1];
    else uhid = `SMCH-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  // 2. Extract FULL NAME
  let name = "";
  const fullNameRegex = /(?:FULL\s*NAME|PATIENT\s*NAME|NAME)[\s.:-]*([A-Za-z\s.]{2,30})/i;
  const fullNameMatch = text.match(fullNameRegex);

  if (fullNameMatch && fullNameMatch[1].trim().length > 1 && !/PATIENT|CONTACT|GENDER|ABHA/i.test(fullNameMatch[1])) {
    name = fullNameMatch[1].trim();
  } else {
    // Check line after FULL NAME
    const nameIndex = lines.findIndex((l) => /FULL\s*NAME/i.test(l));
    if (nameIndex !== -1 && lines[nameIndex + 1]) {
      const candidate = lines[nameIndex + 1].trim();
      if (/^[A-Za-z\s.]+$/.test(candidate) && !/PATIENT|ID|CONTACT|ABHA/i.test(candidate)) {
        name = candidate;
      }
    }
  }

  // Fallback: Header name if visible
  if (!name || name.length < 2) {
    const candidateName = lines.find((l) => /^[A-Z][a-z]+(\s+[A-Z][a-z]*)*$/.test(l) && !/information|insurance|transactions|contact|patient|close|profile/i.test(l));
    name = candidateName || "Patient";
  }

  // 3. Extract CONTACT / Phone Number
  let phone = "";
  const contactRegex = /(?:CONTACT|PHONE|MOBILE|CELL)[\s.:-]*([6-9]\d{9})/i;
  const contactMatch = text.match(contactRegex);

  if (contactMatch) {
    phone = contactMatch[1];
  } else {
    // Check line after CONTACT
    const contactIndex = lines.findIndex((l) => /CONTACT/i.test(l));
    if (contactIndex !== -1 && lines[contactIndex + 1]) {
      const candidate = lines[contactIndex + 1].replace(/\D/g, "");
      if (candidate.length === 10) phone = candidate;
    }
  }

  // Generic 10 digit search starting with 6-9
  if (!phone) {
    const rawPhones = text.match(/\b([6-9]\d{9})\b/g);
    if (rawPhones && rawPhones.length > 0) {
      phone = rawPhones[0];
    } else {
      phone = "9840123456";
    }
  }

  // 4. Extract Gender, DOB, Blood Group if present
  let gender = "";
  if (/MALE/i.test(text)) gender = "Male";
  else if (/FEMALE/i.test(text)) gender = "Female";

  let dob = "";
  const dobMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dobMatch) dob = dobMatch[1];

  let blood_group = "";
  const bgMatch = text.match(/\b(A|B|AB|O)[+-]\b/i);
  if (bgMatch) blood_group = bgMatch[0].toUpperCase();

  // 5. Default Unit to Unit 1 (Prof. N. Muthulatha)
  const unit: UnitType = /unit\s*2|sivasankar/i.test(text) ? "Unit 2" : "Unit 1";
  const defaultSurgeon = unit === "Unit 2" ? "Prof. M. Sivasankar" : "Prof. N. Muthulatha";

  // 6. Stent side & material defaults (User / Resident completes in verification card)
  let laterality: Laterality = "Right";
  if (/\b(Left|Lt)\b/i.test(text)) laterality = "Left";
  else if (/\b(Bilateral|Both)\b/i.test(text)) laterality = "Bilateral";

  let material: StentMaterial = "Regular";
  if (/silicone|silicon/i.test(text)) material = "Silicone";
  else if (/carbothane|carbo/i.test(text)) material = "Carbothane";

  const today = format(new Date(), "yyyy-MM-dd");
  const plannedRemoval = calculatePlannedRemovalDate(today, material);

  return {
    uhid,
    name,
    phone,
    gender,
    dob,
    blood_group,
    second_language: "Tamil",
    unit,
    laterality,
    material,
    insertion_date: today,
    planned_removal_date: plannedRemoval,
    residual_stone: false,
    inserted_by: defaultSurgeon,
    indication: "Urology Stenting",
    notes: `Extracted from Patient Card. Demographics parsed from EMR screenshot.`,
    raw_text: text,
  };
}
