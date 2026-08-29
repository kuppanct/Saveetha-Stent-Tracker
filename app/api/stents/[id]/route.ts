import { NextRequest, NextResponse } from "next/server";
import { getStentById, updateStentAndPatient, deleteStent } from "@/lib/db-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const stent = await getStentById(params.id);
    if (!stent) {
      return NextResponse.json({ error: "Stent not found" }, { status: 404 });
    }
    return NextResponse.json(stent);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch stent" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateStentAndPatient(params.id, body);
    return NextResponse.json({ success: true, stent: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update stent record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteStent(params.id);
    return NextResponse.json({ success, message: "Stent entry permanently deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete stent record" },
      { status: 500 }
    );
  }
}
