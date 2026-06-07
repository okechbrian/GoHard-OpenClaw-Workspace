import { sql } from "@/lib/db";
import { generateId, generateStoreOrderNumber } from "@/lib/utils";
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
      SELECT o.*, o.deposit_amount, o.source,
             c.name AS customer_name,
             COUNT(oi.id)::int AS item_count
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let p = 1;

    if (status) { query += ` AND o.status = $${p++}`; params.push(status); }
    if (customerId) { query += ` AND o.customer_id = $${p++}`; params.push(customerId); }
    if (from) { query += ` AND o.created_at >= $${p++}`; params.push(from); }
    if (to) { query += ` AND o.created_at <= $${p++}`; params.push(to); }
    if (search) {
      const i1 = p++, i2 = p++, i3 = p++, i4 = p++;
      query += ` AND (o.order_number ILIKE $${i1} OR c.name ILIKE $${i2} OR o.guest_name ILIKE $${i3} OR o.guest_phone ILIKE $${i4})`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }
    query += ` GROUP BY o.id, c.name, o.source, o.deposit_amount ORDER BY o.created_at DESC`;

    const result = await sql.query(query, params);
    const orders = Array.isArray(result) ? result : (result.rows ?? []);
    return NextResponse.json(orders);
  } catch (error) {
    console.error("orders fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);

    if (!body.items?.length) {
      return NextResponse.json({ error: "At least one item is required" }, { status: 400 });
    }
    if (!body.delivery_address) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }
    if (!body.payment_method || !['cash', 'mtn_momo', 'airtel_money'].includes(body.payment_method)) {
      return NextResponse.json({ error: "Valid payment method is required" }, { status: 400 });
    }
    if (!body.customer_id && (!body.guest_name || !body.guest_phone)) {
      return NextResponse.json({ error: "Either customer_id or guest_name + guest_phone is required" }, { status: 400 });
    }

    const orderId = generateId();
    const orderNumber = generateStoreOrderNumber();

    let totalAmount = 0;
    const resolved: Array<{ pid: string; qty: number; unit: number; sub: number; customizations: object }> = [];
    for (const item of body.items) {
      const rows = await sql`
        SELECT base_price, print_fee FROM products WHERE id = ${item.product_id}
      ` as Array<{ base_price: number; print_fee: number }>;
      const product = rows[0];
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 });
      }
      const qty = item.quantity || 1;
      const unit = Number(product.base_price) + Number(product.print_fee);
      const sub = unit * qty;
      totalAmount += sub;
      resolved.push({ pid: item.product_id, qty, unit, sub, customizations: item.customizations || {} });
    }

    await sql`
      INSERT INTO orders (id, order_number, customer_id, guest_name, guest_phone, guest_email,
        status, total_amount, payment_method, payment_status, delivery_address, notes)
      VALUES (${orderId}, ${orderNumber}, ${body.customer_id || null}, ${body.guest_name || null},
              ${body.guest_phone || null}, ${body.guest_email || null},
              'pending', ${totalAmount}, ${body.payment_method}, 'pending',
              ${body.delivery_address}, ${body.notes || null})
    `;

    for (const r of resolved) {
      await sql`
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal, customizations)
        VALUES (${generateId()}, ${orderId}, ${r.pid}, ${r.qty}, ${r.unit}, ${r.sub},
                ${JSON.stringify(r.customizations)}::jsonb)
      `;
    }

    await sql`
      INSERT INTO order_status_history (id, order_id, status, changed_by, notes)
      VALUES (${generateId()}, ${orderId}, 'pending', ${user?.id ?? null}, 'Order created')
    `;

    const orderRows = await sql`
      SELECT o.*, c.name AS customer_name
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${orderId}
    ` as any[];
    const items = await sql`
      SELECT oi.*, p.name AS product_name, p.image_url
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    ` as any[];

    return NextResponse.json({ ...orderRows[0], items }, { status: 201 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
