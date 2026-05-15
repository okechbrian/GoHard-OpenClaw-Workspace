import ServiceCard from "@/components/ServiceCard";
import { formatUGX } from "@/lib/services";

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: "1.5rem" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary) 0%, #e06a00 100%)",
        borderRadius: 16, padding: "1.5rem", marginBottom: "1.5rem", color: "white",
      }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 900, marginBottom: "0.4rem", lineHeight: 1.2 }}>
          Order custom design work
        </h1>
        <p style={{ fontSize: "0.875rem", opacity: 0.9, lineHeight: 1.5 }}>
          Professional graphic design in Kampala. Pick a service, describe your idea, and pay a 50% deposit to get started.
        </p>
      </div>

      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
        Choose a service
      </p>

      <div className="service-grid">
        <ServiceCard service="merchandise" priceFrom={formatUGX(25000)} />
        <ServiceCard service="logo" priceFrom={formatUGX(80000)} />
        <ServiceCard service="social" priceFrom={formatUGX(60000)} />
        <ServiceCard service="print" priceFrom={formatUGX(25000)} />
      </div>

      <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "1rem", border: "1px solid var(--border)", marginBottom: "2rem" }}>
        <p style={{ fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>How it works</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            ["1", "Choose a service and fill in your design brief"],
            ["2", "Pay 50% deposit via MTN MoMo or Airtel Money"],
            ["3", "We design and send you updates on WhatsApp"],
            ["4", "Pay balance on delivery/completion"],
          ].map(([n, text]) => (
            <div key={n} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", fontSize: "0.8rem" }}>
              <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem", flexShrink: 0 }}>{n}</span>
              <span style={{ color: "var(--text-muted)", paddingTop: 2 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
