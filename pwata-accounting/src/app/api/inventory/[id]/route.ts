import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = sqlite.prepare("SELECT * FROM inventory WHERE id = ?").get(id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    sqlite.prepare(`
      UPDATE inventory SET name = ?, description = ?, category = ?, quantity = ?, unit = ?, cost_price = ?, selling_price = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(body.name, body.description || null, body.category || null, body.quantity || 0, body.unit || "pcs", body.cost_price || 0, body.selling_price || 0, id);

    const item = sqlite.prepare("SELECT * FROM inventory WHERE id = ?").get(id);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    sqlite.prepare("DELETE FROM inventory WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
