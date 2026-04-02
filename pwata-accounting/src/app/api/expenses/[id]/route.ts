import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const expense = sqlite.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    sqlite.prepare(`
      UPDATE expenses SET category = ?, description = ?, amount = ?, payment_method = ?, expense_date = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(body.category, body.description, body.amount, body.payment_method, body.expense_date, body.notes || null, id);

    const expense = sqlite.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    sqlite.prepare("DELETE FROM expenses WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
