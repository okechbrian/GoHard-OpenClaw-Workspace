import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await sql`SELECT * FROM inventory WHERE id = ${id}` as any[];
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await sql`
      UPDATE inventory SET name = ${body.name}, description = ${body.description || null},
        category = ${body.category || null}, quantity = ${body.quantity || 0},
        unit = ${body.unit || "pcs"}, cost_price = ${body.cost_price || 0},
        selling_price = ${body.selling_price || 0}, updated_at = NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM inventory WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM inventory WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
