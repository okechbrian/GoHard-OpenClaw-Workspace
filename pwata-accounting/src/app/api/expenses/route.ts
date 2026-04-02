import sqlite from "@/lib/db";
import { generateId } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");

    let query = `SELECT * FROM expenses WHERE 1=1`;
    const params: any[] = [];

    if (from) { query += ` AND expense_date >= ?`; params.push(from); }
    if (to) { query += ` AND expense_date <= ?`; params.push(to); }
    if (category) { query += ` AND category = ?`; params.push(category); }

    query += ` ORDER BY expense_date DESC, created_at DESC`;
    const expenses = sqlite.prepare(query).all(...params);
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();

    sqlite.prepare(`
      INSERT INTO expenses (id, category, description, amount, payment_method, expense_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, body.category, body.description, body.amount, body.payment_method, body.expense_date || new Date().toISOString().split("T")[0], body.notes || null);

    const expense = sqlite.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
