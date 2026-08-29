import { Laterality, StentMaterial, UnitType, UROLOGY_SURGEONS } from "./types";
import { calculatePlannedRemovalDate } from "./stent-calculator";
import { format } from "date-fns";

export interface VoiceParsedStent {
  uhid?: string;
  name?: string;
  phone?: string;
  laterality?: Laterality;
  material?: StentMaterial;
  unit?: UnitType;
  inserted_by?: string;
  residual_stone?: boolean;
  notes?: string;
  is_dual_material?: boolean;
  left_material?: StentMaterial;
  right_material?: StentMaterial;
  raw_transcript: string;
}

/**
 * Natural Medical Speech Parser tuned for OT voice dictation in Urology:
 * Extracts UHID, Names, Side, Material, Surgeon, Unit, Residual Stone & Clinical Notes.
 */
export function parseVoiceDictation(transcript: string): VoiceParsedStent {
  const text = transcript.trim();
  const lower = text.toLowerCase();

  const result: VoiceParsedStent = {
    raw_transcript: text,
  };

  // 1. Laterality
  if (/\b(bilateral|both|bilat)\b/i.test(lower)) {
    result.laterality = "Bilateral";
  } else if (/\b(left|lt)\b/i.test(lower)) {
    result.laterality = "Left";
  } else if (/\b(right|rt)\b/i.test(lower)) {
    result.laterality = "Right";
  }

  // 2. Material
  if (/\b(silicone|silicon|long term)\b/i.test(lower)) {
    result.material = "Silicone";
  } else if (/\b(carbothane|carbo)\b/i.test(lower)) {
    result.material = "Carbothane";
  } else if (/\b(regular|polyurethane|pu|standard|normal)\b/i.test(lower)) {
    result.material = "Regular";
  }

  // Check if bilateral split was spoken (e.g., "Left carbothane right regular")
  if (result.laterality === "Bilateral") {
    if (/left\s+.*?(carbothane|silicone|regular)/i.test(lower) || /right\s+.*?(carbothane|silicone|regular)/i.test(lower)) {
      result.is_dual_material = true;
      if (/left\s+.*?(silicone)/i.test(lower)) result.left_material = "Silicone";
      else if (/left\s+.*?(carbothane)/i.test(lower)) result.left_material = "Carbothane";
      else if (/left\s+.*?(regular)/i.test(lower)) result.left_material = "Regular";

      if (/right\s+.*?(silicone)/i.test(lower)) result.right_material = "Silicone";
      else if (/right\s+.*?(carbothane)/i.test(lower)) result.right_material = "Carbothane";
      else if (/right\s+.*?(regular)/i.test(lower)) result.right_material = "Regular";
    }
  }

  // 3. Urology Unit
  if (/\bunit\s*2\b/i.test(lower) || /\bunit\s*two\b/i.test(lower)) {
    result.unit = "Unit 2";
  } else if (/\bunit\s*1\b/i.test(lower) || /\bunit\s*one\b/i.test(lower)) {
    result.unit = "Unit 1";
  }

  // 4. Operating Surgeon Matching
  for (const surgeon of UROLOGY_SURGEONS) {
    const parts = surgeon.toLowerCase().replace(/^(prof\.|dr\.)\s*/i, "").split(/\s+/);
    const lastName = parts[parts.length - 1];
    if (parts.some((p) => p.length > 3 && lower.includes(p)) || lower.includes(lastName)) {
      result.inserted_by = surgeon;
      if (surgeon.includes("Siva Sankar")) result.unit = "Unit 2";
      if (surgeon.includes("Muthulatha")) result.unit = "Unit 1";
      break;
    }
  }

  // 5. Residual Stone
  if (/\b(no\s+residual|residual\s+stone\s+no|residual\s+stone\s+absent|no\s+stone|nil\s+residual)\b/i.test(lower)) {
    result.residual_stone = false;
  } else if (/\b(residual\s+stone|residual\s+present|residual\s+yes|stone\s+present)\b/i.test(lower)) {
    result.residual_stone = true;
  }

  // 6. Phone Number (10 digits spoken together or with spaces)
  const phoneDigits = text.replace(/[^\d]/g, "");
  const phoneMatch = text.match(/\b([6-9]\d{9})\b/);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
  }

  // 7. UHID (e.g., "UHID 260826056037" or "UHID SMCH-12345")
  const uhidExplicit = text.match(/uhid\s*(?:is|number|no|:)?\s*([a-zA-Z0-9-]+)/i);
  if (uhidExplicit) {
    result.uhid = uhidExplicit[1].toUpperCase();
  } else if (phoneDigits.length >= 10 && !result.phone) {
    // If multiple numbers exist
    const numbers = text.match(/\b\d{6,14}\b/g);
    if (numbers && numbers.length > 0) {
      result.uhid = numbers[0];
    }
  }

  // 8. Patient Name
  const nameMatch = text.match(/patient\s*(?:name\s*(?:is)?)?\s*([a-zA-Z\s]+?)(?=\s+(?:uhid|phone|unit|left|right|bilateral|stent|done|dr|prof|procedure|$))/i);
  if (nameMatch && nameMatch[1].trim().length > 2) {
    result.name = nameMatch[1].trim();
  }

  // 9. Procedure Notes (e.g., "Procedure done Left URSL with laser lithotripsy")
  const procMatch = text.match(/(?:procedure|diagnosis|indication|surgery|notes|done)\s*(?:is|was|done)?\s*:\s*(.*)/i) ||
                    text.match(/(?:ursl|rirs|pcnl|eswl|pyeloplasty|dj\s*stenting|ureteroscopy)(?:.*)/i);
  if (procMatch) {
    result.notes = procMatch[0].trim();
  } else {
    result.notes = `Voice Dictated: ${text}`;
  }

  return result;
}
