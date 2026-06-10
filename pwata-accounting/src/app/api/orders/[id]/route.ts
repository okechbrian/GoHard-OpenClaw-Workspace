import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { onOrderStatusChange } from "@/lib/automation";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    const orderRows = await sql`
      SELECT o.*, o.deadline_date, o.artwork_urls, c.name AS customer_name
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${orderId}
    ` as any[];
    const order = orderRows[0];
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const items = await sql`
      SELECT oi.*, p.name AS product_name, p.image_url, p.base_price, p.print_fee
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    ` as any[];

    const statusHistory = await sql`
      SELECT h.*, u.name AS changed_by_name
      FROM order_status_history h LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.order_id = ${orderId}
      ORDER BY h.created_at ASC
    ` as any[];

    const invRows = await sql`
      SELECT id, invoice_number, status, total FROM invoices WHERE order_id = ${orderId} LIMIT 1
    ` as any[];

    return NextResponse.json({ ...order, items, statusHistory, invoice: invRows[0] ?? null });
  } catch (error) {
    console.error("order fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const user = await getCurrentUser(request);

    const validStatuses = ['pending', 'in_design', 'printing', 'ready_for_delivery', 'completed', 'cancelled'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
    }

    const orderRows = await sql`SELECT id FROM orders WHERE id = ${orderId}` as any[];
    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await sql`
      UPDATE orders SET status = ${body.status}, updated_at = NOW() WHERE id = ${orderId}
    `;

    await sql`
      INSERT INTO order_status_history (id, order_id, status, changed_by, notes)
      VALUES (${generateId()}, ${orderId}, ${body.status}, ${user?.id ?? null}, ${body.notes || `Status changed to ${body.status}`})
    `;

    if (body.status === 'ready_for_delivery' || body.status === 'completed' || body.status === 'in_design') {
      await onOrderStatusChange(orderId, body.status, user?.id ?? null, { skipHistory: true });
    }

    const updated = (await sql`
      SELECT o.*, c.name AS customer_name
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ${orderId}
    ` as any[])[0];

    const items = await sql`
      SELECT oi.*, p.name AS product_name, p.image_url
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ${orderId}
    ` as any[];

    const statusHistory = await sql`
      SELECT h.*, u.name AS changed_by_name
      FROM order_status_history h LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.order_id = ${orderId}
      ORDER BY h.created_at ASC
    ` as any[];

    const invoice = (await sql`
      SELECT id, invoice_number, status, total FROM invoices WHERE order_id = ${orderId} LIMIT 1
    ` as any[])[0] ?? null;

    return NextResponse.json({ ...updated, items, statusHistory, invoice });

  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orderRows = await sql`
      SELECT id, status, order_number FROM orders WHERE id = ${orderId}
    ` as Array<{ id: string; status: string; order_number: string }>;
    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderRows[0];
    if (order.status !== "cancelled" && order.status !== "pending") {
      return NextResponse.json({ error: "Only cancelled or pending orders can be deleted" }, { status: 400 });
    }

    await sql`UPDATE sales SET order_id = NULL WHERE order_id = ${orderId}`;
    await sql`UPDATE invoices SET order_id = NULL WHERE order_id = ${orderId}`;
    await sql`DELETE FROM orders WHERE id = ${orderId}`;

    console.log(`🗑️ Order ${order.order_number} (${orderId}) deleted by ${user.name || user.id}`);

    return NextResponse.json({ deleted: true, order_number: order.order_number });
  } catch (error) {
    console.error("Order delete error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
