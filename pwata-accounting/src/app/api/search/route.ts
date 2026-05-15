import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) {
      return NextResponse.json({ sales: [], expenses: [], customers: [], invoices: [] });
    }
    const term = `%${q}%`;

    const sales = await sql`
      SELECT s.*, c.name AS customer_name, 'sale' AS type
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.description ILIKE ${term} OR s.notes ILIKE ${term} OR c.name ILIKE ${term}
      ORDER BY s.sale_date DESC LIMIT 10
    `;

    const expenses = await sql`
      SELECT *, 'expense' AS type FROM expenses
      WHERE description ILIKE ${term} OR category ILIKE ${term} OR notes ILIKE ${term}
      ORDER BY expense_date DESC LIMIT 10
    `;

    const customers = await sql`
      SELECT *, 'customer' AS type FROM customers
      WHERE name ILIKE ${term} OR phone ILIKE ${term} OR email ILIKE ${term}
      ORDER BY name LIMIT 10
    `;

    const invoices = await sql`
      SELECT i.*, c.name AS customer_name, 'invoice' AS type
      FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.invoice_number ILIKE ${term} OR c.name ILIKE ${term}
      ORDER BY i.created_at DESC LIMIT 10
    `;

    return NextResponse.json({ sales, expenses, customers, invoices });
  } catch (error) {
    console.error("search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
