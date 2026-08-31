import { NextRequest, NextResponse } from "next/server";
import { registerPatientAndStent, checkActiveStentDuplicate } from "@/lib/db-service";
import { Laterality, StentMaterial, UnitType } from "@/lib/types";

function parseFlexibleDate(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const cleaned = dateStr.trim();
  
  // Format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Standard parse
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return new Date().toISOString().split("T")[0];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { records } = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: "Records must be a non-empty array" }, { status: 400 });
    }

    const results = {
      imported: 0,
      duplicates: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const uhid = String(row.uhid || row.UHID || row["Hospital No"] || row["Patient ID"] || "").trim().toUpperCase();
        const name = String(row.name || row.Name || row["Patient Name"] || "").trim();
        const rawPhone = String(row.phone || row.Phone || row["Mobile"] || row["Contact"] || "9840123456").replace(/\D/g, "");
        const phone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "9840123456";
        
        const sideRaw = String(row.laterality || row.Side || row.Laterality || "Right").toLowerCase();
        let targetSides: ("Left" | "Right")[] = ["Right"];
        if (sideRaw.includes("bilateral") || sideRaw === "both" || sideRaw === "b/l") {
          targetSides = ["Left", "Right"];
        } else if (sideRaw.includes("left") || sideRaw === "lt") {
          targetSides = ["Left"];
        } else {
          targetSides = ["Right"];
        }

        let material: StentMaterial = "Carbothane";
        const matRaw = String(row.material || row.Material || row["Stent Type"] || "").toLowerCase();
        if (matRaw.includes("silicone")) material = "Silicone";
        else if (matRaw.includes("regular") || matRaw.includes("polyurethane") || matRaw.includes("pu")) material = "Regular";
        else material = "Carbothane";

        const unitRaw = String(row.unit || row.Unit || "").toLowerCase();
        const unit: UnitType = unitRaw.includes("2") ? "Unit 2" : "Unit 1";

        const rawInsertDate = String(row.insertion_date || row["Insertion Date"] || row.Date || row["Date of Insertion"] || "").trim();
        const insertion_date = parseFlexibleDate(rawInsertDate);

        const rawPlannedDate = String(row.planned_removal_date || row["Planned Removal Date"] || row["Due Date"] || "").trim();
        const planned_removal_date = rawPlannedDate ? parseFlexibleDate(rawPlannedDate) : undefined;

        const resStoneRaw = String(row.residual_stone || row["Residual Stone"] || row["Stone"] || "").toLowerCase();
        const residual_stone = resStoneRaw === "yes" || resStoneRaw === "true" || resStoneRaw === "1" || resStoneRaw === "y";

        const statusRaw = String(row.status || row.Status || "Active").trim().toLowerCase();
        const status = statusRaw.includes("remov") ? "Removed" : "Active";

        const rawActualDate = String(row.actual_removal_date || row["Actual Removal Date"] || row["Removal Date"] || "").trim();
        const actual_removal_date = rawActualDate ? parseFlexibleDate(rawActualDate) : (status === "Removed" ? parseFlexibleDate(rawPlannedDate || rawInsertDate) : undefined);

        const defaultDoctor = unit === "Unit 2" ? "Prof. M. Siva Sankar" : "Prof. N. Muthulatha";
        const inserted_by = String(row.inserted_by || row["Surgeon"] || row.Doctor || defaultDoctor).trim();

        const second_language = String(row.second_language || row.Language || "Tamil").toLowerCase().includes("hindi") ? "Hindi" : "Tamil";
        const notes = String(row.notes || row.Notes || row.Procedure || "").trim();

        if (!uhid || !name) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing UHID or Patient Name`);
          continue;
        }

        // Process each side (expands bilateral into 2 records)
        for (const side of targetSides) {
          // If status is Active, check for duplicates
          if (status === "Active") {
            const dup = await checkActiveStentDuplicate(uhid, side as Laterality);
            if (dup.hasDuplicate) {
              results.duplicates++;
              results.errors.push(`Row ${i + 1} (${uhid} - ${side}): Active ${side} stent already exists in registry`);
              continue;
            }
          }

          await registerPatientAndStent({
            uhid,
            name,
            phone,
            second_language,
            unit,
            laterality: side as Laterality,
            material,
            insertion_date,
            planned_removal_date,
            actual_removal_date,
            status,
            residual_stone,
            inserted_by,
            notes: notes ? `Imported via Backlog File. ${notes}` : `Imported via Backlog File`,
          });

          results.imported++;
        }
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Bulk CSV ingestion failed" }, { status: 500 });
  }
}
