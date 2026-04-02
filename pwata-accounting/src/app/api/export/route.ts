import sqlite from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let data: any[] = [];
    let filename = "";
    let headers: string[] = [];

    if (type === "sales") {
      let query = `SELECT s.sale_date, s.description, s.amount, s.payment_method, s.payment_status, s.notes, c.name as customer FROM sales s LEFT JOIN customers c ON s.customer_id = c.id WHERE 1=1`;
      const params: any[] = [];
      if (from) { query += ` AND s.sale_date >= ?`; params.push(from); }
      if (to) { query += ` AND s.sale_date <= ?`; params.push(to); }
      query += ` ORDER BY s.sale_date DESC`;
      data = sqlite.prepare(query).all(...params);
      headers = ["Date", "Description", "Amount (UGX)", "Payment Method", "Status", "Customer", "Notes"];
      filename = `pwata-sales-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "expenses") {
      let query = `SELECT * FROM expenses WHERE 1=1`;
      const params: any[] = [];
      if (from) { query += ` AND expense_date >= ?`; params.push(from); }
      if (to) { query += ` AND expense_date <= ?`; params.push(to); }
      query += ` ORDER BY expense_date DESC`;
      data = sqlite.prepare(query).all(...params);
      headers = ["Date", "Category", "Description", "Amount (UGX)", "Payment Method", "Notes"];
      filename = `pwata-expenses-${new Date().toISOString().split("T")[0]}.csv`;
    } else if (type === "customers") {
      data = sqlite.prepare(`SELECT c.name, c.phone, c.email, c.address, (SELECT COUNT(*) FROM sales WHERE customer_id = c.id) as orders, (SELECT COALESCE(SUM(amount),0) FROM sales WHERE customer_id = c.id) as total_spent FROM customers c ORDER BY c.name`).all();
      headers = ["Name", "Phone", "Email", "Address", "Total Orders", "Total Spent (UGX)"];
      filename = `pwata-customers-${new Date().toISOString().split("T")[0]}.csv`;
    }

    // Generate CSV
    const csvRows = [headers.join(",")];
    for (const row of data) {
      const values = Object.values(row).map((v) => {
        const str = String(v ?? "");
        return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      });
      csvRows.push(values.join(","));
    }

    const csv = csvRows.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
