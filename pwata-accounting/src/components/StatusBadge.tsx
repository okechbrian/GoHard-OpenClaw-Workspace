interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const statusConfig = {
    awaiting_payment: { label: "Awaiting Payment", color: "badge-yellow", icon: "💳" },
    pending: { label: "Pending", color: "badge-yellow", icon: "⏳" },
    in_design: { label: "In Design", color: "badge-blue", icon: "🎨" },
    printing: { label: "Printing", color: "badge-purple", icon: "🖨️" },
    ready_for_delivery: { label: "Ready", color: "badge-green", icon: "📦" },
    completed: { label: "Completed", color: "badge-green", icon: "✅" },
    cancelled: { label: "Cancelled", color: "badge-red", icon: "❌" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: "badge-gray", icon: "❓" };

  return (
    <span className={`badge ${config.color} ${className}`}>
      {config.icon} {config.label}
    </span>
  );
}