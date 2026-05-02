import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = sqlite.prepare(
      "SELECT id, order_number, status, payment_status, total_amount, deposit_amount, source, deadline_date, artwork_urls, notes, created_at FROM orders WHERE id = ?"
    ).get(id) as any;

    if (!order || order.source !== "store") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const items = sqlite.prepare(`
      SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.unit_price, oi.subtotal, oi.customizations
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    return NextResponse.json({ ...order, items });
  } catch {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
