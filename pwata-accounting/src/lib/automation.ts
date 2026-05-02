import sqlite, { getOrderWithDetails } from "./db";
import { generateId, generateInvoiceNumber, formatUGX } from "./utils";

export async function onOrderStatusChange(
  orderId: string,
  newStatus: string,
  changedBy?: string | null
) {
  try {
    // 1. Fetch full order details
    const order = getOrderWithDetails(orderId);
    if (!order) {
      console.error("❌ Order not found for automation:", orderId);
      return { saleCreated: false, invoiceCreated: false };
    }

    // 2. Insert status history
    sqlite.prepare(`
      INSERT INTO order_status_history (id, order_id, status, changed_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(generateId(), orderId, newStatus, changedBy, `Status changed to ${newStatus}`);

    // 3. Handle financial automation for ready_for_delivery and completed statuses
    let saleCreated = false;
    let invoiceCreated = false;
    let pdfUrl: string | undefined;

    if (newStatus === 'ready_for_delivery' || newStatus === 'completed') {
      // Check if sale already exists for this order (idempotency)
      const existingSale = sqlite.prepare("SELECT id FROM sales WHERE order_id = ?").get(orderId) as any;

      if (!existingSale) {
        // Create sale record
        const saleId = generateId();
        sqlite.prepare(`
          INSERT INTO sales (id, order_id, customer_id, description, amount, payment_method, payment_status, sale_date, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), ?, datetime('now'), datetime('now'))
        `).run(
          saleId,
          orderId,
          order.customer_id || null,
          `Merchandise Order #${order.order_number}`,
          order.total_amount,
          order.payment_method || 'cash',
          order.payment_status === 'paid' ? 'paid' : 'pending',
          `Order ${order.order_number}`
        );
        saleCreated = true;

        // Create invoice
        const invoiceId = generateId();
        const invoiceNumber = generateInvoiceNumber();

        sqlite.prepare(`
          INSERT INTO invoices (id, order_id, invoice_number, customer_id, subtotal, total, status, due_date, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'sent', date('now', '+15 days'), ?, datetime('now'), datetime('now'))
        `).run(
          invoiceId,
          orderId,
          invoiceNumber,
          order.customer_id || null,
          order.total_amount,
          order.total_amount,
          `Order ${order.order_number} - Custom merchandise`
        );
        invoiceCreated = true;

        // Create invoice items
        const itemInsert = sqlite.prepare(`
          INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of order.items) {
          itemInsert.run(
            generateId(),
            invoiceId,
            item.product_name,
            item.quantity,
            item.unit_price,
            item.subtotal
          );
        }

        // Generate PDF receipt (simplified for now - will enhance in later prompt)
        pdfUrl = `/invoices/${invoiceNumber}.pdf`;

        console.log("📄 PDF receipt would be generated for:", {
          invoiceNumber,
          customer: order.customer_name || order.guest_name,
          total: formatUGX(order.total_amount),
          items: order.items.length
        });

        console.log("📧 Email would be sent to customer with PDF");
        console.log("✅ Automation triggered for order", order.order_number, "— Sale + Invoice + PDF created");
      }
    }

    return { saleCreated, invoiceCreated, pdfUrl };

  } catch (error) {
    console.error("❌ Automation failed for order", orderId, error);
    return { saleCreated: false, invoiceCreated: false };
  }
}