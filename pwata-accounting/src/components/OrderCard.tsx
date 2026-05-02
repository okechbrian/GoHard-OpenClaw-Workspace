"use client";

import { formatUGX } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

interface OrderCardProps {
  order: {
    id: string;
    order_number: string;
    customer_name?: string;
    guest_name?: string;
    guest_phone?: string;
    total_amount: number;
    status: string;
    created_at: string;
    items?: Array<{
      product_name: string;
      quantity: number;
      customizations?: string;
    }>;
  };
  onClick?: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const customerName = order.customer_name || `Guest: ${order.guest_name || order.guest_phone || "No name"}`;

  // Format created date as relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Generate product summary
  const productSummary = order.items
    ?.slice(0, 2)
    .map(item => `${item.quantity}× ${item.product_name}`)
    .join(", ") || "No items";

  return (
    <div
      className="card"
      style={{
        marginBottom: "0.75rem",
        cursor: onClick ? "pointer" : "default",
        padding: "0.75rem"
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{order.order_number}</span>
        <StatusBadge status={order.status} />
      </div>

      <p style={{
        fontSize: "0.875rem",
        marginBottom: "0.5rem",
        color: "var(--text-muted)"
      }}>
        {customerName}
      </p>

      <p style={{
        fontSize: "0.75rem",
        marginBottom: "0.5rem",
        lineHeight: "1.3"
      }}>
        {productSummary}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
          {formatUGX(order.total_amount)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {formatRelativeTime(order.created_at)}
        </span>
      </div>
    </div>
  );
}