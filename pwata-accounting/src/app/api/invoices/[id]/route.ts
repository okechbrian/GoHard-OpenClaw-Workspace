import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await sql`
      SELECT i.*, c.name AS customer_name FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ${id}
    ` as any[];
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const items = await sql`SELECT * FROM invoice_items WHERE invoice_id = ${id}`;
    return NextResponse.json({ ...rows[0], items });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await sql`
      UPDATE invoices SET status = ${body.status}, due_date = ${body.due_date || null},
        notes = ${body.notes || null}, updated_at = NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM invoices WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`;
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
