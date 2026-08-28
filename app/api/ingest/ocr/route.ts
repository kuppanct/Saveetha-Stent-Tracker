import { NextRequest, NextResponse } from "next/server";
import { parseOCRText } from "@/lib/text-parser";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ocrText } = body;

    if (!ocrText) {
      return NextResponse.json({ error: "Missing OCR text" }, { status: 400 });
    }

    const parsed = parseOCRText(ocrText);
    return NextResponse.json({ success: true, parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to parse OCR" }, { status: 500 });
  }
}
