"use client";

import { useState, useEffect } from "react";
import { formatUGX, formatDate } from "@/lib/utils";

interface ReportData {
  revenue: number; expenses: number; profit: number; profitMargin: string;
  salesByMethod: Array<{ payment_method: string; count: number; total: number }>;
  expensesByCategory: Array<{ category: string; total: number }>;
  dailySales: Array<{ date: string; total: number }>;
  topCustomers: Array<{ name: string; orders: number; total_spent: number }>;
  revenueBySource: Array<{ source: string; count: number; total: number }>;
}

const paymentLabels: Record<string, string> = { cash: "💵 Cash", mtn_momo: "📱 MTN MoMo", airtel_money: "📱 Airtel Money" };

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const exportCSV = (type: string) => {
    window.open(`/api/export?type=${type}`, "_blank");
  };

  if (loading) return <div className="container" style={{ padding: "2rem", textAlign: "center" }}><p style={{ color: "var(--text-muted)" }}>Loading report...</p></div>;

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Reports</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Profit & Loss Overview</p>
      </header>

      {/* Export buttons */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>📥 Export Data</h2>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-ghost" onClick={() => exportCSV("sales")}>📊 Sales CSV</button>
          <button className="btn btn-ghost" onClick={() => exportCSV("expenses")}>📉 Expenses CSV</button>
          <button className="btn btn-ghost" onClick={() => exportCSV("customers")}>👥 Customers CSV</button>
          <button className="btn btn-ghost" onClick={() => window.open("/api/backup", "_blank")}>💾 Backup DB</button>
        </div>
      </div>

      {/* Restore */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>🔄 Restore Backup</h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Upload a .db backup file to restore data</p>
        <input type="file" accept=".db" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (!confirm("This will replace ALL current data. Are you sure?")) return;
          const formData = new FormData();
          formData.append("backup", file);
          const res = await fetch("/api/backup", { method: "POST", body: formData });
          const result = await res.json();
          if (result.success) { alert("Restored! Refresh the page."); window.location.reload(); }
          else { alert("Restore failed: " + result.error); }
        }} className="input" style={{ padding: "0.5rem" }} />
      </div>

      {/* P&L Summary */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Profit & Loss</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "#22c55e" }}>Total Revenue</span>
            <span style={{ fontWeight: 600, color: "#22c55e" }}>{formatUGX(data?.revenue || 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "#ef4444" }}>Total Expenses</span>
            <span style={{ fontWeight: 600, color: "#ef4444" }}>-{formatUGX(data?.expenses || 0)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.125rem", fontWeight: 700 }}>
            <span>Net Profit</span>
            <span style={{ color: (data?.profit || 0) >= 0 ? "#22c55e" : "#ef4444" }}>{formatUGX(data?.profit || 0)}</span>
          </div>
          <div style={{ textAlign: "center", padding: "0.5rem", background: "rgba(99,102,241,0.1)", borderRadius: "8px" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>PROFIT MARGIN</span>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#6366f1" }}>{data?.profitMargin || "0"}%</div>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Revenue by Payment Method</h2>
        {data?.salesByMethod?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.salesByMethod.map((m) => (
              <div key={m.payment_method}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.875rem" }}>{paymentLabels[m.payment_method] || m.payment_method} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({m.count})</span></span>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{formatUGX(m.total)}</span>
                </div>
                <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${(m.total / (data?.revenue || 1)) * 100}%`, background: "#6366f1", borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No data yet</p>}
      </div>

      {/* Expense Breakdown */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Expenses by Category</h2>
        {data?.expensesByCategory?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.expensesByCategory.map((e) => (
              <div key={e.category}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.875rem" }}>{e.category}</span>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#ef4444" }}>{formatUGX(e.total)}</span>
                </div>
                <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "3px" }}>
                  <div style={{ height: "100%", width: `${(e.total / (data?.expenses || 1)) * 100}%`, background: "#ef4444", borderRadius: "3px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No expenses yet</p>}
      </div>

      {/* Revenue by Source */}
      {data?.revenueBySource?.length ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Revenue by Source</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { key: "store", label: "🛍️ Online Store", color: "#6366f1" },
              { key: "admin", label: "📋 Admin Orders", color: "#3b82f6" },
              { key: "standalone", label: "💰 Direct Sales", color: "#22c55e" },
            ].map(({ key, label, color }) => {
              const row = data.revenueBySource.find((r) => r.source === key);
              if (!row) return null;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.875rem" }}>{label} <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>({row.count})</span></span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{formatUGX(row.total)}</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--bg-input)", borderRadius: "3px" }}>
                    <div style={{ height: "100%", width: `${(row.total / (data?.revenue || 1)) * 100}%`, background: color, borderRadius: "3px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Top Customers */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Top Customers</h2>
        {data?.topCustomers?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.topCustomers.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><span style={{ fontSize: "0.875rem", fontWeight: 600 }}>#{i + 1} {c.name}</span><span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.75rem" }}>({c.orders} orders)</span></div>
                <span style={{ fontWeight: 600 }}>{formatUGX(c.total_spent)}</span>
              </div>
            ))}
          </div>
        ) : <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No customers yet</p>}
      </div>
    </div>
  );
}
