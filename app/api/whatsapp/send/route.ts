import { NextRequest, NextResponse } from "next/server";
import { logNotification } from "@/lib/db-service";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "http://localhost:3001";

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

    try {
      const res = await fetch(`${WHATSAPP_API_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, message }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        isSent = true;
      } else {
        errorMessage = data.error || "Gateway returned error";
      }
    } catch (err: any) {
      errorMessage = "WhatsApp local daemon is not running. Please start it with 'npm run whatsapp-service'.";
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
      return NextResponse.json({ success: true, message: "WhatsApp message dispatched successfully" });
    } else {
      return NextResponse.json({
        success: false,
        warning: true,
        error: errorMessage,
        message: "Message logged. To send live WhatsApp chats, run 'npm run whatsapp-service'",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process WhatsApp request" },
      { status: 500 }
    );
  }
}