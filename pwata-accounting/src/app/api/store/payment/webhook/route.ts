import sqlite from "@/lib/db";
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

    const order = sqlite.prepare(
      "SELECT id, payment_status, source FROM orders WHERE id = ?"
    ).get(orderId) as any;

    if (!order || order.source !== "store") return NextResponse.json({ ok: true });

    // Idempotent
    if (order.payment_status === "partial" || order.payment_status === "paid") {
      return NextResponse.json({ ok: true });
    }

    if (status === "successful" && data?.status === "successful") {
      sqlite.prepare(
        "UPDATE orders SET payment_status = 'partial', status = 'in_design', payment_reference = ?, updated_at = datetime('now') WHERE id = ?"
      ).run(data.flw_ref ?? data.id, orderId);

      // Auto-create Sale + Invoice now that the deposit is in.
      // Pass a richer note to be recorded in order_status_history.
      await onOrderStatusChange(orderId, "in_design", null, {
        note: `Deposit paid via ${data.payment_type ?? "mobile money"} — ref ${data.flw_ref ?? data.id}`,
      });
    } else if (status === "failed" || data?.status === "failed") {
      sqlite.prepare(
        "UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?"
      ).run(orderId);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to prevent Flutterwave retries
    return NextResponse.json({ ok: true });
  }
}
