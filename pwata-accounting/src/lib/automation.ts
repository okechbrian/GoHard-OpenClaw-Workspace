import { sql, getOrderWithDetails } from "./db";
import { generateId, generateInvoiceNumber } from "./utils";

export async function onOrderStatusChange(
  orderId: string,
  newStatus: string,
  changedBy?: string | null,
  options?: { skipHistory?: boolean; note?: string }
) {
  try {
    const order = await getOrderWithDetails(orderId);
    if (!order) {
      console.error("❌ Order not found for automation:", orderId);
      return { saleCreated: false, invoiceCreated: false };
    }

    if (!options?.skipHistory) {
      const note = options?.note ?? `Status changed to ${newStatus}`;
      await sql`
        INSERT INTO order_status_history (id, order_id, status, changed_by, notes)
        VALUES (${generateId()}, ${orderId}, ${newStatus}, ${changedBy ?? null}, ${note})
      `;
    }

    let saleCreated = false;
    let invoiceCreated = false;
    let pdfUrl: string | undefined;

    const isStoreOrder = order.source === 'store';
    const triggersFinancials =
      newStatus === 'ready_for_delivery' ||
      newStatus === 'completed' ||
      (isStoreOrder && newStatus === 'in_design');

    if (triggersFinancials) {
      const existingSale = (await sql`SELECT id FROM sales WHERE order_id = ${orderId}` as any[])[0];

      if (!existingSale) {
        const saleId = generateId();
        const saleStatus = order.payment_status === 'paid' ? 'paid' : 'pending';
        await sql`
          INSERT INTO sales (id, order_id, customer_id, description, amount, payment_method, payment_status, sale_date, notes)
          VALUES (${saleId}, ${orderId}, ${order.customer_id || null}, ${`Merchandise Order #${order.order_number}`},
                  ${order.total_amount}, ${order.payment_method || 'cash'}, ${saleStatus}, CURRENT_DATE,
                  ${`Order ${order.order_number}`})
        `;
        saleCreated = true;

        const invoiceId = generateId();
        const invoiceNumber = generateInvoiceNumber();
        await sql`
          INSERT INTO invoices (id, order_id, invoice_number, customer_id, subtotal, total, status, due_date, notes)
          VALUES (${invoiceId}, ${orderId}, ${invoiceNumber}, ${order.customer_id || null},
                  ${order.total_amount}, ${order.total_amount}, 'sent',
                  (CURRENT_DATE + INTERVAL '15 days'),
                  ${`Order ${order.order_number} - Custom merchandise`})
        `;
        invoiceCreated = true;

        for (const item of order.items as any[]) {
          await sql`
            INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
            VALUES (${generateId()}, ${invoiceId}, ${item.product_name}, ${item.quantity}, ${item.unit_price}, ${item.subtotal})
          `;
        }

        pdfUrl = `/api/invoices/${invoiceId}/pdf`;
        console.log("✅ Automation triggered for order", order.order_number, "— Sale + Invoice created.", pdfUrl);
      }
    }

    return { saleCreated, invoiceCreated, pdfUrl };

  } catch (error) {
    console.error("❌ Automation failed for order", orderId, error);
    return { saleCreated: false, invoiceCreated: false };
  }
}
