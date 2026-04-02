import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = sqlite.prepare("SELECT i.*, c.name as customer_name FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.id = ?").get(id);
    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const items = sqlite.prepare("SELECT * FROM invoice_items WHERE invoice_id = ?").all(id);
    return NextResponse.json({ ...invoice, items });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    sqlite.prepare(`
      UPDATE invoices SET status = ?, due_date = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(body.status, body.due_date || null, body.notes || null, id);

    const invoice = sqlite.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    return NextResponse.json(invoice);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    sqlite.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
    sqlite.prepare("DELETE FROM invoices WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
