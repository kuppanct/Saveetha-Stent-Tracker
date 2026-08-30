import { NextRequest, NextResponse } from "next/server";
import { getNotificationLogs } from "@/lib/db-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stentId = searchParams.get("stentId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await getNotificationLogs(stentId, limit);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch notification logs" },
      { status: 500 }
    );
  }
}
