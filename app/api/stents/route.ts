import { NextRequest, NextResponse } from "next/server";
import {
  getStents,
  registerPatientAndStent,
  checkActiveStentDuplicate,
  getDashboardStats,
} from "@/lib/db-service";
import { StentRegistrationInput } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Deduplication check query
    if (searchParams.get("checkDuplicate") === "true") {
      const uhid = searchParams.get("uhid") || "";
      const laterality = searchParams.get("laterality") || "";
      const result = await checkActiveStentDuplicate(uhid, laterality);
      return NextResponse.json(result);
    }

    // 2. Stats query
    if (searchParams.get("stats") === "true") {
      const stats = await getDashboardStats();
      return NextResponse.json(stats);
    }

    // 3. Stents list query
    const status = searchParams.get("status") || undefined;
    const unit = searchParams.get("unit") || undefined;
    const search = searchParams.get("search") || undefined;
    const urgency = searchParams.get("urgency") || undefined;

    const stents = await getStents({ status, unit, search, urgency });
    return NextResponse.json(stents);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch stents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: StentRegistrationInput = await request.json();

    if (!body.uhid || !body.name || !body.phone || !body.unit || !body.laterality || !body.material || !body.insertion_date || !body.inserted_by) {
      return NextResponse.json(
        { error: "Missing required fields for stent registration" },
        { status: 400 }
      );
    }

    const result = await registerPatientAndStent(body);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to register stent" },
      { status: 500 }
    );
  }
}