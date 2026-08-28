import { NextRequest, NextResponse } from "next/server";
import { exchangeStent } from "@/lib/db-service";
import { ExchangeStentInput } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const old_stent_id = params.id;

    const input: ExchangeStentInput = {
      old_stent_id,
      unit: body.unit,
      laterality: body.laterality,
      material: body.material,
      insertion_date: body.insertion_date,
      planned_removal_date: body.planned_removal_date,
      residual_stone: Boolean(body.residual_stone),
      inserted_by: body.inserted_by,
      notes: body.notes,
    };

    const result = await exchangeStent(input);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to exchange stent" },
      { status: 500 }
    );
  }
}