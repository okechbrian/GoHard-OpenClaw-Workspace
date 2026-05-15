"use client";
import { useRouter } from "next/navigation";
import type { ServiceType } from "@/lib/services";
import { SERVICE_META } from "@/lib/services";

interface Props {
  service: ServiceType;
  priceFrom?: string;
}

export default function ServiceCard({ service, priceFrom }: Props) {
  const router = useRouter();
  const meta = SERVICE_META[service];

  return (
    <button
      type="button"
      onClick={() => router.push(`/order/${service}`)}
      style={{
        background: "var(--bg-card)",
        border: `1.5px solid var(--border)`,
        borderRadius: 14,
        padding: "1.25rem 1rem",
        cursor: "pointer",
        textAlign: "left",
        transition: "transform 0.15s, border-color 0.15s",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = meta.color;
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
      }}
    >
      <span style={{ fontSize: "2rem", lineHeight: 1 }}>{meta.icon}</span>
      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text)" }}>{meta.label}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{meta.tagline}</div>
      {priceFrom && (
        <div style={{ fontSize: "0.72rem", color: meta.color, fontWeight: 700, marginTop: "0.25rem" }}>
          From {priceFrom}
        </div>
      )}
    </button>
  );
}
