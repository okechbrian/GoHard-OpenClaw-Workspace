import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const customers = sqlite.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as total_orders,
        (SELECT COALESCE(SUM(amount), 0) FROM sales WHERE customer_id = c.id) as total_spent
      FROM customers c ORDER BY c.name
    `).all();
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();

    sqlite.prepare(`
      INSERT INTO customers (id, name, phone, email, address, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, body.name, body.phone || null, body.email || null, body.address || null, body.notes || null);

    const customer = sqlite.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
