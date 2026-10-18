import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json(
      {
        status: "unconfigured",
        message: "Supabase credentials are not configured",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Perform active query to keep database warm and prevent 7-day inactivity pause
    const { data, error, status } = await supabase
      .from("stents")
      .select("id")
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      return NextResponse.json(
        {
          status: "error",
          error: error.message,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "active",
      message: "Supabase connection verified. Keep-alive ping successful.",
      latencyMs,
      dbStatus: status,
      recordSampleFound: (data && data.length > 0) ? true : false,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "fatal",
        error: err.message || "Failed to execute keep-alive query",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
