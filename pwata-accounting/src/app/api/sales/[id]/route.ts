import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// GET single sale / UPDATE / DELETE
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sale = sqlite.prepare("SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.id = ?").get(id);
    if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    sqlite.prepare(`
      UPDATE sales SET customer_id = ?, description = ?, amount = ?, payment_method = ?, payment_status = ?, sale_date = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(body.customer_id || null, body.description, body.amount, body.payment_method, body.payment_status || "paid", body.sale_date, body.notes || null, id);

    const sale = sqlite.prepare("SELECT * FROM sales WHERE id = ?").get(id);
    return NextResponse.json(sale);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    sqlite.prepare("DELETE FROM sales WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
