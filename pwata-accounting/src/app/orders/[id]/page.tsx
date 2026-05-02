"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import StatusBadge from "@/components/StatusBadge";
import { formatUGX, formatDate } from "@/lib/utils";
import { briefToText, type DesignBrief } from "@/lib/design-brief";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations: string | null;
}

interface StatusHistoryEntry {
  id: string;
  status: string;
  notes: string | null;
  changed_by_name: string | null;
  created_at: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  status: string;
  total_amount: number;
  deposit_amount?: number;
  source?: string;
  payment_method: string | null;
  payment_status: string;
  delivery_address: string | null;
  notes: string | null;
  deadline_date?: string | null;
  artwork_urls?: string | null;
  created_at: string;
  items: OrderItem[];
  statusHistory: StatusHistoryEntry[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_design", label: "In Design" },
  { value: "printing", label: "Printing" },
  { value: "ready_for_delivery", label: "Ready for Delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  mtn_momo: "MTN MoMo",
  airtel_money: "Airtel Money",
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseCustomizationsLabel(raw: string | null): string {
  if (!raw) return "";
  try {
    const obj = JSON.parse(raw) as DesignBrief;
    if (typeof obj === "string") return obj;
    const parts: string[] = [];
    if (obj.color || obj.size) parts.push([obj.color, obj.size].filter(Boolean).join(", "));
    if (obj.print_text) parts.push(`"${obj.print_text}"`);
    if (obj.style) parts.push(obj.style);
    if (obj.placement) parts.push(obj.placement);
    return parts.join(" · ") || (obj.notes ?? "");
  } catch {
    return raw;
  }
}

function hasBriefContent(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const obj = JSON.parse(raw) as DesignBrief;
    return !!(obj.print_text || obj.style || obj.color_scheme || obj.placement || obj.inspiration);
  } catch {
    return false;
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("fetch failed");
      const data: OrderDetail = await res.json();
      setOrder(data);
      setNewStatus(data.status);
    } catch {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes: statusNotes || undefined }),
      });
      if (res.ok) {
        const updated: OrderDetail = await res.json();
        setOrder(updated);
        setStatusNotes("");
        toast.success(`Status updated to ${newStatus}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Update failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="container">
        <div className="card" style={{ marginTop: "2rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>Order not found</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "1rem" }}>This order may have been deleted or the link is incorrect.</p>
          <Link href="/orders" className="btn btn-primary">Back to orders</Link>
        </div>
      </div>
    );
  }

  const customer = order.customer_name || (order.guest_name ? `${order.guest_name} (guest)` : order.guest_phone || "Unknown");
  const isLocked = order.status === "completed" || order.status === "cancelled";

  return (
    <div className="container">
      <header style={{ padding: "1.5rem 0 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <Link href="/orders" style={{ color: "var(--text-muted)", fontSize: "0.875rem", textDecoration: "none" }}>← Orders</Link>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem" }}>{order.order_number}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Created {formatTimestamp(order.created_at)}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={order.status} />
          <p style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "0.25rem", color: "#22c55e" }}>{formatUGX(order.total_amount)}</p>
        </div>
      </header>

      {/* Status update */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Update Status</h2>
        {isLocked ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>This order is {order.status} and cannot be updated.</p>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">New Status</label>
                <select className="select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Notes (optional)</label>
                <input className="input" placeholder="e.g. Designs approved by client" value={statusNotes} onChange={(e) => setStatusNotes(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
              <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating || newStatus === order.status}>
                {updating ? "Updating…" : "Update Status"}
              </button>
            </div>
            {(newStatus === "ready_for_delivery" || newStatus === "completed") && newStatus !== order.status && (
              <p style={{ fontSize: "0.75rem", color: "var(--warning)", marginTop: "0.5rem" }}>
                ⚠️ This will auto-create a Sale + Invoice record.
              </p>
            )}
          </>
        )}
      </div>

      {/* Design Brief card — show for store orders that have brief content */}
      {order.source === "store" && order.items.some((it) => hasBriefContent(it.customizations)) && (
        <div className="card" style={{ marginBottom: "1rem", borderLeft: "4px solid var(--primary)" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>📋 Design Brief</h2>
          {order.deadline_date && (() => {
            const daysLeft = Math.ceil((new Date(order.deadline_date).getTime() - Date.now()) / 86400000);
            return (
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: daysLeft <= 3 ? "var(--warning)" : "var(--text-muted)", marginBottom: "0.75rem" }}>
                {daysLeft <= 3 ? "⚠️" : "📅"} Deadline: {order.deadline_date}{daysLeft <= 3 ? ` (${daysLeft}d away!)` : ""}
              </p>
            );
          })()}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {order.items.map((it) => {
              if (!hasBriefContent(it.customizations)) return null;
              try {
                const brief = JSON.parse(it.customizations ?? "{}") as DesignBrief;
                const text = briefToText(it.product_name, it.quantity, brief);
                return (
                  <div key={it.id} style={{ background: "var(--bg-input)", borderRadius: 8, padding: "0.625rem 0.75rem" }}>
                    <pre style={{ fontFamily: "inherit", fontSize: "0.8rem", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>{text}</pre>
                  </div>
                );
              } catch {
                return null;
              }
            })}
          </div>
          {order.artwork_urls && (() => {
            try {
              const urls: string[] = JSON.parse(order.artwork_urls);
              if (!urls.length) return null;
              return (
                <div style={{ marginTop: "0.75rem" }}>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>Reference images:</p>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`ref ${i + 1}`} style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }} />
                      </a>
                    ))}
                  </div>
                </div>
              );
            } catch { return null; }
          })()}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1rem" }}>
        {/* Customer & delivery */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Customer & Delivery</h2>
          <dl style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "0.5rem 1rem", fontSize: "0.875rem" }}>
            <dt style={{ color: "var(--text-muted)" }}>Customer</dt>
            <dd>{customer}</dd>
            {order.guest_phone && (<><dt style={{ color: "var(--text-muted)" }}>Phone</dt><dd>{order.guest_phone}</dd></>)}
            {order.guest_email && (<><dt style={{ color: "var(--text-muted)" }}>Email</dt><dd>{order.guest_email}</dd></>)}
            <dt style={{ color: "var(--text-muted)" }}>Delivery</dt>
            <dd>{order.delivery_address || "—"}</dd>
            <dt style={{ color: "var(--text-muted)" }}>Payment</dt>
            <dd>
              {order.payment_method ? PAYMENT_LABELS[order.payment_method] || order.payment_method : "—"}
              {" · "}
              <span className={`badge ${order.payment_status === "paid" ? "badge-green" : order.payment_status === "partial" ? "badge-blue" : order.payment_status === "pending" ? "badge-yellow" : "badge-red"}`}>
                {order.payment_status}
              </span>
            </dd>
            {order.source === "store" && order.deposit_amount && order.deposit_amount > 0 && (
              <>
                <dt style={{ color: "var(--text-muted)" }}>Deposit</dt>
                <dd>
                  {formatUGX(order.deposit_amount)} of {formatUGX(order.total_amount)}
                  {" · "}
                  <span className={`badge ${order.payment_status === "partial" || order.payment_status === "paid" ? "badge-green" : "badge-yellow"}`}>
                    {order.payment_status === "partial" || order.payment_status === "paid" ? "Paid" : "Pending"}
                  </span>
                </dd>
              </>
            )}
            {order.notes && (<><dt style={{ color: "var(--text-muted)" }}>Notes</dt><dd>{order.notes}</dd></>)}
          </dl>
        </div>

        {/* Items */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Items ({order.items.length})</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {order.items.map((it) => {
              const custom = parseCustomizationsLabel(it.customizations);
              return (
                <div key={it.id} style={{ display: "flex", gap: "0.75rem", padding: "0.5rem", background: "var(--bg-input)", borderRadius: "8px" }}>
                  {it.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={it.image_url} alt={it.product_name} style={{ width: "56px", height: "56px", objectFit: "cover", borderRadius: "6px", flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div style={{ width: "56px", height: "56px", background: "var(--bg)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.5rem" }}>📦</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{it.product_name}</p>
                    {custom && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{custom}</p>}
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{it.quantity} × {formatUGX(it.unit_price)}</p>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatUGX(it.subtotal)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status history */}
        <div className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>History</h2>
          <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {order.statusHistory.map((h) => (
              <li key={h.id} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <StatusBadge status={h.status} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem" }}>{h.notes || "Status changed"}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {formatTimestamp(h.created_at)}{h.changed_by_name ? ` · ${h.changed_by_name}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center" }}>
        {formatDate(order.created_at)}
      </p>
    </div>
  );
}
