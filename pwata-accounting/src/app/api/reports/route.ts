import { sql } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "2000-01-01";
    const to = searchParams.get("to") || "2099-12-31";

    const totalSales = (await sql`
      SELECT COALESCE(SUM(amount), 0) AS total FROM sales
      WHERE sale_date >= ${from} AND sale_date <= ${to} AND payment_status = 'paid'
    ` as any[])[0];

    const totalExpenses = (await sql`
      SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
      WHERE expense_date >= ${from} AND expense_date <= ${to}
    ` as any[])[0];

    const salesByMethod = await sql`
      SELECT payment_method, COUNT(*)::int AS count, SUM(amount) AS total
      FROM sales WHERE sale_date >= ${from} AND sale_date <= ${to} AND payment_status = 'paid'
      GROUP BY payment_method
    `;

    const expensesByCategory = await sql`
      SELECT category, SUM(amount) AS total FROM expenses
      WHERE expense_date >= ${from} AND expense_date <= ${to}
      GROUP BY category ORDER BY total DESC
    `;

    const dailySales = await sql`
      SELECT sale_date AS date, SUM(amount) AS total FROM sales
      WHERE sale_date >= ${from} AND sale_date <= ${to} AND payment_status = 'paid'
      GROUP BY sale_date ORDER BY sale_date
    `;

    const monthlySales = await sql`
      SELECT TO_CHAR(sale_date, 'YYYY-MM') AS month, SUM(amount) AS total
      FROM sales WHERE payment_status = 'paid'
      GROUP BY month ORDER BY month DESC LIMIT 12
    `;

    const monthlyExpenses = await sql`
      SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month, SUM(amount) AS total
      FROM expenses GROUP BY month ORDER BY month DESC LIMIT 12
    `;

    const outstandingInvoices = (await sql`
      SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE status IN ('sent', 'overdue')
    ` as any[])[0];

    const topCustomers = await sql`
      SELECT c.name, COUNT(s.id)::int AS orders, SUM(s.amount) AS total_spent
      FROM sales s JOIN customers c ON s.customer_id = c.id
      WHERE s.payment_status = 'paid'
      GROUP BY c.id, c.name ORDER BY total_spent DESC LIMIT 5
    `;

    const revenueBySource = await sql`
      SELECT
        CASE
          WHEN s.order_id IS NULL THEN 'standalone'
          WHEN o.source = 'store' THEN 'store'
          ELSE 'admin'
        END AS source,
        COUNT(s.id)::int AS count,
        COALESCE(SUM(s.amount), 0) AS total
      FROM sales s LEFT JOIN orders o ON s.order_id = o.id
      WHERE s.payment_status = 'paid' AND s.sale_date >= ${from} AND s.sale_date <= ${to}
      GROUP BY source
    `;

    const revenue = Number(totalSales.total);
    const expensesTotal = Number(totalExpenses.total);
    const profit = revenue - expensesTotal;

    return NextResponse.json({
      period: { from, to },
      revenue,
      expenses: expensesTotal,
      profit,
      profitMargin: revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0",
      salesByMethod,
      expensesByCategory,
      dailySales,
      monthlySales,
      monthlyExpenses,
      outstandingInvoices: Number(outstandingInvoices.total),
      topCustomers,
      revenueBySource,
    });
  } catch (error) {
    console.error("reports failed:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
