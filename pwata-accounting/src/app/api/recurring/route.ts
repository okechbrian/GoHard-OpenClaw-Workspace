import sqlite from "@/lib/db";
import { generateId, generateInvoiceNumber } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const recurring = sqlite.prepare(`
      SELECT r.*, c.name as customer_name
      FROM recurring_invoices r LEFT JOIN customers c ON r.customer_id = c.id
      ORDER BY r.next_date ASC
    `).all();
    return NextResponse.json(recurring);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recurring invoices" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = generateId();

    // Calculate next date based on frequency
    const startDate = body.start_date || new Date().toISOString().split("T")[0];
    const nextDate = calculateNextDate(startDate, body.frequency || "monthly");

    sqlite.prepare(`
      INSERT INTO recurring_invoices (id, customer_id, description, amount, frequency, payment_method, start_date, next_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, body.customer_id || null, body.description, body.amount, body.frequency || "monthly", body.payment_method || "cash", startDate, nextDate, "active", body.notes || null);

    const item = sqlite.prepare("SELECT * FROM recurring_invoices WHERE id = ?").get(id);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create recurring invoice" }, { status: 500 });
  }
}

function calculateNextDate(date: string, frequency: string): string {
  const d = new Date(date);
  switch (frequency) {
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}
