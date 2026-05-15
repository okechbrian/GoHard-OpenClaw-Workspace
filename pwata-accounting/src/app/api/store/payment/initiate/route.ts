import sqlite from "@/lib/db";
import { corsHeaders, handlePreflight, checkApiKey } from "@/lib/store-cors";
import { generateId } from "@/lib/utils";
import { initiateCharge } from "@/lib/flutterwave";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request)!;
}

export async function POST(request: NextRequest) {
  const preflight = handlePreflight(request);
  if (preflight) return preflight;

  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (origin && !checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  try {
    const body = await request.json();
    const { order_id, phone_number, network, customer_name, customer_email } = body;

    if (!order_id || !phone_number || !network || !customer_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers });
    }

    const order = sqlite.prepare(
      "SELECT id, order_number, deposit_amount, payment_status, source FROM orders WHERE id = ?"
    ).get(order_id) as any;

    if (!order || order.source !== "store") {
      return NextResponse.json({ error: "Order not found" }, { status: 404, headers });
    }
    if (order.payment_status !== "pending") {
      return NextResponse.json({ error: "Payment already processed" }, { status: 400, headers });
    }

    const txRef = generateId();
    sqlite.prepare("UPDATE orders SET payment_reference = ? WHERE id = ?").run(txRef, order_id);

    const emailFallback = customer_email?.trim() ||
      `${phone_number.replace(/\D/g, "")}@orders.pwata.ug`;

    const result = await initiateCharge({
      amount: order.deposit_amount,
      email: emailFallback,
      phone_number,
      network: network as "MTN" | "AIRTEL",
      tx_ref: txRef,
      order_id,
      customer_name,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 502, headers });
    }

    return NextResponse.json(
      { success: true, tx_ref: txRef, message: "Check your phone for a payment prompt" },
      { headers }
    );

  } catch (error) {
    console.error("Payment initiation error:", error);
    const o2 = request.headers.get("origin");
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500, headers: corsHeaders(o2) });
  }
}
