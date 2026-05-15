import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pwata Creatives — Order Design Work",
  description: "Custom graphic design from Pwata Creatives, Kampala. Merchandise, logos, social media, print & flyers — delivered in days.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "256775931342";
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <header className="store-header">
          <a href="/" className="brand-mark" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="logo">P</span>
            <span className="brand-name">
              <b>Pwata Creatives</b>
              <small>Kampala · Design Studio</small>
            </span>
          </a>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
            💬 WhatsApp
          </a>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-links">
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="https://instagram.com/pwatacreatives" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="/">Services</a>
          </div>
          <div>© {new Date().getFullYear()} Pwata Creatives · Kampala, Uganda</div>
        </footer>
        <Toaster position="bottom-center" theme="dark" />
      </body>
    </html>
  );
}
