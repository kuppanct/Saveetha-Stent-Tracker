import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const stentId = (formData.get("stentId") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${stentId}-${Date.now()}.jpg`;

    if (isSupabaseConfigured && supabase) {
      // Ensure bucket exists or upload directly
      const { data, error } = await supabase.storage
        .from("stent_images")
        .upload(fileName, buffer, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.warn("Supabase storage upload error, using data URL:", error.message);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from("stent_images")
          .getPublicUrl(fileName);

        return NextResponse.json({
          success: true,
          url: publicUrlData.publicUrl,
        });
      }
    }

    // Fallback: Return Base64 Data URL so local development & preview works seamlessly
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}
