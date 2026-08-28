import { NextRequest, NextResponse } from "next/server";
import { removeStent } from "@/lib/db-service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const stentId = params.id;

    const result = await removeStent(stentId, body.removal_date, body.notes);
    return NextResponse.json({ success: true, stent: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove stent" },
      { status: 500 }
    );
  }
}