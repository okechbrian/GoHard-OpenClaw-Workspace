import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const saleId = searchParams.get("sale_id");
    const invoiceId = searchParams.get("invoice_id");

    let query = `SELECT p.*, c.name AS customer_name FROM payments p
                 LEFT JOIN customers c ON p.customer_id = c.id WHERE 1=1`;
    const params: any[] = [];
    let pi = 1;
    if (saleId)    { query += ` AND p.sale_id = $${pi++}`; params.push(saleId); }
    if (invoiceId) { query += ` AND p.invoice_id = $${pi++}`; params.push(invoiceId); }
    query += ` ORDER BY p.payment_date DESC, p.created_at DESC`;

    const payments = await sql.query(query, params);
    return NextResponse.json(payments);
  } catch (error) {
    console.error("payments fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();
    const paymentDate = body.payment_date || new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO payments (id, customer_id, sale_id, invoice_id, amount, payment_method, payment_date, reference, notes)
      VALUES (${id}, ${body.customer_id || null}, ${body.sale_id || null}, ${body.invoice_id || null},
              ${body.amount}, ${body.payment_method}, ${paymentDate}, ${body.reference || null}, ${body.notes || null})
    `;

    if (body.invoice_id) {
      const invRows = await sql`SELECT * FROM invoices WHERE id = ${body.invoice_id}` as any[];
      const invoice = invRows[0];
      if (invoice) {
        const totalRows = await sql`SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE invoice_id = ${body.invoice_id}` as any[];
        const paid = Number(totalRows[0].total);
        if (paid >= Number(invoice.total)) {
          await sql`UPDATE invoices SET status = 'paid', paid_date = CURRENT_DATE, updated_at = NOW() WHERE id = ${body.invoice_id}`;
        } else if (paid > 0) {
          await sql`UPDATE invoices SET status = 'partial', updated_at = NOW() WHERE id = ${body.invoice_id}`;
        }
      }
    }

    const rows = await sql`SELECT * FROM payments WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("payment create failed:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
