import { NextRequest, NextResponse } from "next/server";
import { getAllResearchEncrustationsWithDetails } from "@/lib/db-service";
import { differenceInDays, parseISO } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const records = await getAllResearchEncrustationsWithDetails();

    const headers = [
      "Research ID",
      "Stent ID",
      "UHID",
      "Patient Name",
      "Phone",
      "Urology Unit",
      "Laterality",
      "Stent Material",
      "Stent Size (Fr)",
      "Stent Length (cm)",
      "Insertion Date",
      "Removal Date",
      "Indwelling Time (Days)",
      "Encrustation Grade (0-3)",
      "Encrustation Locations",
      "Removal Difficulty",
      "Ancillary Procedure Required",
      "Procedure Type",
      "Stone Clearance Status",
      "Residual Stone Initially",
      "Pre-op Urine Culture",
      "Pre-op Urine pH",
      "Alkalinizer Used",
      "Symptomatic Indwelling",
      "Patient Weight (kg)",
      "Patient Height (cm)",
      "Patient BMI",
      "Diabetic Status",
      "CKD Status",
      "Pregnancy Status",
      "Recurrent Stone Former",
      "Operating / Removing Surgeon",
      "Stent Photo URL",
      "Recorded At",
    ];

    const escapeCsv = (val: any): string => {
      if (val === null || val === undefined) return "";
      const str = Array.isArray(val) ? val.join(";") : String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = records.map((r) => {
      const stent = r.stent || {};
      const patient = stent.patient || {};

      const insertionDateStr = stent.insertion_date || "";
      const removalDateStr = stent.removal_date || stent.actual_removal_date || "";

      let indwellingDays = "";
      if (insertionDateStr && removalDateStr) {
        try {
          indwellingDays = String(
            differenceInDays(parseISO(removalDateStr), parseISO(insertionDateStr))
          );
        } catch {
          indwellingDays = "";
        }
      }

      return [
        r.id || "",
        r.stent_id || "",
        patient.uhid || "",
        patient.name || "",
        patient.phone || "",
        stent.unit || "",
        stent.laterality || "",
        stent.material || "",
        r.stent_size_fr ?? 6.0,
        r.stent_length_cm ?? 26,
        insertionDateStr,
        removalDateStr,
        indwellingDays,
        r.encrustation_grade ?? 0,
        r.encrustation_location || [],
        r.removal_difficulty || "Simple",
        r.ancillary_procedure_required ? "YES" : "NO",
        r.procedure_type || "URSL",
        r.stone_clearance_status || "Complete",
        stent.residual_stone ? "YES" : "NO",
        r.urine_culture || "Sterile",
        r.urine_ph ?? "",
        r.alkalinizer_used ? "YES" : "NO",
        r.symptomatic_indwelling ? "YES" : "NO",
        r.weight_kg ?? "",
        r.height_cm ?? "",
        r.bmi ?? "",
        r.is_diabetic ? "YES" : "NO",
        r.has_ckd ? "YES" : "NO",
        r.pregnancy_status ? "YES" : "NO",
        r.recurrent_stone_former ? "YES" : "NO",
        stent.inserted_by || "",
        r.stent_image_url || "",
        r.created_at || "",
      ]
        .map(escapeCsv)
        .join(",");
    });

    const csvContent = [headers.map(escapeCsv).join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="saveetha_stent_encrustation_study_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate CSV export" },
      { status: 500 }
    );
  }
}
