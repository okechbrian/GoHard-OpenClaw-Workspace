import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "2000-01-01";
    const to = searchParams.get("to") || "2099-12-31";

    const totalSales = sqlite.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE sale_date >= ? AND sale_date <= ? AND payment_status = 'paid'`).get(from, to) as any;
    const totalExpenses = sqlite.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date >= ? AND expense_date <= ?`).get(from, to) as any;

    const salesByMethod = sqlite.prepare(`SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM sales WHERE sale_date >= ? AND sale_date <= ? AND payment_status = 'paid' GROUP BY payment_method`).all(from, to);
    const expensesByCategory = sqlite.prepare(`SELECT category, SUM(amount) as total FROM expenses WHERE expense_date >= ? AND expense_date <= ? GROUP BY category ORDER BY total DESC`).all(from, to);
    const dailySales = sqlite.prepare(`SELECT sale_date as date, SUM(amount) as total FROM sales WHERE sale_date >= ? AND sale_date <= ? AND payment_status = 'paid' GROUP BY sale_date ORDER BY sale_date`).all(from, to);

    const monthlySales = sqlite.prepare(`SELECT strftime('%Y-%m', sale_date) as month, SUM(amount) as total FROM sales WHERE payment_status = 'paid' GROUP BY month ORDER BY month DESC LIMIT 12`).all();
    const monthlyExpenses = sqlite.prepare(`SELECT strftime('%Y-%m', expense_date) as month, SUM(amount) as total FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12`).all();

    const outstandingInvoices = sqlite.prepare(`SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status IN ('sent', 'overdue')`).get() as any;
    const topCustomers = sqlite.prepare(`SELECT c.name, COUNT(s.id) as orders, SUM(s.amount) as total_spent FROM sales s JOIN customers c ON s.customer_id = c.id WHERE s.payment_status = 'paid' GROUP BY c.id ORDER BY total_spent DESC LIMIT 5`).all();

    // Revenue by order origin
    const revenueBySource = sqlite.prepare(`
      SELECT
        CASE
          WHEN s.order_id IS NULL THEN 'standalone'
          WHEN o.source = 'store' THEN 'store'
          ELSE 'admin'
        END as source,
        COUNT(s.id) as count,
        COALESCE(SUM(s.amount), 0) as total
      FROM sales s
      LEFT JOIN orders o ON s.order_id = o.id
      WHERE s.payment_status = 'paid'
        AND s.sale_date >= ? AND s.sale_date <= ?
      GROUP BY source
    `).all(from, to);

    const revenue = totalSales.total;
    const expenses = totalExpenses.total;
    const profit = revenue - expenses;

    return NextResponse.json({
      period: { from, to },
      revenue,
      expenses,
      profit,
      profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0",
      salesByMethod,
      expensesByCategory,
      dailySales,
      monthlySales,
      monthlyExpenses,
      outstandingInvoices: outstandingInvoices.total,
      topCustomers,
      revenueBySource,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
