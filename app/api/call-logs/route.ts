import { NextRequest, NextResponse } from "next/server";
import { getCallLogs, logCall } from "@/lib/db-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stentId = searchParams.get("stentId") || undefined;
    const patientId = searchParams.get("patientId") || undefined;

    const logs = await getCallLogs(stentId, patientId);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch call logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stent_id, patient_id, outcome, notes, logged_by } = body;

    if (!stent_id || !patient_id || !outcome) {
      return NextResponse.json(
        { error: "Missing required fields: stent_id, patient_id, outcome" },
        { status: 400 }
      );
    }

    const log = await logCall(stent_id, patient_id, outcome, notes || "", logged_by || "Technician");
    return NextResponse.json({ success: true, log }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to log call" },
      { status: 500 }
    );
  }
}