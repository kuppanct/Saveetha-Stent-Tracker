/**
 * SAVEETHA MEDICAL COLLEGE & HOSPITAL - UROLOGY DEPARTMENT
 * DAILY NOTIFICATION CRON JOB RUNNER
 * Evaluates Notification Matrix: T-30, T-14, T-0, T+14, T+30, T+90, T+180, Severely Overdue (every 30d post 180).
 */

const cron = require("node-cron");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "http://localhost:3001";

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SERVICE_KEY &&
  !SUPABASE_URL.includes("your-project.supabase.co")
);

const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null;

// Lifespan & Schedule Evaluation Functions
function getDaysRemaining(plannedRemovalDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const planned = new Date(plannedRemovalDateStr);
  planned.setHours(0, 0, 0, 0);
  const diffTime = planned.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

function formatLaterality(laterality, lang) {
  if (lang === "Tamil") {
    if (laterality === "Left") return "இடது (Left)";
    if (laterality === "Right") return "வலது (Right)";
    if (laterality === "Bilateral") return "இருபுறமும் (Bilateral)";
  } else if (lang === "Hindi") {
    if (laterality === "Left") return "बाएं (Left)";
    if (laterality === "Right") return "दाएं (Right)";
    if (laterality === "Bilateral") return "दोनों (Bilateral)";
  }
  return laterality;
}

function generateBilingualMessage(triggerType, patient, stent) {
  const patientName = patient.name.trim();
  const lateralityEn = stent.laterality;
  const lateralityReg = formatLaterality(stent.laterality, patient.second_language);
  const insertionDate = formatDate(stent.insertion_date);
  const dueDate = formatDate(stent.planned_removal_date);

  let english = "";
  let regional = "";

  if (triggerType === "T-30" || triggerType === "T-14") {
    english = `Dear ${patientName}, this is a reminder from the Dept of Urology, Saveetha Medical College & Hospital. The DJ stent placed in your ${lateralityEn} kidney on ${insertionDate} is due for removal on ${dueDate}. Please visit the OPD. Delaying removal can cause severe infection, stone formation, or kidney damage.`;
    if (patient.second_language === "Tamil") {
      regional = `அன்புள்ள ${patientName}, உங்கள் ${lateralityReg} சிறுநீரகத்தில் ${insertionDate} அன்று வைக்கப்பட்ட ஸ்டென்ட் (DJ Stent) ${dueDate} அன்று எடுக்கப்பட வேண்டும். தாமதம் செய்தால் கல் உருவாவது, கொடிய தொற்று அல்லது சிறுநீரக பாதிப்பு ஏற்படலாம். தயவுசெய்து சவீதா மருத்துவமனைக்கு வரவும்.`;
    } else {
      regional = `प्रिय ${patientName}, आपके ${lateralityReg} गुर्दे में ${insertionDate} को डाला गया डीजे स्टेंट (DJ Stent) ${dueDate} को निकाला जाना है। देरी से पथरी, गंभीर संक्रमण या गुर्दे को नुकसान हो सकता है। कृपया सवीता अस्पताल आएं।`;
    }
  } else if (triggerType === "T-0") {
    english = `URGENT REMINDER: Dear ${patientName}, your DJ stent removal is scheduled for TODAY. Please visit the Saveetha Urology OPD immediately. Failure to remove the stent on time carries high risks of life-threatening infection and kidney failure.`;
    if (patient.second_language === "Tamil") {
      regional = `அவசர நினைவூட்டல்: ${patientName}, உங்கள் ஸ்டென்ட் (DJ Stent) எடுப்பதற்கான நாள் இன்று. உடனடியாக சவீதா மருத்துவமனை சிறுநீரகவியல் துறைக்கு வரவும். தவறினால் உயிருக்கு ஆபத்தான தொற்று மற்றும் சிறுநீரக செயலிழப்பு ஏற்பட அதிக வாய்ப்புள்ளது.`;
    } else {
      regional = `अति आवश्यक: ${patientName}, आपका स्टेंट (DJ Stent) निकालने का दिन आज है। तुरंत सवीता अस्पताल के यूरोलॉजी विभाग में आएं। स्टेंट न निकालने पर जानलेवा संक्रमण और गुर्दे के फेल होने का खतरा है।`;
    }
  } else {
    // Overdue triggers: T+14, T+30, T+90, T+180, T+SeverelyOverdue
    english = `CRITICAL MEDICAL ALERT: Dear ${patientName}, your DJ stent removal is OVERDUE. It was placed on ${insertionDate}. Leaving a stent inside beyond its expiry period leads to permanent kidney damage, severe calcification, and may require major complex surgeries to remove. The hospital is not responsible for any complications or kidney loss arising from your delay. Report to Saveetha Medical College Urology OPD immediately.`;
    if (patient.second_language === "Tamil") {
      regional = `தீவிர மருத்துவ எச்சரிக்கை: ${patientName}, உங்கள் ஸ்டென்ட் (DJ Stent) எடுப்பதற்கான காலக்கெடு முடிந்துவிட்டது. இதை அப்படியே விட்டுவைத்தால் சிறுநீரகம் நிரந்தரமாக பாதிக்கப்படும், மற்றும் பெரிய அறுவை சிகிச்சை தேவைப்படலாம். உங்களின் இந்த தாமதத்தால் ஏற்படும் எவ்வித பக்கவிளைவுகளுக்கும் மருத்துவமனை பொறுப்பேற்காது. உடனடியாக சவீதா மருத்துவமனைக்கு வரவும்.`;
    } else {
      regional = `गंभीर स्वास्थ्य चेतावनी: ${patientName}, आपका स्टेंट (DJ Stent) निकालने की समय सीमा पार हो चुकी है। इसे अंदर छोड़ने से गुर्दे को स्थायी नुकसान हो सकता है और बड़ी सर्जरी की आवश्यकता हो सकती है। आपकी देरी से होने वाली किसी भी जटिलता के लिए अस्पताल जिम्मेदार नहीं होगा। तुरंत सवीता अस्पताल आएं।`;
    }
  }

  return `🏥 *SAVEETHA MEDICAL COLLEGE & HOSPITAL*\n*Department of Urology*\n\n${english}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${regional}\n\n📞 Urology Helpline / OPD: 044 6672 6618 / Saveetha Hospital Thandalam`;
}

function evaluateTrigger(plannedRemovalDate) {
  const days = getDaysRemaining(plannedRemovalDate);

  if (days === 30) return "T-30";
  if (days === 14) return "T-14";
  if (days === 0) return "T-0";

  if (days < 0) {
    const overdue = Math.abs(days);
    if (overdue === 14) return "T+14";
    if (overdue === 30) return "T+30";
    if (overdue === 90) return "T+90";
    if (overdue === 180) return "T+180";
    if (overdue > 180 && (overdue - 180) % 30 === 0) return `T+${overdue}`;
  }

  return null;
}

async function sendWhatsAppNotification(phone, message) {
  try {
    const res = await fetch(`${WHATSAPP_API_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message }),
    });
    const json = await res.json();
    return json.success ? { success: true } : { success: false, error: json.error };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function executeDailyStentCheck() {
  console.log(`\n⏰ [CRON] Starting Daily Stent Expiry & Reminder Evaluation at ${new Date().toISOString()}...`);

  let stents = [];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from("stents")
      .select("*, patient:patients(*)")
      .eq("status", "Active");

    if (error) {
      console.error("❌ [CRON] Error fetching stents from Supabase:", error);
      return;
    }
    stents = data || [];
  } else {
    console.log("ℹ️ [CRON] Running with local mock dataset for demonstration.");
    // Mock dataset evaluation
    const today = new Date();
    stents = [
      {
        id: "s-mock-01",
        patient_id: "p-01",
        laterality: "Right",
        insertion_date: "2026-05-30",
        planned_removal_date: new Date(today.getTime() + 14 * 86400000).toISOString().split("T")[0], // T-14
        status: "Active",
        patient: { name: "Kavitha Murugan", phone: "9840123456", second_language: "Tamil" },
      },
      {
        id: "s-mock-02",
        patient_id: "p-02",
        laterality: "Left",
        insertion_date: "2026-05-30",
        planned_removal_date: new Date().toISOString().split("T")[0], // T-0
        status: "Active",
        patient: { name: "Annamalai S", phone: "9444112233", second_language: "Tamil" },
      },
      {
        id: "s-mock-03",
        patient_id: "p-03",
        laterality: "Bilateral",
        insertion_date: "2026-04-15",
        planned_removal_date: new Date(today.getTime() - 14 * 86400000).toISOString().split("T")[0], // T+14 Overdue
        status: "Active",
        patient: { name: "Rajesh Sharma", phone: "9876543210", second_language: "Hindi" },
      },
    ];
  }

  let triggeredCount = 0;

  for (const stent of stents) {
    const patient = stent.patient;
    if (!patient || !patient.phone) continue;

    const trigger = evaluateTrigger(stent.planned_removal_date);

    if (trigger) {
      triggeredCount++;
      const message = generateBilingualMessage(trigger, patient, stent);
      console.log(`\n🔔 [TRIGGER MATCH] Stent ID: ${stent.id} | UHID: ${patient.uhid || "N/A"} | Patient: ${patient.name}`);
      console.log(`   Type: ${trigger} | Language: ${patient.second_language} | Phone: ${patient.phone}`);

      const sendResult = await sendWhatsAppNotification(patient.phone, message);

      if (isSupabaseConfigured && supabase) {
        await supabase.from("notification_logs").insert({
          stent_id: stent.id,
          patient_id: patient.id,
          trigger_type: trigger,
          recipient_phone: patient.phone,
          message_body: message,
          status: sendResult.success ? "SENT" : "FAILED",
          error_message: sendResult.error || null,
        });
      }

      console.log(`   Result: ${sendResult.success ? "✅ Dispatched" : `⚠️ Error (${sendResult.error})`}`);
    }
  }

  console.log(`\n🏁 [CRON COMPLETED] Processed ${stents.length} active stents. Sent ${triggeredCount} automated notifications.\n`);
}

// Check if running on demand via CLI: node scripts/cron-service.js --now
if (process.argv.includes("--now")) {
  executeDailyStentCheck().then(() => {
    console.log("Single on-demand execution finished.");
    process.exit(0);
  });
} else {
  console.log("⏰ [CRON SERVICE] Initialized daily cron runner (Scheduled for 08:00 AM IST daily: '0 8 * * *')");
  cron.schedule("0 8 * * *", () => {
    executeDailyStentCheck();
  });
}

module.exports = { executeDailyStentCheck, evaluateTrigger, generateBilingualMessage };