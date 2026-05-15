import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const customerId = searchParams.get("customer_id");

    let query = `SELECT s.*, c.name AS customer_name FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1`;
    const params: any[] = [];
    let p = 1;
    if (from) { query += ` AND s.sale_date >= $${p++}`; params.push(from); }
    if (to)   { query += ` AND s.sale_date <= $${p++}`; params.push(to); }
    if (customerId) { query += ` AND s.customer_id = $${p++}`; params.push(customerId); }
    query += ` ORDER BY s.sale_date DESC, s.created_at DESC`;

    const sales = await sql.query(query, params);
    return NextResponse.json(sales);
  } catch (error) {
    console.error("sales fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);
    const id = generateId();
    const saleDate = body.sale_date || new Date().toISOString().split("T")[0];

    await sql`
      INSERT INTO sales (id, customer_id, description, amount, payment_method, payment_status, sale_date, notes, created_by)
      VALUES (${id}, ${body.customer_id || null}, ${body.description}, ${body.amount},
              ${body.payment_method}, ${body.payment_status || "paid"}, ${saleDate},
              ${body.notes || null}, ${user?.id ?? null})
    `;
    const rows = await sql`SELECT * FROM sales WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("sale create failed:", error);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
