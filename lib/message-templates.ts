import { SecondLanguage, Laterality, UnitType } from "./types";
import { format, parseISO } from "date-fns";

export interface MessageVariables {
  patientName: string;
  laterality: Laterality;
  insertionDate: string; // YYYY-MM-DD or formatted
  dueDate: string; // YYYY-MM-DD or formatted
  unit?: UnitType | string;
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
 * Incorporates Unit 1 (Monday/Wednesday) and Unit 2 (Tuesday/Thursday) OPD days.
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
  const isUnit2 = variables.unit === "Unit 2";

  // OPD Days & Chiefs
  const unitName = isUnit2 ? "Unit 2 (Prof. M. Siva Sankar)" : "Unit 1 (Prof. N. Muthulatha)";
  const opDaysEn = isUnit2 ? "Tuesday or Thursday (Unit 2 OPD)" : "Monday or Wednesday (Unit 1 OPD)";
  const opDaysTa = isUnit2 
    ? "செவ்வாய் அல்லது வியாழக்கிழமை (Unit 2 - பேராசிரியர் டாக்டர் M. சிவ சங்கர் OPD)"
    : "திங்கள் அல்லது புதன்கிழமை (Unit 1 - பேராசிரியர் டாக்டர் N. முத்துலதா OPD)";
  const opDaysHi = isUnit2 ? "मंगलवार या गुरुवार (Unit 2 OPD)" : "सोमवार या बुधवार (Unit 1 OPD)";

  let englishPart = "";
  let regionalPart = "";

  switch (templateType) {
    case "PRE_EXPIRY":
      englishPart = `Dear ${patientName}, this is a reminder from the Dept of Urology, Saveetha Medical College & Hospital. The DJ stent placed in your ${lateralityEn} kidney on ${insertionDate} is due for removal on ${dueDate}. Please report to Saveetha Urology OPD on ${opDaysEn}. Delaying removal can cause severe infection, stone formation, or kidney damage.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `அன்புள்ள ${patientName}, உங்கள் ${lateralityReg} சிறுநீரகத்தில் ${insertionDate} அன்று வைக்கப்பட்ட ஸ்டென்ட் (DJ Stent) ${dueDate} அன்று எடுக்கப்பட வேண்டும். தயவுசெய்து ${opDaysTa}-ல் சவீதா மருத்துவமனைக்கு வரவும். தாமதம் செய்தால் கல் உருவாவது, கொடிய தொற்று அல்லது சிறுநீரக பாதிப்பு ஏற்படலாம்.`;
      } else {
        regionalPart = `प्रिय ${patientName}, आपके ${lateralityReg} गुर्दे में ${insertionDate} को डाला गया डीजे स्टेंट (DJ Stent) ${dueDate} को निकाला जाना है। कृपया ${opDaysHi} को सवीता अस्पताल आएं। देरी से पथरी, गंभीर संक्रमण या गुर्दे को नुकसान हो सकता है।`;
      }
      break;

    case "DUE_TODAY":
      englishPart = `URGENT REMINDER: Dear ${patientName}, your DJ stent removal for ${lateralityEn} kidney is scheduled for TODAY. Please visit the Saveetha Urology OPD (${unitName}) immediately. Failure to remove the stent on time carries high risks of life-threatening infection and kidney failure.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `அவசர நினைவூட்டல்: ${patientName}, உங்கள் ${lateralityReg} சிறுநீரக ஸ்டென்ட் (DJ Stent) எடுப்பதற்கான நாள் இன்று. உடனடியாக சவீதா மருத்துவமனை சிறுநீரகவியல் துறைக்கு (${opDaysTa}) வரவும். தவறினால் உயிருக்கு ஆபத்தான தொற்று மற்றும் சிறுநீரக செயலிழப்பு ஏற்பட அதிக வாய்ப்புள்ளது.`;
      } else {
        regionalPart = `अति आवश्यक: ${patientName}, आपका ${lateralityReg} गुर्दे का स्टेंट (DJ Stent) निकालने का दिन आज है। तुरंत सवीता अस्पताल के यूरोलॉजी विभाग (${opDaysHi}) में आएं। स्टेंट न निकालने पर जानलेवा संक्रमण और गुर्दे के फेल होने का खतरा है।`;
      }
      break;

    case "OVERDUE":
      englishPart = `CRITICAL MEDICAL ALERT: Dear ${patientName}, your DJ stent in ${lateralityEn} kidney (inserted on ${insertionDate}) is OVERDUE / FORGOTTEN. Leaving a stent inside beyond its expiry period causes severe calcification, life-threatening infection, and permanent kidney loss, requiring complex major surgeries. You are strictly instructed to report on the very next ${opDaysEn} to the Saveetha Urology OPD for urgent stent removal. The hospital is not responsible for any complications or kidney damage arising from your delay.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `தீவிர மருத்துவ எச்சரிக்கை: ${patientName}, உங்கள் ${lateralityReg} சிறுநீரகத்தில் ${insertionDate} அன்று வைக்கப்பட்ட ஸ்டென்ட் (DJ Stent) எடுப்பதற்கான காலக்கெடு முடிந்துவிட்டது. இதை உடனே எடுக்காவிட்டால் கல் அடைப்பு, கொடிய தொற்று மற்றும் நிரந்தர சிறுநீரக செயலிழப்பு ஏற்படும். உடனடியாக வரும் ${opDaysTa}-ல் சவீதா மருத்துவமனை புறநோயாளிகள் பிரிவுக்கு (OPD) வந்து ஸ்டென்டை உடனே எடுத்துக்கொள்ளவும். உங்களின் இந்த தாமதத்தால் ஏற்படும் எவ்வித பக்கவிளைவுகளுக்கும் அல்லது சிறுநீரக இழப்பிற்கும் மருத்துவமனை பொறுப்பேற்காது.`;
      } else {
        regionalPart = `गंभीर स्वास्थ्य चेतावनी: ${patientName}, आपके ${lateralityReg} गुर्दे में ${insertionDate} को डाला गया डीजे स्टेंट निकालने की समय सीमा समाप्त हो चुकी है। इसे अंदर छोड़ने से गुर्दे को स्थायी नुकसान हो सकता है। कृपया तुरंत आने वाले ${opDaysHi} को सवीता अस्पताल आकर तुरंत स्टेंट निकलवाएं। आपकी देरी से होने वाली जटिलताओं के लिए अस्पताल जिम्मेदार नहीं होगा।`;
      }
      break;

    case "REMOVED":
      englishPart = `Dear ${patientName}, your ${lateralityEn} kidney DJ stent has been successfully removed/exchanged under ${unitName}. Please follow your doctor's medication and follow-up advice.`;

      if (secondLanguage === "Tamil") {
        regionalPart = `${patientName}, உங்கள் ${lateralityReg} சிறுநீரக ஸ்டென்ட் (DJ Stent) வெற்றிகரமாக எடுக்கப்பட்டுவிட்டது/மாற்றப்பட்டுவிட்டது (${unitName}). மருத்துவரின் மருந்து மற்றும் அறிவுரைகளை பின்பற்றவும்.`;
      } else {
        regionalPart = `${patientName}, आपका ${lateralityReg} गुर्दे का स्टेंट (DJ Stent) सफलतापूर्वक निकाल/बदल दिया गया है। कृपया डॉक्टर की सलाह का पालन करें।`;
      }
      break;
  }

  const fullMessage = `🏥 *SAVEETHA MEDICAL COLLEGE & HOSPITAL*\n*Department of Urology • ${unitName}*\n\n${englishPart}\n\n━━━━━━━━━━━━━━━━━━━━\n\n${regionalPart}\n\n📞 Urology Helpline / OPD: 044 6672 6618 / Saveetha Hospital Thandalam`;

  return { englishPart, regionalPart, fullMessage };
}