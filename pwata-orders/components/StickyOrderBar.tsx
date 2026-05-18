"use client";
import { formatUGX } from "@/lib/services";

interface Props {
  itemCount: number;
  total: number;
  deposit: number;
}

export default function StickyOrderBar({ itemCount, total, deposit }: Props) {
  if (total <= 0) return null;
  return (
    <div className="sticky-order-bar-inline">
      <span className="sticky-order-bar-count">
        {itemCount} item{itemCount === 1 ? "" : "s"} · <span className="num">{formatUGX(total)}</span>
      </span>
      <span className="sticky-order-bar-deposit num">
        50% deposit {formatUGX(deposit)}
      </span>
    </div>
  );
}
