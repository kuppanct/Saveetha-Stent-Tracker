/**
 * SAVEETHA MEDICAL COLLEGE & HOSPITAL - UROLOGY DEPARTMENT
 * ZERO-COST WHATSAPP GATEWAY DAEMON & RESIDENT INGESTION BOT
 * Uses whatsapp-web.js with LocalAuth session caching.
 * Optimized for low-memory container environments (Render free tier < 512MB RAM).
 */

const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcodeTerminal = require("qrcode-terminal");
const QRCode = require("qrcode");
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: ".env.local" });

const app = express();
const PORT = process.env.PORT || process.env.WHATSAPP_SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

let clientState = {
  status: "INITIALIZING", // INITIALIZING, QR_READY, AUTHENTICATING, READY, DISCONNECTED
  qrCodeText: null,
  qrCodeDataUrl: null,
  connectedPhone: null,
  lastUpdated: new Date().toISOString(),
};

console.log("=================================================================");
console.log("🏥 Saveetha Urology DJ Stent Tracker - WhatsApp Gateway Service");
console.log("=================================================================");

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: "./.wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--single-process",
      "--disable-extensions",
      "--disable-component-update",
      "--disable-default-apps",
      "--mute-audio",
      "--hide-scrollbars",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--js-flags=--max-old-space-size=256",
    ],
  },
});

client.on("qr", async (qr) => {
  console.log("\n📲 [WHATSAPP] Scan this QR Code with your Hospital/Department WhatsApp:\n");
  qrcodeTerminal.generate(qr, { small: true });

  try {
    const dataUrl = await QRCode.toDataURL(qr);
    clientState = {
      status: "QR_READY",
      qrCodeText: qr,
      qrCodeDataUrl: dataUrl,
      connectedPhone: null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Error generating QR data URL:", err);
  }
});

client.on("authenticated", () => {
  console.log("✅ [WHATSAPP] Session Authenticated Successfully.");
  clientState.status = "AUTHENTICATED";
  clientState.qrCodeDataUrl = null;
  clientState.qrCodeText = null;
  clientState.lastUpdated = new Date().toISOString();
});

client.on("auth_failure", (msg) => {
  console.error("❌ [WHATSAPP] Authentication failure:", msg);
  clientState.status = "DISCONNECTED";
  clientState.lastUpdated = new Date().toISOString();
});

client.on("ready", () => {
  const info = client.info;
  const phone = info ? info.wid.user : "Unknown";
  console.log(`🚀 [WHATSAPP] Client is READY! Connected Phone: +${phone}`);

  clientState = {
    status: "READY",
    qrCodeText: null,
    qrCodeDataUrl: null,
    connectedPhone: phone,
    lastUpdated: new Date().toISOString(),
  };
});

client.on("disconnected", (reason) => {
  console.warn("⚠️ [WHATSAPP] Client was disconnected:", reason);
  clientState.status = "DISCONNECTED";
  clientState.qrCodeDataUrl = null;
  clientState.lastUpdated = new Date().toISOString();
});

// =========================================================================
// CHANNEL 2: INCOMING WHATSAPP BOT PARSER FOR RESIDENTS
// Syntax: #STENT 12345678 Ravi Kumar 9876543210 Right Regular RIRS Residual:Yes Unit1
// =========================================================================
client.on("message", async (msg) => {
  const body = msg.body?.trim();
  if (!body) return;

  if (body.toUpperCase().startsWith("#STENT") || body.toUpperCase().startsWith("/STENT") || body.toUpperCase().startsWith("#DJ")) {
    console.log(`\n📥 [BOT MESSAGE RECEIVED] From: ${msg.from} | Payload: "${body}"`);

    try {
      const apiUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}/api/ingest/bot` 
        : "https://saveetha-stent-tracker.vercel.app/api/ingest/bot";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body, sender: msg.from }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        const reply = `✅ *DJ STENT REGISTERED SUCCESSFULLY*\n🏥 *Saveetha Medical College Urology*\n━━━━━━━━━━━━━━━━━━━━\n👤 *Patient:* ${json.stent.patient?.name}\n🔢 *UHID:* ${json.stent.patient?.uhid}\n📍 *Laterality:* ${json.stent.laterality} Kidney\n🧪 *Material:* ${json.stent.material} (${json.stent.days_remaining || 90}d lifespan)\n📅 *Due Date:* ${json.stent.planned_removal_date}\n⚠️ *Residual Stone:* ${json.stent.residual_stone ? "Yes" : "No"}\n━━━━━━━━━━━━━━━━━━━━\n⏰ *Automated reminder clock active!*`;
        await msg.reply(reply);
        console.log(`✅ [BOT CONFIRMATION SENT] to ${msg.from}`);
      } else {
        const errorReply = `⚠️ *Stent Registration Notice:*\n${json.error || "Could not parse stent details. Format: #STENT <UHID> <Name> <Phone> <Side> <Material> <Indication> Residual:Yes/No Unit1"}`;
        await msg.reply(errorReply);
      }
    } catch (err) {
      console.error("Error processing bot message:", err.message);
      await msg.reply("❌ Error contacting Saveetha Registry Server. Please try again.");
    }
  }
});

// Helper to format Indian & International mobile numbers to WhatsApp format
function formatWhatsAppId(rawPhone) {
  let cleaned = String(rawPhone).replace(/[^\d]/g, "");
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return `${cleaned}@c.us`;
}

// REST ENDPOINTS

// 1. Health & Connection Status
app.get("/status", (req, res) => {
  res.json({
    success: true,
    ...clientState,
  });
});

// 2. Fetch Latest QR Code
app.get("/qr", (req, res) => {
  res.json({
    status: clientState.status,
    qrCodeText: clientState.qrCodeText,
    qrCodeDataUrl: clientState.qrCodeDataUrl,
  });
});

// 3. Send WhatsApp Notification
app.post("/send", async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: 'phone' and 'message'",
      });
    }

    if (clientState.status !== "READY") {
      return res.status(503).json({
        success: false,
        error: `WhatsApp client is not ready (Current status: ${clientState.status}). Please scan QR code in the WhatsApp Center.`,
      });
    }

    const chatId = formatWhatsAppId(phone);
    console.log(`📨 [SENDING] Dispatching to ${chatId}...`);

    const result = await client.sendMessage(chatId, message);

    console.log(`✅ [SENT] Message sent to ${phone} (Message ID: ${result.id.id})`);
    return res.json({
      success: true,
      messageId: result.id.id,
      recipient: phone,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ [SEND ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send WhatsApp message",
    });
  }
});

// Start HTTP Express Server
app.listen(PORT, () => {
  console.log(`🌐 [GATEWAY API] WhatsApp HTTP Server running on port ${PORT}`);
  console.log("🔄 Initializing WhatsApp Web Client instance with low-memory configuration...\n");
  client.initialize().catch((err) => {
    console.error("Failed to initialize WhatsApp client:", err);
  });
});