import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = await sql`
      SELECT c.*,
        (SELECT COUNT(*)::int FROM sales WHERE customer_id = c.id) AS total_orders,
        (SELECT COALESCE(SUM(amount), 0) FROM sales WHERE customer_id = c.id) AS total_spent
      FROM customers c ORDER BY c.name
    `;
    return NextResponse.json(customers);
  } catch (error) {
    console.error("customers fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();
    await sql`
      INSERT INTO customers (id, name, phone, email, address, notes)
      VALUES (${id}, ${body.name}, ${body.phone || null}, ${body.email || null}, ${body.address || null}, ${body.notes || null})
    `;
    const rows = await sql`SELECT * FROM customers WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("customer create failed:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
