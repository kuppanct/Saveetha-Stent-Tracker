import { NextResponse } from "next/server";

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/status`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // Daemon is offline or starting
  }

  return NextResponse.json({
    success: true,
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    connectedPhone: null,
    daemonRunning: false,
    instructions: "Run 'npm run whatsapp-service' in terminal to activate WhatsApp Gateway",
  });
}