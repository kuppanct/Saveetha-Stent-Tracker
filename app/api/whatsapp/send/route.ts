import { NextRequest, NextResponse } from "next/server";
import { logNotification } from "@/lib/db-service";

const WHATSAPP_CLOUD_URL = process.env.WHATSAPP_API_URL || "https://saveetha-whatsapp-gateway.onrender.com";
const WHATSAPP_LOCAL_URL = "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, message, stent_id, patient_id, trigger_type } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Phone and message are required" },
        { status: 400 }
      );
    }

    let isSent = false;
    let errorMessage: string | undefined = undefined;

    // Try Render 24/7 cloud gateway first, then fallback to local
    const urlsToTry = [WHATSAPP_CLOUD_URL, WHATSAPP_LOCAL_URL];

    for (const url of urlsToTry) {
      try {
        const res = await fetch(`${url}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, message }),
          signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          isSent = true;
          errorMessage = undefined;
          break;
        } else {
          errorMessage = data.error || "Gateway returned error";
        }
      } catch (err: any) {
        errorMessage = `Could not reach gateway at ${url}`;
      }
    }

    // Log notification attempt
    if (stent_id && patient_id) {
      await logNotification(
        stent_id,
        patient_id,
        trigger_type || "MANUAL",
        phone,
        message,
        isSent ? "SENT" : "FAILED",
        errorMessage
      );
    }

    if (isSent) {
      return NextResponse.json({
        success: true,
        recipient: phone,
        status: "SENT",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: errorMessage || "Failed to send WhatsApp message via cloud and local gateways",
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}