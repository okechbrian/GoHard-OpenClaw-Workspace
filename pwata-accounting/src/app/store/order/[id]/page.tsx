"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { briefToText, type DesignBrief } from "@/lib/design-brief";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations: string | null;
}

interface StoreOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  deadline_date?: string | null;
  artwork_urls?: string | null;
  source: string;
  created_at: string;
  items?: OrderItem[];
}

function formatUGX(n: number) {
  return `UGX ${n.toLocaleString("en-UG")}`;
}

const STATUS_TIMELINE = [
  { key: "placed", label: "Order Placed", icon: "📝" },
  { key: "deposit", label: "Deposit Paid", icon: "💳" },
  { key: "in_design", label: "In Design", icon: "🎨" },
  { key: "printing", label: "Printing", icon: "🖨️" },
  { key: "completed", label: "Completed", icon: "✅" },
];

function getTimelineState(order: StoreOrder, key: string): "done" | "active" | "pending" {
  const depositPaid = order.payment_status === "partial" || order.payment_status === "paid";
  const statusOrder = ["pending", "in_design", "printing", "ready_for_delivery", "completed"];
  const currentIdx = statusOrder.indexOf(order.status);

  if (key === "placed") return "done";
  if (key === "deposit") return depositPaid ? "done" : order.status === "pending" ? "active" : "pending";
  if (key === "in_design") {
    if (currentIdx > 1) return "done";
    if (order.status === "in_design") return "active";
    return "pending";
  }
  if (key === "printing") {
    if (currentIdx > 2) return "done";
    if (order.status === "printing") return "active";
    return "pending";
  }
  if (key === "completed") {
    return order.status === "completed" ? "done" : order.status === "ready_for_delivery" ? "active" : "pending";
  }
  return "pending";
}

export default function StoreOrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/store/orders/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) setOrder(data); })
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => toast.success("Tracking link copied!"));
  };

  const whatsappNum = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "256700000000";

  const buildWhatsAppMessage = () => {
    const lines = [`Hi Pwata Creatives! 👋`, `Order: ${order?.order_number ?? ""}`, `---`];
    if (order?.items?.length) {
      for (const it of order.items) {
        try {
          const brief = JSON.parse(it.customizations ?? "{}") as DesignBrief;
          lines.push(briefToText(it.product_name, it.quantity, brief));
        } catch {
          lines.push(`${it.quantity}× ${it.product_name}`);
        }
      }
      lines.push("---");
    }
    if (order?.deadline_date) lines.push(`Deadline: ${order.deadline_date}`);
    lines.push("I have a question.");
    return lines.join("\n");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner" style={{ margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading order…</p>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🔍</div>
        <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Order not found</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>Check your order number or contact us below.</p>
        <Link href="/store" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  const depositPaid = order.payment_status === "partial" || order.payment_status === "paid";

  return (
    <div>
      {/* Confirmation banner */}
      <div className="card" style={{
        marginBottom: "1rem",
        background: depositPaid ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
        borderColor: depositPaid ? "var(--success)" : "var(--warning)",
        textAlign: "center",
        padding: "1.25rem",
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{depositPaid ? "🎉" : "⏳"}</div>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
          {depositPaid ? "Deposit received! Your order is confirmed." : "Waiting for payment confirmation…"}
        </h2>
        {depositPaid && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            We will contact you when your order is ready.
          </p>
        )}
      </div>

      {/* Order number */}
      <div className="card" style={{ marginBottom: "1rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Number</p>
        <p style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--primary)", margin: "0.25rem 0" }}>{order.order_number}</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>TOTAL</p>
            <p style={{ fontWeight: 700 }}>{formatUGX(order.total_amount)}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>DEPOSIT</p>
            <p style={{ fontWeight: 700, color: depositPaid ? "var(--success)" : "var(--warning)" }}>{formatUGX(order.deposit_amount)}</p>
          </div>
          <div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>BALANCE</p>
            <p style={{ fontWeight: 700 }}>{formatUGX(order.total_amount - order.deposit_amount)}</p>
          </div>
        </div>
      </div>

      {/* Status timeline */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Progress</h3>
        <ul className="timeline">
          {STATUS_TIMELINE.map((step) => {
            const state = getTimelineState(order, step.key);
            return (
              <li key={step.key} className={`timeline-item ${state}`} style={{ marginBottom: "0.5rem" }}>
                <span style={{ fontWeight: state === "active" ? 700 : 400, color: state === "done" ? "var(--success)" : state === "active" ? "var(--primary)" : "var(--text-muted)" }}>
                  {step.icon} {step.label}
                </span>
                {state === "active" && <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "var(--primary)" }}>← current</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Design Brief summary */}
      {order.items && order.items.some((it) => {
        try { const b = JSON.parse(it.customizations ?? "{}") as DesignBrief; return !!(b.print_text || b.style || b.placement); } catch { return false; }
      }) && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Your Design Brief</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {order.items.map((it, i) => {
              try {
                const brief = JSON.parse(it.customizations ?? "{}") as DesignBrief;
                const text = briefToText(it.product_name, it.quantity, brief);
                return (
                  <pre key={i} style={{ fontFamily: "inherit", fontSize: "0.8rem", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0, background: "var(--bg-input)", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                    {text}
                  </pre>
                );
              } catch { return null; }
            })}
          </div>
          {order.deadline_date && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.625rem" }}>
              📅 Needed by: <strong>{order.deadline_date}</strong>
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <button
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={copyLink}
        >
          📋 Copy tracking link
        </button>

        <a
          href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent(buildWhatsAppMessage())}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-success"
          style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
        >
          💬 Contact us on WhatsApp
        </a>

        <Link href="/store" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}>
          🛍️ Order more
        </Link>
      </div>
    </div>
  );
}
