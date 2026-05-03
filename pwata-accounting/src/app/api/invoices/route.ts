import sqlite from "@/lib/db";
import { generateId, generateInvoiceNumber } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const invoices = sqlite.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `).all();
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);
    const id = generateId();
    const invoiceNumber = generateInvoiceNumber();

    const items = body.items || [];
    const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_price, 0);
    const taxRate = body.tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    sqlite.prepare(`
      INSERT INTO invoices (id, invoice_number, customer_id, subtotal, tax_rate, tax_amount, total, status, due_date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, invoiceNumber, body.customer_id || null, subtotal, taxRate, taxAmount, total, body.status || "draft", body.due_date || null, body.notes || null, user?.id ?? null);

    const itemStmt = sqlite.prepare(`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      itemStmt.run(generateId(), id, item.description, item.quantity || 1, item.unit_price, (item.quantity || 1) * item.unit_price);
    }

    const invoice = sqlite.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
