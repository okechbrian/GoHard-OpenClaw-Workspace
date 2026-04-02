import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get("sale_id");
    const invoiceId = searchParams.get("invoice_id");

    let query = `SELECT p.*, c.name as customer_name FROM payments p LEFT JOIN customers c ON p.customer_id = c.id WHERE 1=1`;
    const params: any[] = [];

    if (saleId) { query += ` AND p.sale_id = ?`; params.push(saleId); }
    if (invoiceId) { query += ` AND p.invoice_id = ?`; params.push(invoiceId); }

    query += ` ORDER BY p.payment_date DESC, p.created_at DESC`;
    const payments = sqlite.prepare(query).all(...params);
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = require("crypto").randomUUID();

    sqlite.prepare(`
      INSERT INTO payments (id, customer_id, sale_id, invoice_id, amount, payment_method, payment_date, reference, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, body.customer_id || null, body.sale_id || null, body.invoice_id || null, body.amount, body.payment_method, body.payment_date || new Date().toISOString().split("T")[0], body.reference || null, body.notes || null);

    // If linked to invoice, update invoice status
    if (body.invoice_id) {
      const invoice = sqlite.prepare("SELECT * FROM invoices WHERE id = ?").get(body.invoice_id) as any;
      if (invoice) {
        const payments = sqlite.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?").get(body.invoice_id) as any;
        if (payments.total >= invoice.total) {
          sqlite.prepare("UPDATE invoices SET status = 'paid', paid_date = date('now'), updated_at = datetime('now') WHERE id = ?").run(body.invoice_id);
        } else if (payments.total > 0) {
          sqlite.prepare("UPDATE invoices SET status = 'partial', updated_at = datetime('now') WHERE id = ?").run(body.invoice_id);
        }
      }
    }

    const payment = sqlite.prepare("SELECT * FROM payments WHERE id = ?").get(id);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
