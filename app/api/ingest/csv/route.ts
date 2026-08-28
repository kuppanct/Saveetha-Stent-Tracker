import { NextRequest, NextResponse } from "next/server";
import { registerPatientAndStent, checkActiveStentDuplicate } from "@/lib/db-service";
import { StentRegistrationInput, Laterality, StentMaterial, UnitType } from "@/lib/types";

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
        const uhid = String(row.uhid || row.UHID || row["Hospital No"] || "").trim().toUpperCase();
        const name = String(row.name || row.Name || row["Patient Name"] || "").trim();
        const phone = String(row.phone || row.Phone || row["Contact"] || "9840123456").replace(/\D/g, "");
        
        let laterality: Laterality = "Right";
        const sideRaw = String(row.laterality || row.Side || row.Laterality || "").toLowerCase();
        if (sideRaw.includes("left") || sideRaw === "lt") laterality = "Left";
        else if (sideRaw.includes("bilateral") || sideRaw === "both") laterality = "Bilateral";

        let material: StentMaterial = "Regular";
        const matRaw = String(row.material || row.Material || "").toLowerCase();
        if (matRaw.includes("silicone")) material = "Silicone";
        else if (matRaw.includes("carbothane")) material = "Carbothane";

        const unit: UnitType = String(row.unit || "").includes("2") ? "Unit 2" : "Unit 1";
        const insertion_date = String(row.insertion_date || row["Insertion Date"] || new Date().toISOString().split("T")[0]).trim();
        const residual_stone = Boolean(row.residual_stone || row["Residual Stone"] === "Yes" || row["Residual Stone"] === true);
        const inserted_by = String(row.inserted_by || row["Surgeon"] || row.Doctor || "Dr. Urology Department").trim();

        if (!uhid || !name) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing UHID or Name`);
          continue;
        }

        // Deduplication check
        const dup = await checkActiveStentDuplicate(uhid, laterality);
        if (dup.hasDuplicate) {
          results.duplicates++;
          results.errors.push(`Row ${i + 1} (${uhid} - ${laterality}): Duplicate active stent exists`);
          continue;
        }

        await registerPatientAndStent({
          uhid,
          name,
          phone,
          second_language: String(row.second_language || "Tamil").includes("Hindi") ? "Hindi" : "Tamil",
          unit,
          laterality,
          material,
          insertion_date,
          planned_removal_date: row.planned_removal_date || undefined,
          residual_stone,
          inserted_by,
          notes: `Imported via CSV Backlog Uploader. ${row.notes || ""}`,
        });

        results.imported++;
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
