import { initiatePayment } from "@/lib/accounting-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await initiatePayment(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Failed to initiate payment" }, { status: 500 });
  }
}
