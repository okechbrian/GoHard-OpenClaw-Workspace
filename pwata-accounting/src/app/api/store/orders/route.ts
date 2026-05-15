import sqlite from "@/lib/db";
import { corsHeaders, handlePreflight, checkApiKey } from "@/lib/store-cors";
import { generateId, generateStoreOrderNumber } from "@/lib/utils";
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

    if (!body.guest_name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400, headers });
    }
    if (!body.guest_phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400, headers });
    }
    if (!body.delivery_address?.trim() && body.service_type !== "digital") {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400, headers });
    }
    if (!body.items?.length) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400, headers });
    }
    if (!["MTN", "AIRTEL"].includes(body.momo_network)) {
      return NextResponse.json({ error: "Select MTN MoMo or Airtel Money" }, { status: 400, headers });
    }

    const orderId = generateId();
    const orderNumber = generateStoreOrderNumber();
    const paymentMethod = body.momo_network === "MTN" ? "mtn_momo" : "airtel_money";
    const serviceType = body.service_type || "merchandise";

    let totalAmount = 0;
    const resolvedItems: Array<{ product_id: string; quantity: number; unit_price: number; subtotal: number; customizations: object }> = [];

    for (const item of body.items) {
      const product = sqlite.prepare(
        "SELECT base_price, print_fee FROM products WHERE id = ?"
      ).get(item.product_id) as { base_price: number; print_fee: number } | undefined;

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400, headers });
      }
      const qty = item.quantity || 1;
      const unitPrice = product.base_price + product.print_fee;
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;
      resolvedItems.push({ product_id: item.product_id, quantity: qty, unit_price: unitPrice, subtotal, customizations: item.customizations || {} });
    }

    const depositAmount = Math.ceil(totalAmount * 0.5);
    const deliveryAddress = body.delivery_address?.trim() || "Digital Delivery";

    sqlite.prepare(`
      INSERT INTO orders (id, order_number, guest_name, guest_phone, guest_email,
        status, total_amount, deposit_amount, source, service_type, payment_method, payment_status,
        delivery_address, notes, deadline_date, artwork_urls, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, 'store', ?, ?, 'pending', ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      orderId, orderNumber,
      body.guest_name.trim(), body.guest_phone.trim(), body.guest_email?.trim() || null,
      totalAmount, depositAmount, serviceType, paymentMethod,
      deliveryAddress, body.notes?.trim() || null,
      body.deadline_date || null,
      body.artwork_urls?.length ? JSON.stringify(body.artwork_urls) : null
    );

    const itemInsert = sqlite.prepare(`
      INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, customizations, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    for (const it of resolvedItems) {
      itemInsert.run(generateId(), orderId, it.product_id, it.quantity, it.unit_price, it.subtotal, JSON.stringify(it.customizations));
    }

    sqlite.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by, notes, created_at)
      VALUES (?, ?, 'pending', null, 'Store order created – awaiting payment', datetime('now'))
    `).run(generateId(), orderId);

    return NextResponse.json(
      { id: orderId, order_number: orderNumber, total_amount: totalAmount, deposit_amount: depositAmount },
      { status: 201, headers }
    );

  } catch (error) {
    console.error("Store order creation error:", error);
    const origin2 = request.headers.get("origin");
    return NextResponse.json({ error: "Failed to create order" }, { status: 500, headers: corsHeaders(origin2) });
  }
}
