import type { Metadata } from "next";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Order Custom Merchandise · Pwata Creatives",
  description: "T-shirts, hoodies, mugs, caps and more. Custom printed for you. Pay 50% deposit via MTN MoMo or Airtel Money.",
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="store-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Pwata Creatives"
            style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--primary)" }}>Pwata Creatives</div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Custom Merch</div>
          </div>
        </div>
        <span className="badge badge-blue" style={{ fontSize: "0.7rem" }}>🛍️ Custom Merch</span>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "1rem 1rem 5rem" }}>
        {children}
      </main>

      <Toaster richColors position="top-center" />
    </>
  );
}
