import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = sqlite.prepare(
      "SELECT id, order_number, status, payment_status, total_amount, deposit_amount, source, created_at FROM orders WHERE id = ?"
    ).get(id) as any;

    if (!order || order.source !== "store") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
