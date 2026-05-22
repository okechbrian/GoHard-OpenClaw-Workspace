import { sql } from "@/lib/db";
import { corsHeaders, handlePreflight, checkApiKey } from "@/lib/store-cors";
import { generateId, generateStoreOrderNumber } from "@/lib/utils";
import { sendWhatsAppText, normalizePhoneDigits } from "@/lib/whatsapp-bot";
import { sendTelegramText } from "@/lib/telegram-bot";
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
      const productRows = await sql`
        SELECT base_price, print_fee FROM products WHERE id = ${item.product_id}
      ` as Array<{ base_price: number; print_fee: number }>;
      const product = productRows[0];
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400, headers });
      }
      const qty = item.quantity || 1;
      const unitPrice = Number(product.base_price) + Number(product.print_fee);
      const subtotal = unitPrice * qty;
      totalAmount += subtotal;
      resolvedItems.push({
        product_id: item.product_id, quantity: qty, unit_price: unitPrice, subtotal,
        customizations: item.customizations || {},
      });
    }

    const depositAmount = Math.ceil(totalAmount * 0.5);
    const deliveryAddress = body.delivery_address?.trim() || "Digital Delivery";
    const artworkUrlsJson = body.artwork_urls?.length ? JSON.stringify(body.artwork_urls) : null;

    if (artworkUrlsJson) {
      await sql`
        INSERT INTO orders (
          id, order_number, guest_name, guest_phone, guest_email,
          status, total_amount, deposit_amount, source, service_type,
          payment_method, payment_status,
          delivery_address, notes, deadline_date, artwork_urls
        ) VALUES (
          ${orderId}, ${orderNumber}, ${body.guest_name.trim()}, ${body.guest_phone.trim()}, ${body.guest_email?.trim() || null},
          'pending', ${totalAmount}, ${depositAmount}, 'store', ${serviceType},
          ${paymentMethod}, 'pending',
          ${deliveryAddress}, ${body.notes?.trim() || null}, ${body.deadline_date || null},
          ${artworkUrlsJson}::jsonb
        )
      `;
    } else {
      await sql`
        INSERT INTO orders (
          id, order_number, guest_name, guest_phone, guest_email,
          status, total_amount, deposit_amount, source, service_type,
          payment_method, payment_status,
          delivery_address, notes, deadline_date
        ) VALUES (
          ${orderId}, ${orderNumber}, ${body.guest_name.trim()}, ${body.guest_phone.trim()}, ${body.guest_email?.trim() || null},
          'pending', ${totalAmount}, ${depositAmount}, 'store', ${serviceType},
          ${paymentMethod}, 'pending',
          ${deliveryAddress}, ${body.notes?.trim() || null}, ${body.deadline_date || null}
        )
      `;
    }

    for (const it of resolvedItems) {
      await sql`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, customizations)
        VALUES (${generateId()}, ${orderId}, ${it.product_id}, ${it.quantity}, ${it.unit_price}, ${it.subtotal},
                ${JSON.stringify(it.customizations)}::jsonb)
      `;
    }

    await sql`
      INSERT INTO order_status_history (id, order_id, status, notes)
      VALUES (${generateId()}, ${orderId}, 'pending', 'Store order created – awaiting payment')
    `;

    // Outbound WhatsApp notifications
    const phone = body.guest_phone.trim();
    const name = body.guest_name.trim();
    const orderRef = orderNumber;
    const deposit = depositAmount;
    const total = totalAmount;

    const ORDER_APP_URL = (
      process.env.ORDERS_APP_PUBLIC_URL ||
      process.env.ORDERS_APP_URL ||
      "https://pwata-orders.vercel.app"
    ).replace(/\/$/, "");

    // 1. Client Order Confirmation
    const clientMessage = [
      `Hi ${name.split(" ")[0]}, we've received your Pwata order brief! 🎨`,
      "",
      `Order Number: *${orderRef}*`,
      `Total Amount: UGX ${total.toLocaleString()}`,
      `50% Deposit: *UGX ${deposit.toLocaleString()}*`,
      "",
      `You can track your design progress and updates here:`,
      `${ORDER_APP_URL}/track/${orderRef}`,
      "",
      `We will review your brief and contact you here on WhatsApp shortly to confirm details and arrange payment of the deposit. Thank you!`,
    ].join("\n");

    try {
      const normalizedPhone = normalizePhoneDigits(phone);
      await sendWhatsAppText(normalizedPhone, clientMessage);
      console.log(`✅ Outbound order confirmation WhatsApp sent to client ${normalizedPhone}`);
    } catch (err) {
      console.error("❌ Failed to send WhatsApp order confirmation to client:", err);
    }

    // 2. Admin Alert Notification
    const adminPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "256775931342";
    const adminMessage = [
      `🚨 *New Pwata Order Received!*`,
      "",
      `Order Number: *${orderRef}*`,
      `Client: *${name}* (${phone})`,
      `Service: *${body.service_type || "merchandise"}*`,
      `Total Amount: UGX ${total.toLocaleString()}`,
      `Deposit Due: UGX ${deposit.toLocaleString()}`,
      "",
      `View order details and track updates in the admin dashboard:`,
      `https://pwata-accounting.vercel.app/orders/${orderId}`,
    ].join("\n");

    try {
      const normalizedAdminPhone = normalizePhoneDigits(adminPhone);
      await sendWhatsAppText(normalizedAdminPhone, adminMessage);
      console.log(`✅ Admin notification WhatsApp sent to ${normalizedAdminPhone}`);
    } catch (err) {
      console.error("❌ Failed to send WhatsApp admin notification:", err);
    }

    // 3. Telegram Admin Alert Notification
    const telegramAdminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (telegramAdminChatId) {
      try {
        // We can reuse the same adminMessage text, as Telegram supports Markdown similarly
        await sendTelegramText(telegramAdminChatId, adminMessage);
        console.log(`✅ Admin notification Telegram sent to Chat ID ${telegramAdminChatId}`);
      } catch (err) {
        console.error("❌ Failed to send Telegram admin notification:", err);
      }
    }

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
