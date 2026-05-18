"use client";
import { formatUGX } from "@/lib/utils";

interface Action {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface Props {
  itemCount: number;
  subtotal: number;
  showDeposit?: boolean;
  primaryAction?: Action;
  variant?: "sticky" | "inline";
}

export default function OrderSummaryBar({
  itemCount, subtotal,
  showDeposit = true,
  primaryAction,
  variant = "sticky",
}: Props) {
  if (subtotal <= 0 && itemCount === 0) return null;
  const deposit = Math.ceil(subtotal * 0.5);

  return (
    <div className={`order-summary-bar order-summary-bar-${variant}`}>
      <div className="order-summary-bar-inner">
        <div className="order-summary-bar-totals">
          <span className="order-summary-bar-count">
            {itemCount} item{itemCount === 1 ? "" : "s"}
            <span className="num" style={{ marginLeft: ".4rem" }}>· {formatUGX(subtotal)}</span>
          </span>
          {showDeposit && (
            <span className="order-summary-bar-deposit num">
              50% deposit {formatUGX(deposit)}
            </span>
          )}
        </div>
        {primaryAction && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
            style={{ padding: "0.55rem 1rem", fontSize: "0.85rem" }}
          >
            {primaryAction.loading ? "..." : primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
