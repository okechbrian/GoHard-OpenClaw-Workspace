import sqlite from "@/lib/db";
import { formatUGX, formatDate } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = sqlite.prepare("SELECT i.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?").get(id) as any;
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = sqlite.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(id);

    // Generate PDF as HTML (print-friendly) — server-side PDF generation
    const html = generateInvoiceHTML(invoice, items as any[]);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="${invoice.invoice_number}.html"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

function generateInvoiceHTML(inv: any, items: any[]): string {
  const itemsHTML = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${formatUGX(item.unit_price)}</td>
      <td style="text-align:right">${formatUGX(item.total)}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${inv.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a2e; max-width: 800px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
  .company h1 { font-size: 28px; color: #6366f1; margin-bottom: 5px; }
  .company p { color: #666; font-size: 13px; }
  .invoice-info { text-align: right; }
  .invoice-info h2 { font-size: 24px; color: #333; margin-bottom: 10px; }
  .invoice-info p { font-size: 13px; color: #666; line-height: 1.6; }
  .invoice-info .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .status-draft { background: #f1f5f9; color: #64748b; }
  .status-sent { background: #dbeafe; color: #2563eb; }
  .status-paid { background: #dcfce7; color: #16a34a; }
  .status-overdue { background: #fee2e2; color: #dc2626; }
  .billing { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .billing div { flex: 1; }
  .billing h3 { font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
  .billing p { font-size: 14px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
  th { background: #6366f1; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  tr:nth-child(even) { background: #f8fafc; }
  .totals { width: 300px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .totals .row.total { border-top: 2px solid #6366f1; font-size: 20px; font-weight: 700; color: #6366f1; padding-top: 12px; }
  .notes { margin-top: 40px; padding: 20px; background: #f8fafc; border-radius: 8px; }
  .notes h3 { font-size: 12px; text-transform: uppercase; color: #999; margin-bottom: 8px; }
  .notes p { font-size: 13px; color: #666; }
  .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
  @media print { body { padding: 20px; } .no-print { display: none; } }
</style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>Pwata Creatives</h1>
      <p>Digital Designs & Branding</p>
      <p>Uganda</p>
    </div>
    <div class="invoice-info">
      <h2>INVOICE</h2>
      <p><strong>${inv.invoice_number}</strong></p>
      <p>Date: ${formatDate(inv.created_at)}</p>
      ${inv.due_date ? `<p>Due: ${formatDate(inv.due_date)}</p>` : ""}
      <p style="margin-top:8px"><span class="status status-${inv.status}">${inv.status}</span></p>
    </div>
  </div>

  <div class="billing">
    <div>
      <h3>Bill To</h3>
      <p><strong>${inv.customer_name || "Walk-in Customer"}</strong></p>
      ${inv.customer_phone ? `<p>${inv.customer_phone}</p>` : ""}
      ${inv.customer_email ? `<p>${inv.customer_email}</p>` : ""}
      ${inv.customer_address ? `<p>${inv.customer_address}</p>` : ""}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr>
    </thead>
    <tbody>${itemsHTML}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${formatUGX(inv.subtotal)}</span></div>
    ${inv.tax_amount > 0 ? `<div class="row"><span>Tax (${inv.tax_rate}%)</span><span>${formatUGX(inv.tax_amount)}</span></div>` : ""}
    <div class="row total"><span>Total</span><span>${formatUGX(inv.total)}</span></div>
  </div>

  ${inv.notes ? `<div class="notes"><h3>Notes</h3><p>${inv.notes}</p></div>` : ""}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Pwata Creatives — Digital Designs & Branding</p>
  </div>

  <div class="no-print" style="position:fixed;top:20px;right:20px;">
    <button onclick="window.print()" style="background:#6366f1;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨️ Print / Save as PDF</button>
  </div>
</body>
</html>`;
}
