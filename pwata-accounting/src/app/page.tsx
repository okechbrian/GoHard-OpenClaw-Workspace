"use client";

import { useState, useEffect } from "react";
import { formatUGX, formatDate } from "@/lib/utils";

interface DashboardData {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: string;
  outstandingInvoices: number;
  salesByMethod: Array<{ payment_method: string; count: number; total: number }>;
  topCustomers: Array<{ name: string; orders: number; total_spent: number }>;
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults(null); return; }
    setSearching(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const results = await res.json();
    setSearchResults(results);
    setSearching(false);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    );
  }

  const paymentLabels: Record<string, string> = {
    cash: "💵 Cash",
    mtn_momo: "📱 MTN MoMo",
    airtel_money: "📱 Airtel Money",
  };

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <img src="/logo.jpg" alt="Pwata Creatives" style={{ height: "40px", width: "40px", borderRadius: "6px" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Pwata Creatives</h1>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Accounting Dashboard</p>
      </header>

      {/* Search */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <input className="input" placeholder="🔍 Search sales, expenses, customers, invoices..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} />
        {searchResults && (
          <div style={{ marginTop: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
            {searchResults.customers?.map((c: any) => (
              <div key={`c-${c.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-blue">Customer</span> <strong>{c.name}</strong> {c.phone && `— ${c.phone}`}
              </div>
            ))}
            {searchResults.sales?.map((s: any) => (
              <div key={`s-${s.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-green">Sale</span> {s.description} — <strong>{formatUGX(s.amount)}</strong> <span style={{ color: "var(--text-muted)" }}>({formatDate(s.sale_date)})</span>
              </div>
            ))}
            {searchResults.expenses?.map((e: any) => (
              <div key={`e-${e.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-red">Expense</span> {e.description} — <strong style={{ color: "#ef4444" }}>{formatUGX(e.amount)}</strong> <span style={{ color: "var(--text-muted)" }}>({e.category})</span>
              </div>
            ))}
            {searchResults.invoices?.map((inv: any) => (
              <div key={`i-${inv.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-yellow">Invoice</span> {inv.invoice_number} — <strong>{formatUGX(inv.total)}</strong> <span style={{ color: "var(--text-muted)" }}>({inv.status})</span>
              </div>
            ))}
            {!searchResults.sales?.length && !searchResults.expenses?.length && !searchResults.customers?.length && !searchResults.invoices?.length && (
              <p style={{ color: "var(--text-muted)", padding: "0.5rem", fontSize: "0.875rem" }}>No results found</p>
            )}
          </div>
        )}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#22c55e" }}>
            {formatUGX(data?.revenue || 0)}
          </div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#ef4444" }}>
            {formatUGX(data?.expenses || 0)}
          </div>
          <div className="stat-label">Total Expenses</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: (data?.profit || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
            {formatUGX(data?.profit || 0)}
          </div>
          <div className="stat-label">Net Profit</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "#6366f1" }}>
            {data?.profitMargin || "0"}%
          </div>
          <div className="stat-label">Profit Margin</div>
        </div>
      </div>

      {data?.outstandingInvoices ? (
        <div className="card" style={{ marginTop: "1rem", borderColor: "var(--warning)" }}>
          <p style={{ fontSize: "0.875rem" }}>
            ⚠️ <strong>{formatUGX(data.outstandingInvoices)}</strong> in outstanding invoices
          </p>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Payment Breakdown
        </h2>
        {data?.salesByMethod?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.salesByMethod.map((m) => (
              <div key={m.payment_method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem" }}>
                  {paymentLabels[m.payment_method] || m.payment_method}
                  <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                    ({m.count} transactions)
                  </span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatUGX(m.total)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No sales recorded yet</p>
        )}
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Top Customers
        </h2>
        {data?.topCustomers?.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {data.topCustomers.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem" }}>
                  {c.name}
                  <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                    ({c.orders} orders)
                  </span>
                </span>
                <span style={{ fontWeight: 600 }}>{formatUGX(c.total_spent)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No customers yet</p>
        )}
      </div>
    </div>
  );
}
