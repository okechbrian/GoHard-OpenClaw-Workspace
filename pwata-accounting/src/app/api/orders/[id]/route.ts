import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { onOrderStatusChange } from "@/lib/automation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;

    // Get order with customer info
    const order = sqlite.prepare(`
      SELECT o.*, c.name as customer_name
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get order items with product details
    const items = sqlite.prepare(`
      SELECT oi.*, p.name as product_name, p.image_url, p.base_price, p.print_fee
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    // Get status history
    const statusHistory = sqlite.prepare(`
      SELECT h.*, u.name as changed_by_name
      FROM order_status_history h LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.order_id = ?
      ORDER BY h.created_at ASC
    `).all(orderId);

    return NextResponse.json({ ...order, items, statusHistory });

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    // Validate status
    const validStatuses = ['pending', 'in_design', 'printing', 'ready_for_delivery', 'completed', 'cancelled'];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
    }

    // Get current order
    const order = sqlite.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order status
    sqlite.prepare(`
      UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?
    `).run(body.status, orderId);

    // Insert status history
    sqlite.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by, notes, created_at)
      VALUES (?, ?, ?, null, ?, datetime('now'))
    `).run(generateId(), orderId, body.status, body.notes || `Status changed to ${body.status}`);

    // Trigger automation for specific status changes
    if (body.status === 'ready_for_delivery' || body.status === 'completed') {
      await onOrderStatusChange(orderId, body.status, null); // changedBy will come from auth in later prompt
    }

    // Return updated order
    const updatedOrder = sqlite.prepare(`
      SELECT o.*, c.name as customer_name
      FROM orders o LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `).get(orderId);

    const items = sqlite.prepare(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(orderId);

    const statusHistory = sqlite.prepare(`
      SELECT h.*, u.name as changed_by_name
      FROM order_status_history h LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.order_id = ?
      ORDER BY h.created_at ASC
    `).all(orderId);

    return NextResponse.json({ ...(updatedOrder as object), items, statusHistory });

  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}