import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Pwata Creatives — Order Design Work",
  description: "Order custom graphic design work from Pwata Creatives. Merchandise, logos, social media graphics, print and flyers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="store-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🎨</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: "1rem", letterSpacing: "-0.01em" }}>Pwata Creatives</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Custom Design Studio</div>
            </div>
          </div>
          <a href="/" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none" }}>All services</a>
        </header>
        <main>{children}</main>
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
