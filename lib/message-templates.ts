import { SecondLanguage, Laterality } from "./types";
import { format, parseISO } from "date-fns";

export interface MessageVariables {
  patientName: string;
  laterality: Laterality;
  insertionDate: string; // YYYY-MM-DD or formatted
  dueDate: string; // YYYY-MM-DD or formatted
}

export type TemplateType = "PRE_EXPIRY" | "DUE_TODAY" | "OVERDUE" | "REMOVED";

export function formatLaterality(laterality: Laterality, language: SecondLanguage | "English"): string {
  if (language === "Tamil") {
    switch (laterality) {
      case "Left": return "இடது (Left)";
      case "Right": return "வலது (Right)";
      case "Bilateral": return "இருபுறமும் (Bilateral)";
      default: return laterality;
    }
  }
  if (language === "Hindi") {
    switch (laterality) {
      case "Left": return "बाएं (Left)";
      case "Right": return "दाएं (Right)";
      case "Bilateral": return "दोनों (Bilateral)";
      default: return laterality;
    }
  }
  return laterality;
}

export function formatDateForDisplay(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

/**
 * Builds the exact bilingual message where the first half is ALWAYS in English,
 * and the second half is either in Tamil or Hindi based on patient.second_language.
 */
export function buildBilingualMessage(
  templateType: TemplateType,
  variables: MessageVariables,
  secondLanguage: SecondLanguage
): { englishPart: string; regionalPart: string; fullMessage: string } {
  const patientName = variables.patientName.trim();
  const lateralityEn = formatLaterality(variables.laterality, "English");
  const lateralityReg = formatLaterality(variables.laterality, secondLanguage);
  const insertionDate = formatDateForDisplay(variables.insertionDate);
  const dueDate = formatDateForDisplay(variables.dueDate);

  let englishPart = "";
  let regionalPart = "";

  switch (templateType) {
    case "PRE_EXPIRY":
      englishPart = `Dear ${patientName}, this is a reminder from the Dept of Urology, Saveetha Medical College & Hospital. The DJ stent placed in your ${lateralityEn} kidney on ${insertionDate} is due for removal on ${dueDate}. Please visit the OPD. Delaying removal can cause severe infection, stone formation, or kidney damage.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `அன்புள்ள ${patientName}, உங்கள் ${lateralityReg} சிறுநீரகத்தில் ${insertionDate} அன்று வைக்கப்பட்ட ஸ்டென்ட் (DJ Stent) ${dueDate} அன்று எடுக்கப்பட வேண்டும். தாமதம் செய்தால் கல் உருவாவது, கொடிய தொற்று அல்லது சிறுநீரக பாதிப்பு ஏற்படலாம். தயவுசெய்து சவீதா மருத்துவமனைக்கு வரவும்.`;
      } else {
        regionalPart = `प्रिय ${patientName}, आपके ${lateralityReg} गुर्दे में ${insertionDate} को डाला गया डीजे स्टेंट (DJ Stent) ${dueDate} को निकाला जाना है। देरी से पथरी, गंभीर संक्रमण या गुर्दे को नुकसान हो सकता है। कृपया सवीता अस्पताल आएं।`;
      }
      break;

    case "DUE_TODAY":
      englishPart = `URGENT REMINDER: Dear ${patientName}, your DJ stent removal for ${lateralityEn} kidney is scheduled for TODAY. Please visit the Saveetha Urology OPD immediately. Failure to remove the stent on time carries high risks of life-threatening infection and kidney failure.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `அவசர நினைவூட்டல்: ${patientName}, உங்கள் ${lateralityReg} சிறுநீரக ஸ்டென்ட் (DJ Stent) எடுப்பதற்கான நாள் இன்று. உடனடியாக சவீதா மருத்துவமனை சிறுநீரகவியல் துறைக்கு வரவும். தவறினால் உயிருக்கு ஆபத்தான தொற்று மற்றும் சிறுநீரக செயலிழப்பு ஏற்பட அதிக வாய்ப்புள்ளது.`;
      } else {
        regionalPart = `अति आवश्यक: ${patientName}, आपका ${lateralityReg} गुर्दे का स्टेंट (DJ Stent) निकालने का दिन आज है। तुरंत सवीता अस्पताल के यूरोलॉजी विभाग में आएं। स्टेंट न निकालने पर जानलेवा संक्रमण और गुर्दे के फेल होने का खतरा है।`;
      }
      break;

    case "OVERDUE":
      englishPart = `CRITICAL MEDICAL ALERT: Dear ${patientName}, your DJ stent removal for ${lateralityEn} kidney is OVERDUE. It was placed on ${insertionDate}. Leaving a stent inside beyond its expiry period leads to permanent kidney damage, severe calcification, and may require major complex surgeries to remove. The hospital is not responsible for any complications or kidney loss arising from your delay. Report to Saveetha Medical College Urology OPD immediately.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `தீவிர மருத்துவ எச்சரிக்கை: ${patientName}, உங்கள் ${lateralityReg} சிறுநீரக ஸ்டென்ட் (DJ Stent) எடுப்பதற்கான காலக்கெடு முடிந்துவிட்டது. இதை அப்படியே விட்டுவைத்தால் சிறுநீரகம் நிரந்தரமாக பாதிக்கப்படும், மற்றும் பெரிய அறுவை சிகிச்சை தேவைப்படலாம். உங்களின் இந்த தாமதத்தால் ஏற்படும் எவ்வித பக்கவிளைவுகளுக்கும் மருத்துவமனை பொறுப்பேற்காது. உடனடியாக சவீதா மருத்துவமனைக்கு வரவும்.`;
      } else {
        regionalPart = `गंभीर स्वास्थ्य चेतावनी: ${patientName}, आपका ${lateralityReg} गुर्दे का स्टेंट (DJ Stent) निकालने की समय सीमा पार हो चुकी है। इसे अंदर छोड़ने से गुर्दे को स्थायी नुकसान हो सकता है और बड़ी सर्जरी की आवश्यकता हो सकती है। आपकी देरी से होने वाली किसी भी जटिलता के लिए अस्पताल जिम्मेदार नहीं होगा। तुरंत सवीता अस्पताल आएं।`;
      }
      break;

    case "REMOVED":
      englishPart = `Dear ${patientName}, your ${lateralityEn} kidney DJ stent has been successfully removed/exchanged. Please follow your doctor's medication and follow-up advice.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `${patientName}, உங்கள் ${lateralityReg} சிறுநீரக ஸ்டென்ட் (DJ Stent) வெற்றிகரமாக எடுக்கப்பட்டுவிட்டது/மாற்றப்பட்டுவிட்டது. மருத்துவரின் அறிவுரைகளை பின்பற்றவும்.`;
      } else {
        regionalPart = `${patientName}, आपका ${lateralityReg} गुर्दे का स्टेंट (DJ Stent) सफलतापूर्वक निकाल/बदल दिया गया है। कृपया डॉक्टर की सलाह का पालन करें।`;
      }
      break;
  }

  const fullMessage = `🏥 *SAVEETHA MEDICAL COLLEGE & HOSPITAL*\n*Department of Urology*\n\n${englishPart}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${regionalPart}\n\n📞 Urology Helpline / OPD: 044-66726672 / Saveetha Hospital Thandalam`;

  return { englishPart, regionalPart, fullMessage };
}