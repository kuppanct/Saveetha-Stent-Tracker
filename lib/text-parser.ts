import { Laterality, StentMaterial, UnitType, SecondLanguage } from "./types";
import { calculatePlannedRemovalDate } from "./stent-calculator";
import { format } from "date-fns";

export interface ParsedStentEntry {
  uhid: string;
  name: string;
  phone: string;
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

  // Extract key-value pairs if present or token sequence
  // Residual Stone
  const residualMatch = content.match(/Residual\s*:\s*(Yes|No|True|False|1|0)/i);
  const residual_stone = residualMatch ? /^(Yes|True|1)$/i.test(residualMatch[1]) : false;

  // Unit
  const unitMatch = content.match(/Unit\s*([12])/i);
  const unit: UnitType = unitMatch && unitMatch[1] === "2" ? "Unit 2" : "Unit 1";

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
  const uhidMatch = content.match(/\b(SMCH[-\d]+|\d{6,10})\b/i);
  const uhid = uhidMatch ? uhidMatch[1].toUpperCase() : `SMCH-${Math.floor(100000 + Math.random() * 900000)}`;

  // Indication
  const indicationMatch = content.match(/\b(RIRS|URSL|PCNL|ESWL|Pyeloplasty|Stricture|Transplant|Calculus|Ureteric Stone)\b/i);
  const indication = indicationMatch ? indicationMatch[1].toUpperCase() : "Urology Procedure";

  // Remaining tokens for patient name
  // Remove known tokens from string to isolate the patient name
  let nameStr = content
    .replace(/^(#STENT|\/STENT|#DJ)/i, "")
    .replace(/Residual\s*:\s*(Yes|No|True|False|1|0)/i, "")
    .replace(/Unit\s*[12]/i, "")
    .replace(/\b(Left|Right|Bilateral|Lt|Rt|Bilat)\b/gi, "")
    .replace(/\b(Regular|Carbothane|Silicone|Polyurethane|PU|Standard)\b/gi, "")
    .replace(/\b(RIRS|URSL|PCNL|ESWL|Pyeloplasty|Stricture|Transplant)\b/gi, "")
    .replace(/\b[6-9]\d{9}\b/g, "")
    .replace(/\b(SMCH[-\d]+|\d{6,10})\b/gi, "")
    .trim();

  // Clean extra punctuation and spaces
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
      inserted_by: "Dr. Saveetha Urology Team",
      indication,
      notes: `Ingested via OT Bot. Indication: ${indication}`,
      raw_text: message,
    },
  };
}

/**
 * Intelligent OCR Text Parser:
 * Extracts patient demographics, side, material, and procedure from photo OCR of
 * Viana Health OT notes, monitor screens, or handwritten OT register logbooks.
 */
export function parseOCRText(ocrText: string): ParsedStentEntry {
  const text = ocrText || "";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. UHID / Hospital No
  let uhid = "";
  const uhidMatch = text.match(/(?:UHID|IP|OP|HOSP|REG|MRN|NO)[.:\s-]*([A-Z0-9/-]{5,15})/i) ||
    text.match(/\b(SMCH[-\d]+|\d{6,10})\b/i);
  if (uhidMatch) {
    uhid = uhidMatch[1].replace(/[^A-Za-z0-9-]/g, "").toUpperCase();
  } else {
    uhid = `SMCH-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  // 2. Patient Name
  let name = "";
  const nameMatch = text.match(/(?:NAME|PATIENT|PT\s*NAME)[.:\s-]*([A-Za-z\s.]{3,30})/i);
  if (nameMatch) {
    name = nameMatch[1].trim();
  } else {
    // Fallback: look for clean alphabet line
    const potentialName = lines.find((l) => /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(l) && !/hospital|saveetha|urology|doctor/i.test(l));
    name = potentialName || "Patient (Review Name)";
  }

  // 3. Phone Number
  let phone = "9840123456";
  const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
  if (phoneMatch) {
    phone = phoneMatch[1];
  }

  // 4. Laterality
  let laterality: Laterality = "Right";
  if (/\b(Left|Lt|Left Kidney)\b/i.test(text)) {
    laterality = "Left";
  } else if (/\b(Bilateral|Both|Bilat)\b/i.test(text)) {
    laterality = "Bilateral";
  } else if (/\b(Right|Rt|Right Kidney)\b/i.test(text)) {
    laterality = "Right";
  }

  // 5. Stent Material
  let material: StentMaterial = "Regular";
  if (/silicone|silicon/i.test(text)) {
    material = "Silicone";
  } else if (/carbothane|carbo/i.test(text)) {
    material = "Carbothane";
  } else {
    material = "Regular";
  }

  // 6. Residual Stone
  const residual_stone = /residual\s*(?:stone|calculus)?\s*(?:yes|present|\+ve|true)/i.test(text) ||
    /stone\s*in\s*situ/i.test(text);

  // 7. Indication & Procedure
  let indication = "Urology Stenting";
  const indMatch = text.match(/\b(URSL|PCNL|RIRS|ESWL|Pyeloplasty|Stricture|Transplant|Calculus|Ureteroscopy)\b/i);
  if (indMatch) {
    indication = indMatch[1].toUpperCase();
  }

  // 8. Unit
  const unit: UnitType = /unit\s*2/i.test(text) ? "Unit 2" : "Unit 1";

  // 9. Surgeon
  let inserted_by = "Dr. Arunkumar MS, MCh (Uro)";
  const surgeonMatch = text.match(/(?:Dr\.?|Surgeon|Operator)[.:\s-]*([A-Za-z\s.]+)/i);
  if (surgeonMatch) {
    inserted_by = `Dr. ${surgeonMatch[1].trim()}`;
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const plannedRemoval = calculatePlannedRemovalDate(today, material);

  return {
    uhid,
    name,
    phone,
    second_language: /hindi/i.test(text) ? "Hindi" : "Tamil",
    unit,
    laterality,
    material,
    insertion_date: today,
    planned_removal_date: plannedRemoval,
    residual_stone,
    inserted_by,
    indication,
    notes: `Extracted via Camera OCR (Viana/OT Register). Procedure: ${indication}`,
    raw_text: ocrText,
  };
}
