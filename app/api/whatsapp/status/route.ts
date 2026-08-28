import { NextResponse } from "next/server";

const WHATSAPP_CLOUD_URL = process.env.WHATSAPP_API_URL || "https://saveetha-whatsapp-gateway.onrender.com";
const WHATSAPP_LOCAL_URL = "http://localhost:3001";

export async function GET() {
  // First try the Cloud 24/7 Render Gateway, then fallback to Local daemon
  const urlsToTry = [WHATSAPP_CLOUD_URL, WHATSAPP_LOCAL_URL];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(`${url}/status`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          ...data,
          gatewayUrl: url,
        });
      }
    } catch {
      // Try next
    }
  }

  return NextResponse.json({
    success: true,
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    connectedPhone: null,
    daemonRunning: false,
    instructions: "Render 24/7 Gateway or local 'npm run whatsapp-service' initializing...",
  });
}