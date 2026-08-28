import { NextRequest, NextResponse } from "next/server";
import { getStents, logNotification } from "@/lib/db-service";
import { evaluateNotificationTrigger } from "@/lib/stent-calculator";
import { buildBilingualMessage } from "@/lib/message-templates";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const stents = await getStents({ status: "Active" });
    const triggeredItems: any[] = [];

    for (const stent of stents) {
      const patient = stent.patient;
      if (!patient) continue;

      const evalResult = evaluateNotificationTrigger(stent.planned_removal_date, stent.status);
      if (evalResult.shouldNotify && evalResult.triggerType) {
        const { fullMessage } = buildBilingualMessage(
          evalResult.category || "OVERDUE",
          {
            patientName: patient.name,
            laterality: stent.laterality,
            insertionDate: stent.insertion_date,
            dueDate: stent.planned_removal_date,
          },
          patient.second_language
        );

        let sent = false;
        let errorMsg: string | undefined;

        try {
          const res = await fetch(`${WHATSAPP_API_URL}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: patient.phone, message: fullMessage }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            sent = true;
          } else {
            errorMsg = data.error;
          }
        } catch (e: any) {
          errorMsg = "WhatsApp daemon unreachable";
        }

        await logNotification(
          stent.id,
          patient.id,
          evalResult.triggerType,
          patient.phone,
          fullMessage,
          sent ? "SENT" : "FAILED",
          errorMsg
        );

        triggeredItems.push({
          uhid: patient.uhid,
          patientName: patient.name,
          trigger: evalResult.triggerType,
          status: sent ? "SENT" : "LOGGED_LOCAL",
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      activeStentsChecked: stents.length,
      notificationsTriggered: triggeredItems.length,
      details: triggeredItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to trigger cron job" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}