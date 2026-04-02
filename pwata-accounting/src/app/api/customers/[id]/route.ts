import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customer = sqlite.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    sqlite.prepare(`
      UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(body.name, body.phone || null, body.email || null, body.address || null, body.notes || null, id);

    const customer = sqlite.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    sqlite.prepare("DELETE FROM customers WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
