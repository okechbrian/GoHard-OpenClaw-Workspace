import { sql, getOrderWithDetails } from "./db";
import { generateId, generateInvoiceNumber } from "./utils";
import { sendWhatsAppText, normalizePhoneDigits } from "./whatsapp-bot";
import { sendTelegramText } from "./telegram-bot";
import { sendDepositConfirmationEmail } from "./email";

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

    // Outbound WhatsApp notification to customer
    const customerPhone = order.customer_phone || order.guest_phone;
    const customerName = order.customer_name || order.guest_name || "there";
    const nameFirst = customerName.trim().split(/\s+/)[0] || "there";
    
    const ORDER_APP_URL = (
      process.env.ORDERS_APP_PUBLIC_URL ||
      process.env.ORDERS_APP_URL ||
      "https://pwata-orders.vercel.app"
    ).replace(/\/$/, "");
    
    const trackingLink = `${ORDER_APP_URL}/track/${order.order_number}`;

    let messageText = "";
    switch (newStatus) {
      case "in_design":
        messageText = `Hi ${nameFirst}, your Pwata order *${order.order_number}* is now *In Design*! 🎨 Our designers are working on your drafts. We will share them here shortly.`;
        break;
      case "printing":
        messageText = `Hi ${nameFirst}, your Pwata order *${order.order_number}* is now *Printing*! 🖨️ We are producing your custom items and will let you know once they are ready.`;
        break;
      case "ready_for_delivery":
        messageText = `Hi ${nameFirst}, your Pwata order *${order.order_number}* is *Ready for Delivery*! 🚚 We are coordinating delivery details and will contact you shortly.`;
        break;
      case "completed":
        messageText = `Hi ${nameFirst}, your Pwata order *${order.order_number}* has been *Completed*! 🎉 Thank you for choosing Pwata Creatives. Let us know if you need anything else!`;
        break;
      case "cancelled":
        messageText = `Hi ${nameFirst}, your Pwata order *${order.order_number}* has been *Cancelled*. If you think this was a mistake, please reply to this message.`;
        break;
    }

    if (messageText) {
      const body = [
        messageText,
        "",
        `Track progress: ${trackingLink}`
      ].join("\n");

      // 1. Outbound WhatsApp notification to customer
      if (customerPhone) {
        try {
          const normalizedPhone = normalizePhoneDigits(customerPhone);
          await sendWhatsAppText(normalizedPhone, body);
          console.log(`✅ Outbound status update WhatsApp sent to ${normalizedPhone} for status ${newStatus}`);
        } catch (err) {
          console.error(`❌ Failed to send outbound status update WhatsApp to ${customerPhone}:`, err);
        }
      }

      // 2. Outbound Telegram notification to customer (if chat ID is known)
      const telegramChatId = (order as any).telegram_chat_id;
      if (telegramChatId) {
        try {
          await sendTelegramText(telegramChatId, body);
          console.log(`✅ Outbound status update Telegram sent to Chat ID ${telegramChatId} for status ${newStatus}`);
        } catch (err) {
          console.error(`❌ Failed to send outbound status update Telegram to ${telegramChatId}:`, err);
        }
      }
    }

    // 3. Email notification on deposit confirmation (store orders → in_design)
    if (isStoreOrder && newStatus === "in_design" && order.guest_email) {
      const customerName = order.customer_name || order.guest_name || "there";
      const trackingLink = `${ORDER_APP_URL}/track/${order.order_number}`;
      const ACCOUNTING_APP_URL = (
        process.env.ACCOUNTING_APP_URL ||
        "https://pwata-accounting.vercel.app"
      ).replace(/\/$/, "");
      const invoicePdfUrl = pdfUrl ? `${ACCOUNTING_APP_URL}${pdfUrl}` : undefined;
      try {
        await sendDepositConfirmationEmail({
          to: order.guest_email,
          orderNumber: order.order_number,
          trackingLink,
          invoicePdfUrl,
          customerName,
        });
      } catch (err) {
        console.error("❌ Failed to send deposit confirmation email:", err);
      }
    }

    return { saleCreated, invoiceCreated, pdfUrl };

  } catch (error) {
    console.error("❌ Automation failed for order", orderId, error);
    return { saleCreated: false, invoiceCreated: false };
  }
}
