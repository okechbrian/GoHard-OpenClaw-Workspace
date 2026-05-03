import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customer_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    let query = `
      SELECT
        o.*,
        o.deposit_amount,
        o.source,
        c.name as customer_name,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) { query += ` AND o.status = ?`; params.push(status); }
    if (customerId) { query += ` AND o.customer_id = ?`; params.push(customerId); }
    if (from) { query += ` AND o.created_at >= ?`; params.push(from); }
    if (to) { query += ` AND o.created_at <= ?`; params.push(to); }
    if (search) {
      query += ` AND (
        o.order_number LIKE ? OR
        c.name LIKE ? OR
        o.guest_name LIKE ? OR
        o.guest_phone LIKE ?
      )`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
    const orders = sqlite.prepare(query).all(...params);
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);

    // Validate required fields
    if (!body.items || !body.items.length) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }

    if (!body.delivery_address) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    if (!body.payment_method || !['cash', 'mtn_momo', 'airtel_money'].includes(body.payment_method)) {
      return NextResponse.json({ error: "Valid payment method is required" }, { status: 400 });
    }

    // Validate customer or guest info
    if (!body.customer_id && (!body.guest_name || !body.guest_phone)) {
      return NextResponse.json({ error: "Either customer_id or guest_name + guest_phone is required" }, { status: 400 });
    }

    const orderId = generateId();

    // Generate order number: PW-YYYYMMDD-XXX
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `PW-${datePart}-${randomPart}`;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of body.items) {
      const product = sqlite.prepare("SELECT base_price, print_fee FROM products WHERE id = ?").get(item.product_id) as { base_price: number, print_fee: number };
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 });
      }
      const itemTotal = (product.base_price + product.print_fee) * (item.quantity || 1);
      totalAmount += itemTotal;
    }

    // Insert order
    sqlite.prepare(`
      INSERT INTO orders (id, order_number, customer_id, guest_name, guest_phone, guest_email,
                         status, total_amount, payment_method, payment_status, delivery_address,
                         notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, 'pending', ?, ?, datetime('now'), datetime('now'))
    `).run(
      orderId, orderNumber, body.customer_id || null, body.guest_name || null,
      body.guest_phone || null, body.guest_email || null, totalAmount,
      body.payment_method, body.delivery_address, body.notes || null
    );

    // Insert order items
    const itemInsert = sqlite.prepare(`
      INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, customizations, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    for (const item of body.items) {
      const product = sqlite.prepare("SELECT base_price, print_fee FROM products WHERE id = ?").get(item.product_id) as { base_price: number, print_fee: number };
      const unitPrice = product.base_price + product.print_fee;
      const subtotal = unitPrice * (item.quantity || 1);

      itemInsert.run(
        generateId(), orderId, item.product_id, item.quantity || 1,
        unitPrice, subtotal, JSON.stringify(item.customizations || {})
      );
    }

    // Insert initial status history
    sqlite.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by, notes, created_at)
      VALUES (?, ?, 'pending', ?, 'Order created', datetime('now'))
    `).run(generateId(), orderId, user?.id ?? null);

    // Fetch and return the complete order
    const order = sqlite.prepare(`
      SELECT o.*, c.name as customer_name
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(orderId);

    const items = sqlite.prepare(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    return NextResponse.json({ ...(order as object), items }, { status: 201 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}