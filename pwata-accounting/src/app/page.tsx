"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

interface OrderStats {
  pending: number;
  in_design: number;
  printing: number;
  ready_for_delivery: number;
  totalActive: number;
  storeNewOrders: number;
  createdToday: number;
  completedToday: number;
}

interface CashClose {
  today: string;
  expected: number;
  todayClose: { actual_cash: number; difference: number; notes: string | null } | null;
  history: Array<{ close_date: string; expected_cash: number; actual_cash: number; difference: number }>;
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [cashClose, setCashClose] = useState<CashClose | null>(null);
  const [cashInput, setCashInput] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [cashSaving, setCashSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const loadCashClose = () =>
    fetch("/api/cash-close").then((r) => r.json()).then(setCashClose).catch(() => {});

  useEffect(() => {
    Promise.all([
      fetch("/api/reports").then((r) => r.json()),
      fetch("/api/orders/stats").then((r) => r.json()),
    ])
      .then(([report, stats]) => { setData(report); setOrderStats(stats); })
      .catch(() => {})
      .finally(() => setLoading(false));
    loadCashClose();
  }, []);

  const handleCashClose = async () => {
    const actual = parseFloat(cashInput.replace(/,/g, ""));
    if (isNaN(actual)) return;
    setCashSaving(true);
    await fetch("/api/cash-close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual_cash: actual, notes: cashNotes || undefined }),
    });
    await loadCashClose();
    setCashInput("");
    setCashNotes("");
    setCashSaving(false);
  };

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

      {/* Orders Operations Widget */}
      {orderStats && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              Active Orders
              {orderStats.totalActive > 0 && (
                <span style={{ marginLeft: "0.5rem", background: "var(--primary)", color: "white", borderRadius: "9999px", padding: "0.1rem 0.5rem", fontSize: "0.7rem", fontWeight: 700 }}>
                  {orderStats.totalActive}
                </span>
              )}
            </h2>
            <Link href="/orders/kanban" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
              Kanban →
            </Link>
          </div>

          {orderStats.storeNewOrders > 0 && (
            <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid var(--warning)", borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                ⚠️ {orderStats.storeNewOrders} new store order{orderStats.storeNewOrders !== 1 ? "s" : ""} awaiting review
              </span>
              <Link href="/orders?status=in_design" style={{ fontSize: "0.75rem", color: "var(--warning)", textDecoration: "none", fontWeight: 700 }}>
                Review →
              </Link>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {[
              { key: "pending", label: "Pending", color: "#f59e0b", icon: "⏳" },
              { key: "in_design", label: "In Design", color: "#6366f1", icon: "🎨" },
              { key: "printing", label: "Printing", color: "#3b82f6", icon: "🖨️" },
              { key: "ready_for_delivery", label: "Ready", color: "#22c55e", icon: "📦" },
            ].map(({ key, label, color, icon }) => {
              const count = orderStats[key as keyof OrderStats] as number;
              return (
                <Link
                  key={key}
                  href={`/orders?status=${key}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ background: "var(--bg-input)", borderRadius: "8px", padding: "0.625rem 0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", border: count > 0 ? `1px solid ${color}33` : "1px solid transparent" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{icon} {label}</span>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem", color: count > 0 ? color : "var(--text-muted)" }}>
                      {count}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {(orderStats.createdToday > 0 || orderStats.completedToday > 0) && (
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {orderStats.createdToday > 0 && (
                <span>🆕 {orderStats.createdToday} new today</span>
              )}
              {orderStats.completedToday > 0 && (
                <span style={{ color: "#22c55e" }}>✅ {orderStats.completedToday} completed today</span>
              )}
            </div>
          )}

          {orderStats.totalActive === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", paddingTop: "0.5rem" }}>
              No active orders. <Link href="/orders/new" style={{ color: "var(--primary)" }}>Create one →</Link>
            </p>
          )}
        </div>
      )}

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

      {/* Daily Cash Close */}
      {cashClose && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>💵 Daily Cash Close</h2>

          <div style={{ background: "var(--bg-input)", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Expected cash today</span>
              <span style={{ fontWeight: 700, color: cashClose.expected >= 0 ? "#22c55e" : "#ef4444" }}>
                {cashClose.expected >= 0 ? "+" : ""}{formatUGX(cashClose.expected)}
              </span>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Cash sales − cash expenses for {cashClose.today}
            </p>
          </div>

          {cashClose.todayClose ? (
            <div style={{ background: Math.abs(cashClose.todayClose.difference) < 1000 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${Math.abs(cashClose.todayClose.difference) < 1000 ? "var(--success)" : "var(--danger)"}`, borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.875rem" }}>Actual counted</span>
                <span style={{ fontWeight: 700 }}>{formatUGX(cashClose.todayClose.actual_cash)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.875rem" }}>Difference</span>
                <span style={{ fontWeight: 700, color: Math.abs(cashClose.todayClose.difference) < 1000 ? "#22c55e" : "#ef4444" }}>
                  {cashClose.todayClose.difference >= 0 ? "+" : ""}{formatUGX(cashClose.todayClose.difference)}
                  {" "}{Math.abs(cashClose.todayClose.difference) < 1000 ? "✓" : "⚠️"}
                </span>
              </div>
              {cashClose.todayClose.notes && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.375rem" }}>{cashClose.todayClose.notes}</p>
              )}
              <button
                style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                onClick={() => { setCashInput(String(cashClose.todayClose!.actual_cash)); setCashNotes(cashClose.todayClose!.notes ?? ""); }}
              >
                Edit
              </button>
            </div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label className="label">Actual cash in drawer (UGX)</label>
                <input
                  className="input"
                  type="number"
                  placeholder="e.g. 145000"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                <label className="label">Note (optional)</label>
                <input
                  className="input"
                  placeholder="e.g. 5000 short — gave change from pocket"
                  value={cashNotes}
                  onChange={(e) => setCashNotes(e.target.value)}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={cashSaving || !cashInput}
                onClick={handleCashClose}
              >
                {cashSaving ? "Saving…" : "Record Cash Close"}
              </button>
            </>
          )}

          {cashClose.history.length > 0 && (
            <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last 7 days</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                {cashClose.history.map((h) => (
                  <div key={h.close_date} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>{h.close_date}</span>
                    <span style={{ color: Math.abs(h.difference) < 1000 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                      {h.difference >= 0 ? "+" : ""}{formatUGX(h.difference)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
