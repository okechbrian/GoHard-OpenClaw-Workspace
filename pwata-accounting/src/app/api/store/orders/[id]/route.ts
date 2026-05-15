import sqlite from "@/lib/db";
import { corsHeaders, handlePreflight } from "@/lib/store-cors";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)!;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const { id } = await params;
    const order = sqlite.prepare(
      "SELECT id, order_number, status, payment_status, total_amount, deposit_amount, source, service_type, deadline_date, artwork_urls, notes, created_at FROM orders WHERE id = ?"
    ).get(id) as any;

    if (!order || order.source !== "store") {
      return NextResponse.json({ error: "Order not found" }, { status: 404, headers });
    }

    const items = sqlite.prepare(`
      SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.unit_price, oi.subtotal, oi.customizations
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(id);

    return NextResponse.json({ ...order, items }, { headers });
  } catch {
    const o2 = request.headers.get("origin");
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500, headers: corsHeaders(o2) });
  }
}
