import { sql } from "@/lib/db";
import { generateId } from "@/lib/utils";
import { getCurrentUser } from "@/lib/server-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: any[] = [];
    let p = 1;
    if (from) { query += ` AND expense_date >= $${p++}`; params.push(from); }
    if (to)   { query += ` AND expense_date <= $${p++}`; params.push(to); }
    if (category) { query += ` AND category = $${p++}`; params.push(category); }
    query += ` ORDER BY expense_date DESC, created_at DESC`;

    const expenses = await sql.query(query, params);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error("expenses fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getCurrentUser(request);
    const id = generateId();
    const expenseDate = body.expense_date || new Date().toISOString().split("T")[0];
    await sql`
      INSERT INTO expenses (id, category, description, amount, payment_method, expense_date, notes, created_by)
      VALUES (${id}, ${body.category}, ${body.description}, ${body.amount}, ${body.payment_method},
              ${expenseDate}, ${body.notes || null}, ${user?.id ?? null})
    `;
    const rows = await sql`SELECT * FROM expenses WHERE id = ${id}` as any[];
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error("expense create failed:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
