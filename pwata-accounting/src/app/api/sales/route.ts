import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const customerId = searchParams.get("customer_id");

    let query = `SELECT s.*, c.name as customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1`;
    const params: any[] = [];

    if (from) { query += ` AND s.sale_date >= ?`; params.push(from); }
    if (to) { query += ` AND s.sale_date <= ?`; params.push(to); }
    if (customerId) { query += ` AND s.customer_id = ?`; params.push(customerId); }

    query += ` ORDER BY s.sale_date DESC, s.created_at DESC`;
    const sales = sqlite.prepare(query).all(...params);
    return NextResponse.json(sales);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);
    const id = generateId();

    sqlite.prepare(`
      INSERT INTO sales (id, customer_id, description, amount, payment_method, payment_status, sale_date, notes, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(id, body.customer_id || null, body.description, body.amount, body.payment_method, body.payment_status || "paid", body.sale_date || new Date().toISOString().split("T")[0], body.notes || null, user?.id ?? null);

    const sale = sqlite.prepare("SELECT * FROM sales WHERE id = ?").get(id);
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
