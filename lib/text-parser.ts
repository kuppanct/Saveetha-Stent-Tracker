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
  const defaultProf = unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";

  // Laterality
  let laterality: Laterality = "Right";
  if (/\b(Left|Lt)\b/i.test(content)) laterality = "Left";
  else if (/\b(Bilateral|Both|Bilat)\b/i.test(content)) laterality = "Bilateral";
  else if (/\b(Right|Rt)\b/i.test(content)) laterality = "Right";

  // Stent Material (Unit 1 defaults to Carbothane 180d, Unit 2 defaults to Regular 90d)
  let material: StentMaterial = unit === "Unit 1" ? "Carbothane" : "Regular";
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
 * - FULL NAME -> Patient Name (e.g. "Anitha", "Kumar K")
 * - PATIENT ID -> UHID (e.g. "260826055322", "260826056037")
 * - CONTACT -> Mobile Phone Number (e.g. "9566144061")
 * - GENDER, DOB, BLOOD GROUP
 * - Unit 1 (Prof. N. Muthulatha) defaults material to Carbothane (180 days)
 */
export function parseOCRText(ocrText: string): ParsedStentEntry {
  const text = ocrText || "";
  const rawLines = text.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);

  // 1. Extract Patient ID / UHID
  let uhid = "";
  // Check direct line or regex pattern
  for (const line of rawLines) {
    const pIdMatch = line.match(/(?:PATIENT\s*ID|UHID|HOSPITAL\s*NO|IP\s*NO|MRN|REG\s*NO)[\s.:-]*([0-9A-Za-z-]{6,16})/i);
    if (pIdMatch) {
      uhid = pIdMatch[1].trim();
      break;
    }
  }

  if (!uhid) {
    // Check line after "PATIENT ID"
    const pIdIndex = rawLines.findIndex((l) => /^PATIENT\s*ID/i.test(l));
    if (pIdIndex !== -1 && rawLines[pIdIndex + 1]) {
      const candidate = rawLines[pIdIndex + 1].replace(/[^0-9A-Za-z-]/g, "");
      if (candidate.length >= 6) uhid = candidate;
    }
  }

  // Fallback: look for 10-14 digit sequence (e.g. 260826055322)
  if (!uhid) {
    const rawDigits = text.match(/\b([0-9]{10,14})\b/);
    if (rawDigits) uhid = rawDigits[1];
    else uhid = `SMCH-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  // 2. Extract FULL NAME accurately
  let name = "";

  // Priority A: Check if "FULL NAME" or "PATIENT NAME" is on the same line with the name
  for (const line of rawLines) {
    const nameMatch = line.match(/(?:FULL\s*NAME|PATIENT\s*NAME)[\s.:-]+([A-Za-z\s.]{2,40})/i);
    if (nameMatch) {
      let candidate = nameMatch[1].trim();
      // Clean candidate of any accidental suffix keywords
      candidate = candidate.replace(/\b(PATIENT|ID|ABHA|DATE|GENDER|CONTACT|MALE|FEMALE)\b.*/gi, "").trim();
      if (candidate.length >= 2 && !/^(PATIENT|NAME|ID|ABHA|CONTACT)$/i.test(candidate)) {
        name = candidate;
        break;
      }
    }
  }

  // Priority B: "FULL NAME" is on its own line, check subsequent line
  if (!name) {
    const nameLabelIdx = rawLines.findIndex((l) => /^(FULL\s*NAME|PATIENT\s*NAME)$/i.test(l));
    if (nameLabelIdx !== -1) {
      for (let i = nameLabelIdx + 1; i <= Math.min(nameLabelIdx + 3, rawLines.length - 1); i++) {
        const line = rawLines[i].trim();
        // Ignore lines that are clearly other field labels or dashes
        if (/^(PATIENT\s*ID|ABHA|DATE|GENDER|BLOOD|CONTACT|MEDICAL|WALLET|PROFILE|-|—)$/i.test(line)) {
          continue;
        }
        if (/^[A-Za-z\s.]{2,40}$/.test(line)) {
          name = line;
          break;
        }
      }
    }
  }

  // Priority C: Look for a clean Name right before the UHID or at top of card
  if (!name) {
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (
        /^[A-Z][a-zA-Z\s.]{2,30}$/.test(line) &&
        !/^(FULL|NAME|PATIENT|ID|ABHA|NUMBER|ADDRESS|DATE|BIRTH|MEDICAL|CONTACT|GENDER|FEMALE|MALE|BLOOD|GROUP|PROFILE|WALLET|SAVEETHA|HOSPITAL)$/i.test(line)
      ) {
        name = line;
        break;
      }
    }
  }

  if (!name) name = "Patient";

  // 3. Extract CONTACT / Phone Number
  let phone = "";
  for (const line of rawLines) {
    const contactMatch = line.match(/(?:CONTACT|PHONE|MOBILE|CELL)[\s.:-]*([6-9]\d{9})/i);
    if (contactMatch) {
      phone = contactMatch[1];
      break;
    }
  }

  if (!phone) {
    const contactIdx = rawLines.findIndex((l) => /^CONTACT/i.test(l));
    if (contactIdx !== -1 && rawLines[contactIdx + 1]) {
      const candidate = rawLines[contactIdx + 1].replace(/\D/g, "");
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
  if (/FEMALE/i.test(text)) gender = "Female";
  else if (/MALE/i.test(text)) gender = "Male";

  let dob = "";
  const dobMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (dobMatch) dob = dobMatch[1];

  let blood_group = "";
  const bgMatch = text.match(/\b(A|B|AB|O)[+-]\b/i);
  if (bgMatch) blood_group = bgMatch[0].toUpperCase();

  // 5. Extract Residential / ABHA Address
  let address = "";
  for (const line of rawLines) {
    const addrMatch = line.match(/(?:RESIDENTIAL\s*ADDRESS|ABHA\s*ADDRESS|ADDRESS|RESIDENCE|ADDR)[\s.:-]+([^\r\n]{4,})/i);
    if (addrMatch) {
      const cand = addrMatch[1].trim();
      if (cand && !/^[-—–.]$/.test(cand) && !/^(MALE|FEMALE|DATE|GENDER|CONTACT)$/i.test(cand)) {
        address = cand;
        break;
      }
    }
  }

  if (!address) {
    const addrIdx = rawLines.findIndex((l) => /^(RESIDENTIAL\s*ADDRESS|ABHA\s*ADDRESS|ADDRESS)$/i.test(l));
    if (addrIdx !== -1 && rawLines[addrIdx + 1]) {
      const cand = rawLines[addrIdx + 1].trim();
      if (cand && !/^[-—–.]$/.test(cand) && !/^(MALE|FEMALE|DATE|GENDER|CONTACT|MEDICAL)$/i.test(cand)) {
        address = cand;
      }
    }
  }

  // 6. Default Unit to Unit 1 (Prof. N. Muthulatha)
  const unit: UnitType = /unit\s*2|sivasankar/i.test(text) ? "Unit 2" : "Unit 1";
  const defaultSurgeon = unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";

  // 6. Stent side & material defaults:
  // USER REQUEST: For Unit 1, default material to Carbothane (180 days) to reduce time taken!
  let laterality: Laterality = "Right";
  if (/\b(Left|Lt)\b/i.test(text)) laterality = "Left";
  else if (/\b(Bilateral|Both)\b/i.test(text)) laterality = "Bilateral";

  let material: StentMaterial = unit === "Unit 1" ? "Carbothane" : "Regular";
  if (/\b(Silicone|Silicon)\b/i.test(text)) material = "Silicone";
  else if (/\b(Regular|Polyurethane|PU)\b/i.test(text)) material = "Regular";
  else if (/\b(Carbothane|Carbo)\b/i.test(text)) material = "Carbothane";

  const today = format(new Date(), "yyyy-MM-dd");
  const planned_removal_date = calculatePlannedRemovalDate(today, material);

  return {
    uhid,
    name,
    phone,
    address,
    gender,
    dob,
    blood_group,
    second_language: "Tamil",
    unit,
    laterality,
    material,
    insertion_date: today,
    planned_removal_date,
    residual_stone: false,
    inserted_by: defaultSurgeon,
    indication: "Urology Stenting",
    notes: `Viana EMR Extraction. ${gender ? `Gender: ${gender}. ` : ""}${dob ? `DOB: ${dob}. ` : ""}${blood_group ? `Blood Group: ${blood_group}` : ""}`,
    confidence: 0.95,
    raw_text: ocrText,
  };
}
