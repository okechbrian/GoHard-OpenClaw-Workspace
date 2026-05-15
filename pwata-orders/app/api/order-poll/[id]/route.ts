import { pollOrder } from "@/lib/accounting-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await pollOrder(id);
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(data);
}
