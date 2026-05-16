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

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
};

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [cashClose, setCashClose] = useState<CashClose | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [cashInput, setCashInput] = useState("");
  const [cashNotes, setCashNotes] = useState("");
  const [cashSaving, setCashSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);

  const loadCashClose = () =>
    fetch("/api/cash-close").then((r) => r.json()).then(setCashClose).catch(() => {});

  useEffect(() => {
    Promise.all([
      fetch("/api/reports").then((r) => r.json()),
      fetch("/api/orders/stats").then((r) => r.json()),
      fetch("/api/auth/session").then((r) => r.json()).catch(() => null),
    ])
      .then(([report, stats, session]) => {
        setData(report);
        setOrderStats(stats);
        if (session?.user?.name) setUserName(session.user.name);
      })
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
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setSearchResults(await res.json());
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "3rem", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--text-muted)", fontSize: ".875rem" }}>Loading your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Hero greeting */}
      <header className="dash-hero">
        <div>
          <span className="hero-eyebrow">Dashboard</span>
          <h1 className="hero-title-sm">
            Good {timeOfDay()}{userName ? `, ${userName.split(" ")[0]}` : ""}.
          </h1>
          <p className="hero-sub">
            {formatDate(new Date().toISOString())} · {orderStats?.totalActive ?? 0} active order{orderStats?.totalActive === 1 ? "" : "s"}
          </p>
        </div>
        <div className="dash-quick">
          <Link href="/orders/new" className="btn btn-primary" style={{ textDecoration: "none" }}>+ New order</Link>
          <Link href="/sales" className="btn btn-ghost" style={{ textDecoration: "none" }}>Record sale</Link>
        </div>
      </header>

      {/* Search */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <input
          className="input"
          placeholder="Search sales, expenses, customers, invoices..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchResults && (
          <div style={{ marginTop: "0.75rem", maxHeight: "300px", overflowY: "auto" }}>
            {searchResults.customers?.map((c: any) => (
              <div key={`c-${c.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-blue">Customer</span> <strong>{c.name}</strong> {c.phone && `· ${c.phone}`}
              </div>
            ))}
            {searchResults.sales?.map((s: any) => (
              <div key={`s-${s.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-green">Sale</span> {s.description} · <strong>{formatUGX(s.amount)}</strong> <span style={{ color: "var(--text-muted)" }}>({formatDate(s.sale_date)})</span>
              </div>
            ))}
            {searchResults.expenses?.map((e: any) => (
              <div key={`e-${e.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-red">Expense</span> {e.description} · <strong style={{ color: "#ef4444" }}>{formatUGX(e.amount)}</strong> <span style={{ color: "var(--text-muted)" }}>({e.category})</span>
              </div>
            ))}
            {searchResults.invoices?.map((inv: any) => (
              <div key={`i-${inv.id}`} style={{ padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span className="badge badge-yellow">Invoice</span> {inv.invoice_number} · <strong>{formatUGX(inv.total)}</strong> <span style={{ color: "var(--text-muted)" }}>({inv.status})</span>
              </div>
            ))}
            {!searchResults.sales?.length && !searchResults.expenses?.length && !searchResults.customers?.length && !searchResults.invoices?.length && (
              <p style={{ color: "var(--text-muted)", padding: "0.5rem", fontSize: "0.875rem" }}>No results found</p>
            )}
          </div>
        )}
      </div>

      {/* Today's pulse */}
      <section className="dash-section">
        <h2>Today's pulse</h2>
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value" style={{ color: "#22c55e" }}>{formatUGX(data?.revenue || 0)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "#ef4444" }}>{formatUGX(data?.expenses || 0)}</div>
            <div className="stat-label">Total Expenses</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: (data?.profit || 0) >= 0 ? "#22c55e" : "#ef4444" }}>
              {formatUGX(data?.profit || 0)}
            </div>
            <div className="stat-label">Net Profit</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--primary)" }}>{data?.profitMargin || "0"}%</div>
            <div className="stat-label">Profit Margin</div>
          </div>
        </div>
      </section>

      {/* Operations */}
      {orderStats && (
        <section className="dash-section">
          <h2>Operations</h2>
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
                Active Orders
                {orderStats.totalActive > 0 && (
                  <span style={{ marginLeft: "0.5rem", background: "var(--primary)", color: "#1a0e00", borderRadius: "9999px", padding: "0.1rem 0.55rem", fontSize: "0.7rem", fontWeight: 800 }}>
                    {orderStats.totalActive}
                  </span>
                )}
              </h3>
              <Link href="/orders/kanban" style={{ fontSize: "0.75rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                Kanban →
              </Link>
            </div>

            {orderStats.storeNewOrders > 0 && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid var(--warning)", borderRadius: "10px", padding: "0.6rem 0.9rem", marginBottom: "0.9rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                  {orderStats.storeNewOrders} new store order{orderStats.storeNewOrders !== 1 ? "s" : ""} awaiting review
                </span>
                <Link href="/orders?status=in_design" style={{ fontSize: "0.75rem", color: "var(--warning)", textDecoration: "none", fontWeight: 700 }}>
                  Review →
                </Link>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              {[
                { key: "pending", label: "Pending", color: "#f59e0b" },
                { key: "in_design", label: "In Design", color: "#a78bfa" },
                { key: "printing", label: "Printing", color: "#3b82f6" },
                { key: "ready_for_delivery", label: "Ready", color: "#22c55e" },
              ].map(({ key, label, color }) => {
                const count = orderStats[key as keyof OrderStats] as number;
                return (
                  <Link key={key} href={`/orders?status=${key}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ background: "var(--bg-input)", borderRadius: "10px", padding: "0.7rem 0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", border: count > 0 ? `1px solid ${color}55` : "1px solid transparent" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: ".5rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        {label}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", color: count > 0 ? color : "var(--text-muted)" }}>
                        {count}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {(orderStats.createdToday > 0 || orderStats.completedToday > 0) && (
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {orderStats.createdToday > 0 && <span>{orderStats.createdToday} new today</span>}
                {orderStats.completedToday > 0 && <span style={{ color: "#22c55e" }}>{orderStats.completedToday} completed today</span>}
              </div>
            )}

            {orderStats.totalActive === 0 && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem", paddingTop: "0.5rem" }}>
                No active orders. <Link href="/orders/new" style={{ color: "var(--primary)" }}>Create one →</Link>
              </p>
            )}
          </div>

          {data?.outstandingInvoices ? (
            <div className="card" style={{ marginTop: "0.85rem", borderColor: "var(--warning)" }}>
              <p style={{ fontSize: "0.875rem" }}>
                <strong>{formatUGX(data.outstandingInvoices)}</strong> outstanding in unpaid invoices
              </p>
            </div>
          ) : null}
        </section>
      )}

      {/* Breakdown */}
      <section className="dash-section">
        <h2>Breakdown</h2>
        <div className="dash-grid-2">
          <div className="card">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>Payments by method</h3>
            {data?.salesByMethod?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.salesByMethod.map((m) => (
                  <div key={m.payment_method} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem" }}>
                      {PAYMENT_LABELS[m.payment_method] || m.payment_method}
                      <span style={{ color: "var(--text-muted)", marginLeft: "0.5rem", fontSize: "0.75rem" }}>
                        ({m.count} transactions)
                      </span>
                    </span>
                    <span style={{ fontWeight: 700 }} className="num">{formatUGX(m.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No sales recorded yet</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>Top customers</h3>
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
                    <span style={{ fontWeight: 700 }} className="num">{formatUGX(c.total_spent)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No customers yet</p>
            )}
          </div>
        </div>
      </section>

      {/* Cash close */}
      {cashClose && (
        <section className="dash-section">
          <h2>Daily cash close</h2>
          <div className="card">
            <div style={{ background: "var(--bg-input)", borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Expected cash today</span>
                <span style={{ fontWeight: 800, color: cashClose.expected >= 0 ? "#22c55e" : "#ef4444" }} className="num">
                  {cashClose.expected >= 0 ? "+" : ""}{formatUGX(cashClose.expected)}
                </span>
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
                Cash sales minus cash expenses for {cashClose.today}
              </p>
            </div>

            {cashClose.todayClose ? (
              <div style={{ background: Math.abs(cashClose.todayClose.difference) < 1000 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${Math.abs(cashClose.todayClose.difference) < 1000 ? "var(--success)" : "var(--danger)"}`, borderRadius: "10px", padding: "0.85rem 1rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <span style={{ fontSize: "0.875rem" }}>Actual counted</span>
                  <span style={{ fontWeight: 700 }} className="num">{formatUGX(cashClose.todayClose.actual_cash)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.875rem" }}>Difference</span>
                  <span style={{ fontWeight: 800, color: Math.abs(cashClose.todayClose.difference) < 1000 ? "#22c55e" : "#ef4444" }} className="num">
                    {cashClose.todayClose.difference >= 0 ? "+" : ""}{formatUGX(cashClose.todayClose.difference)}
                  </span>
                </div>
                {cashClose.todayClose.notes && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>{cashClose.todayClose.notes}</p>
                )}
                <button
                  style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
                  onClick={() => { setCashInput(String(cashClose.todayClose!.actual_cash)); setCashNotes(cashClose.todayClose!.notes ?? ""); }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label className="label">Actual cash in drawer (UGX)</label>
                  <input className="input" type="number" placeholder="e.g. 145000" value={cashInput} onChange={(e) => setCashInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Note (optional)</label>
                  <input className="input" placeholder="e.g. 5000 short, gave change from pocket" value={cashNotes} onChange={(e) => setCashNotes(e.target.value)} />
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                  disabled={cashSaving || !cashInput}
                  onClick={handleCashClose}
                >
                  {cashSaving ? "Saving…" : "Record cash close"}
                </button>
              </>
            )}

            {cashClose.history.length > 0 && (
              <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Last 7 days</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  {cashClose.history.map((h) => (
                    <div key={h.close_date} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>{h.close_date}</span>
                      <span style={{ color: Math.abs(h.difference) < 1000 ? "#22c55e" : "#ef4444", fontWeight: 700 }} className="num">
                        {h.difference >= 0 ? "+" : ""}{formatUGX(h.difference)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
