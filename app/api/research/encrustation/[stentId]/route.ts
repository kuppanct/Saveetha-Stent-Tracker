import { NextRequest, NextResponse } from "next/server";
import { getResearchEncrustation, upsertResearchEncrustation } from "@/lib/db-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { stentId: string } }
) {
  try {
    const data = await getResearchEncrustation(params.stentId);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch research encrustation data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { stentId: string } }
) {
  try {
    const body = await request.json();
    const stent_id = params.stentId;

    if (!body.patient_id) {
      return NextResponse.json(
        { error: "patient_id is required" },
        { status: 400 }
      );
    }

    const saved = await upsertResearchEncrustation({
      ...body,
      stent_id,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save research encrustation data" },
      { status: 500 }
    );
  }
}
