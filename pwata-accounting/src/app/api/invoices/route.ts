import { sql } from "@/lib/db";
import { generateId, generateInvoiceNumber } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const invoices = await sql`
      SELECT i.*, c.name AS customer_name
      FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
    `;
    return NextResponse.json(invoices);
  } catch (error) {
    console.error("invoices fetch failed:", error);
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

    await sql`
      INSERT INTO invoices (id, invoice_number, customer_id, subtotal, tax_rate, tax_amount, total, status, due_date, notes, created_by)
      VALUES (${id}, ${invoiceNumber}, ${body.customer_id || null}, ${subtotal}, ${taxRate}, ${taxAmount}, ${total},
              ${body.status || "draft"}, ${body.due_date || null}, ${body.notes || null}, ${user?.id ?? null})
    `;

    for (const item of items) {
      const qty = item.quantity || 1;
      await sql`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
        VALUES (${generateId()}, ${id}, ${item.description}, ${qty}, ${item.unit_price}, ${qty * item.unit_price})
      `;
    }

    const rows = await sql`SELECT * FROM invoices WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("invoice create failed:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
