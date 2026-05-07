import sqlite, { getOrderWithDetails } from "./db";
import { generateId, generateInvoiceNumber, formatUGX } from "./utils";

export async function onOrderStatusChange(
  orderId: string,
  newStatus: string,
  changedBy?: string | null,
  options?: { skipHistory?: boolean; note?: string }
) {
  try {
    // 1. Fetch full order details
    const order = getOrderWithDetails(orderId);
    if (!order) {
      console.error("❌ Order not found for automation:", orderId);
      return { saleCreated: false, invoiceCreated: false };
    }

    // 2. Insert status history (unless caller already wrote a richer entry)
    if (!options?.skipHistory) {
      sqlite.prepare(`
        INSERT INTO order_status_history (id, order_id, status, changed_by, notes, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(generateId(), orderId, newStatus, changedBy, options?.note ?? `Status changed to ${newStatus}`);
    }

    // 3. Handle financial automation
    //    - All orders: when reaching ready_for_delivery / completed (work is finished)
    //    - Store orders: also when entering in_design (deposit paid, committed to fulfilling)
    //    Idempotent — existingSale check below prevents double-create as the order moves through states.
    let saleCreated = false;
    let invoiceCreated = false;
    let pdfUrl: string | undefined;

    const isStoreOrder = order.source === 'store';
    const triggersFinancials =
      newStatus === 'ready_for_delivery' ||
      newStatus === 'completed' ||
      (isStoreOrder && newStatus === 'in_design');

    if (triggersFinancials) {
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

        // Invoice HTML (print-to-PDF) is served at /api/invoices/{id}/pdf
        pdfUrl = `/api/invoices/${invoiceId}/pdf`;

        console.log("✅ Automation triggered for order", order.order_number, "— Sale + Invoice created. Invoice URL:", pdfUrl);
      }
    }

    return { saleCreated, invoiceCreated, pdfUrl };

  } catch (error) {
    console.error("❌ Automation failed for order", orderId, error);
    return { saleCreated: false, invoiceCreated: false };
  }
}