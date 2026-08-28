import { NextRequest, NextResponse } from "next/server";
import { parseBotSyntax } from "@/lib/text-parser";
import { registerPatientAndStent, checkActiveStentDuplicate } from "@/lib/db-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sender } = body;

    if (!message) {
      return NextResponse.json({ error: "Missing message payload" }, { status: 400 });
    }

    // 1. Parse Bot Syntax
    const parseResult = parseBotSyntax(message);
    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json({ error: parseResult.error || "Failed to parse syntax" }, { status: 422 });
    }

    const data = parseResult.data;

    // 2. Check Deduplication
    const dupCheck = await checkActiveStentDuplicate(data.uhid, data.laterality);
    if (dupCheck.hasDuplicate) {
      return NextResponse.json({
        error: `Active stent already exists on ${data.laterality} side for UHID ${data.uhid} (${dupCheck.existingPatient?.name}). Use Exchange or specify other side.`,
        isDuplicate: true,
        activeStents: dupCheck.activeStents,
      }, { status: 409 });
    }

    // 3. Register Stent
    const registered = await registerPatientAndStent({
      uhid: data.uhid,
      name: data.name,
      phone: data.phone,
      second_language: data.second_language,
      unit: data.unit,
      laterality: data.laterality,
      material: data.material,
      insertion_date: data.insertion_date,
      planned_removal_date: data.planned_removal_date,
      residual_stone: data.residual_stone,
      inserted_by: data.inserted_by,
      notes: `${data.notes || ""} [Logged via Bot sender: ${sender || "WhatsApp"}]`,
    });

    return NextResponse.json({
      success: true,
      parsed: data,
      ...registered,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process bot ingestion" }, { status: 500 });
  }
}
