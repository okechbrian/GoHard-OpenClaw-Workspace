import { sql } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/flutterwave";
import { onOrderStatusChange } from "@/lib/automation";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const incomingHash = request.headers.get("verif-hash") ?? "";
    const secretHash = process.env.FLW_SECRET_HASH ?? "";

    if (!secretHash || !verifyWebhookSignature(secretHash, incomingHash)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { status, data } = payload;
    const orderId = data?.meta?.order_id ?? data?.meta_data?.order_id;
    if (!orderId) return NextResponse.json({ ok: true });

    const rows = await sql`
      SELECT id, payment_status, source FROM orders WHERE id = ${orderId}
    ` as any[];
    const order = rows[0];

    if (!order || order.source !== "store") return NextResponse.json({ ok: true });
    if (order.payment_status === "partial" || order.payment_status === "paid") {
      return NextResponse.json({ ok: true });
    }

    if (status === "successful" && data?.status === "successful") {
      const ref = data.flw_ref ?? data.id;
      await sql`
        UPDATE orders
        SET payment_status = 'partial', status = 'in_design',
            payment_reference = ${ref}, updated_at = NOW()
        WHERE id = ${orderId}
      `;

      await onOrderStatusChange(orderId, "in_design", null, {
        note: `Deposit paid via ${data.payment_type ?? "mobile money"} — ref ${ref}`,
      });
    } else if (status === "failed" || data?.status === "failed") {
      await sql`
        UPDATE orders SET payment_status = 'failed', updated_at = NOW()
        WHERE id = ${orderId}
      `;
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}
