import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ sales: [], expenses: [], customers: [], invoices: [] });
    }

    const searchTerm = `%${q}%`;

    const sales = sqlite.prepare(`
      SELECT s.*, c.name as customer_name, 'sale' as type
      FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
      WHERE s.description LIKE ? OR s.notes LIKE ? OR c.name LIKE ?
      ORDER BY s.sale_date DESC LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);

    const expenses = sqlite.prepare(`
      SELECT *, 'expense' as type FROM expenses
      WHERE description LIKE ? OR category LIKE ? OR notes LIKE ?
      ORDER BY expense_date DESC LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);

    const customers = sqlite.prepare(`
      SELECT *, 'customer' as type FROM customers
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY name LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);

    const invoices = sqlite.prepare(`
      SELECT i.*, c.name as customer_name, 'invoice' as type
      FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.invoice_number LIKE ? OR c.name LIKE ?
      ORDER BY i.created_at DESC LIMIT 10
    `).all(searchTerm, searchTerm);

    return NextResponse.json({ sales, expenses, customers, invoices });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
