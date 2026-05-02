"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import { formatUGX, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  total_amount: number;
  deposit_amount?: number;
  source?: string;
  status: string;
  payment_status: string;
  payment_method: string;
  item_count: number;
  created_at: string;
}

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "in_design", label: "In Design" },
  { value: "printing", label: "Printing" },
  { value: "ready_for_delivery", label: "Ready" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    try {
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [status, search, from, to]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 200); // debounce search
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Orders</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{orders.length} order{orders.length === 1 ? "" : "s"}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
            <span style={{ padding: "0.5rem 0.875rem", background: "var(--primary)", color: "white", fontSize: "0.875rem", fontWeight: 600 }}>List</span>
            <Link href="/orders/kanban" style={{ padding: "0.5rem 0.875rem", color: "var(--text-muted)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>Kanban</Link>
          </div>
          <Link href="/orders/new" className="btn btn-primary">+ New Order</Link>
        </div>
      </header>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="form-row" style={{ marginBottom: "0.5rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Search</label>
            <input className="input" placeholder="Order #, customer, phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">From</label>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="label">To</label>
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const customer = o.customer_name || (o.guest_name ? `${o.guest_name} (guest)` : o.guest_phone || "—");
              return (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {o.order_number}
                    {o.source === "store" && (
                      <span className="badge badge-blue" style={{ marginLeft: "0.375rem", fontSize: "0.6rem" }}>Store</span>
                    )}
                  </td>
                  <td>{customer}</td>
                  <td>{o.item_count}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{formatUGX(o.total_amount)}</span>
                    {o.source === "store" && o.deposit_amount && o.payment_status !== "paid" && (
                      <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Deposit: {formatUGX(o.deposit_amount)}
                      </span>
                    )}
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>
                    <span className={`badge ${o.payment_status === "paid" ? "badge-green" : o.payment_status === "pending" ? "badge-yellow" : "badge-red"}`}>
                      {o.payment_status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDate(o.created_at)}</td>
                  <td>
                    <Link href={`/orders/${o.id}`} className="btn btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", textDecoration: "none" }}>👁 View</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && !orders.length && (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>
            No orders found. {status || search || from || to ? "Try adjusting filters." : "Tap + New Order to create one."}
          </p>
        )}
        {loading && <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Loading…</p>}
      </div>
    </div>
  );
}
