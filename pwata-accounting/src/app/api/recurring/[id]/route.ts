import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    sqlite.prepare(`
      UPDATE recurring_invoices SET status = ?, next_date = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(body.status, body.next_date || null, body.notes || null, id);

    const item = sqlite.prepare("SELECT * FROM recurring_invoices WHERE id = ?").get(id);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    sqlite.prepare("DELETE FROM recurring_invoices WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
