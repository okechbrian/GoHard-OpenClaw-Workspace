import { sql } from "@/lib/db";
import { onOrderStatusChange } from "@/lib/automation";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reference = String(body.reference ?? "").trim() || `manual-${Date.now()}`;
    const note = String(body.note ?? "").trim() || "Deposit marked paid manually";

    const rows = (await sql`
      SELECT id, source, payment_status FROM orders WHERE id = ${orderId}
    `) as Array<{ id: string; source: string; payment_status: string }>;
    const order = rows[0];

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.source !== "store") {
      return NextResponse.json({ error: "Manual deposit marking is only for store orders" }, { status: 400 });
    }
    if (order.payment_status === "partial" || order.payment_status === "paid") {
      return NextResponse.json({ error: "Deposit already paid" }, { status: 400 });
    }

    await sql`
      UPDATE orders
      SET payment_status = 'partial',
          status = 'in_design',
          payment_reference = ${reference},
          updated_at = NOW()
      WHERE id = ${orderId}
    `;

    const result = await onOrderStatusChange(orderId, "in_design", user.id, {
      note: `${note} (ref ${reference})`,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("mark-deposit-paid error:", err);
    return NextResponse.json({ error: "Failed to mark deposit paid" }, { status: 500 });
  }
}
