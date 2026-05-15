import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    await sql`
      UPDATE recurring_invoices SET status = ${body.status},
        next_date = ${body.next_date || null}, notes = ${body.notes || null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM recurring_invoices WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`DELETE FROM recurring_invoices WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
