"use client";
import { formatUGX } from "@/lib/services";
import PlatformIcon from "@/components/PlatformIcon";

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  service_type?: string;
  deadline_date?: string;
  notes?: string;
  created_at: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    customizations: Record<string, unknown>;
  }>;
}

const STAGES = [
  { key: "order_placed", label: "Order Placed", status: null },
  { key: "deposit_paid", label: "Deposit Paid", status: "in_design" },
  { key: "in_design", label: "In Design", status: "in_design" },
  { key: "printing", label: "Printing / Finalising", status: "printing" },
  { key: "completed", label: "Completed & Delivered", status: "completed" },
] as const;

function getStageIndex(order: Order): number {
  if (order.status === "completed") return 4;
  if (order.status === "printing") return 3;
  if (order.status === "in_design") return 2;
  if (order.payment_status === "partial" || order.payment_status === "paid") return 1;
  return 0;
}

function briefSummary(customizations: Record<string, unknown>): Array<{ label: string; key: string; value: string; raw: unknown }> {
  const fields = [
    ["Business", "business_name"], ["Industry", "industry"],
    ["Personality", "brand_personality"], ["Style", "style_preference"],
    ["Use", "intended_use"], ["Print text", "print_text"],
    ["Placement", "placement"], ["Platforms", "platforms"],
    ["Post type", "post_type"], ["Content", "content_text"],
    ["Purpose", "purpose"], ["Print type", "print_type"],
    ["Size", "size"], ["Color scheme", "color_scheme"],
    ["Print qty", "print_quantity"], ["Inspiration", "inspiration"],
    ["References", "reference_links"], ["Deadline", "deadline"],
  ];
  return fields
    .map(([label, key]) => {
      const v = customizations[key];
      if (!v) return null;
      const value = Array.isArray(v) ? v.join(", ") : String(v);
      return { label, key, value, raw: v };
    })
    .filter(Boolean) as Array<{ label: string; key: string; value: string; raw: unknown }>;
}

export default function OrderTracker({ order }: { order: Order }) {
  const stageIdx = getStageIndex(order);
  const depositPaid = order.payment_status === "partial" || order.payment_status === "paid";
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "256775931342";
  const waMsg = encodeURIComponent(`Hi Pwata Creatives! I'm following up on order *${order.order_number}*. Please update me on the status.`);
  const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;

  return (
    <div>
      {/* Status banner */}
      <div style={{
        padding: "1rem 1.25rem", borderRadius: 12, marginBottom: "1rem",
        background: depositPaid ? "rgba(34,197,94,.1)" : "rgba(245,158,11,.1)",
        border: `1.5px solid ${depositPaid ? "#22c55e" : "#f59e0b"}`,
      }}>
        <p style={{ fontWeight: 700, color: depositPaid ? "#22c55e" : "#f59e0b" }}>
          {depositPaid ? "🎉 Deposit received! Your order is confirmed." : "⏳ Waiting for payment confirmation."}
        </p>
        {depositPaid && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            We'll contact you via WhatsApp with updates.
          </p>
        )}
      </div>

      {/* Order number card */}
      <div className="card" style={{ marginBottom: "1rem", position: "relative" }}>
        <img src="/logo.jpg" alt="" className="logo-img"
          style={{ width: 26, height: 26, position: "absolute", top: "1rem", right: "1rem", opacity: 0.85 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: "2.5rem" }}>
          <div>
            <p className="label">Order number</p>
            <p style={{ fontWeight: 900, fontSize: "1.5rem", letterSpacing: "0.05em" }}>{order.order_number}</p>
          </div>
          <span className={`badge ${depositPaid ? "badge-green" : "badge-yellow"}`}>
            {depositPaid ? "Deposit paid" : "Awaiting payment"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.75rem", fontSize: "0.875rem" }}>
          <div><span style={{ color: "var(--text-muted)" }}>Total: </span><strong>{formatUGX(order.total_amount)}</strong></div>
          <div><span style={{ color: "var(--text-muted)" }}>Deposit: </span><strong style={{ color: "var(--primary)" }}>{formatUGX(order.deposit_amount)}</strong></div>
          <div><span style={{ color: "var(--text-muted)" }}>Balance: </span><strong>{formatUGX(order.total_amount - order.deposit_amount)}</strong></div>
        </div>
      </div>

      {/* Timeline */}
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.875rem" }}>Order progress</p>
        <ul className="timeline">
          {STAGES.map((stage, i) => {
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <li key={stage.key} className={`timeline-item${done ? " done" : active ? " active" : ""}`}>
                <span style={{ fontWeight: active ? 700 : done ? 600 : 400, color: active ? "var(--primary)" : done ? "var(--success)" : "var(--text-muted)" }}>
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Brief summary */}
      {order.items.length > 0 && (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <p style={{ fontWeight: 700, marginBottom: "0.75rem", fontSize: "0.875rem" }}>Your design brief</p>
          {order.items.map((item, i) => {
            const summary = briefSummary(item.customizations);
            return (
              <div key={i} style={{ marginBottom: i < order.items.length - 1 ? "1rem" : 0 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.5rem" }}>
                  {item.product_name} × {item.quantity}
                </div>
                {summary.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.25rem 0.75rem", fontSize: "0.8rem" }}>
                    {summary.map(({ label, key, value, raw }) => (
                      <div key={label} style={{ display: "contents" }}>
                        <span style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{label}:</span>
                        <span style={{ color: "var(--text)" }}>
                          {key === "platforms" && Array.isArray(raw) ? (
                            <span style={{ display: "inline-flex", gap: ".55rem", flexWrap: "wrap", alignItems: "center" }}>
                              {(raw as string[]).map((p) => (
                                <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: ".25rem" }}>
                                  <PlatformIcon platform={p} size={13} />
                                  {p}
                                </span>
                              ))}
                            </span>
                          ) : value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No brief details recorded.</p>
                )}
              </div>
            );
          })}
          {order.deadline_date && (
            <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--warning)" }}>
              ⏰ Deadline: {new Date(order.deadline_date).toLocaleDateString("en-UG", { dateStyle: "medium" })}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          className="btn btn-success btn-full btn-lg" style={{ textDecoration: "none" }}>
          💬 WhatsApp us about this order
        </a>
        <button type="button" className="btn btn-ghost btn-full"
          onClick={() => { navigator.clipboard.writeText(window.location.href); }}>
          🔗 Copy tracking link
        </button>
        <a href="/" className="btn btn-ghost btn-full" style={{ textDecoration: "none" }}>
          ← Place another order
        </a>
      </div>
    </div>
  );
}
