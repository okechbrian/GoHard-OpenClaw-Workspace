import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import PlatformIcon from "@/components/PlatformIcon";
import ThemeToggle from "@/components/ThemeToggle";

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('pwata-theme');var t=s||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pwata Creatives · Order Design Work",
  description: "Custom graphic design, websites, and chatbots from Pwata Creatives. Merchandise, logos, social media, print, websites, WhatsApp + Telegram bots — delivered in days.",
  manifest: "/manifest.json",
  themeColor: "#ff7b00",
  appleWebApp: {
    capable: true,
    title: "Pwata",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "256775931342";
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <header className="store-header">
          <a href="/" className="brand-mark" style={{ textDecoration: "none", color: "inherit" }}>
            <img src="/logo.jpg" alt="Pwata Creatives" className="logo-img" />
            <span className="brand-name">
              <b>Pwata Creatives</b>
              <small>Design Studio</small>
            </span>
          </a>
          <div style={{ display: "inline-flex", alignItems: "center", gap: ".6rem" }}>
            <ThemeToggle />
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "0.78rem", color: "#25D366", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: ".4rem", fontWeight: 600 }}>
              <PlatformIcon platform="WhatsApp" size={16} />
              <span>WhatsApp</span>
            </a>
          </div>
        </header>
        <main>{children}</main>
        <footer className="footer">
          <div className="footer-links">
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
              <PlatformIcon platform="WhatsApp" size={14} />
              WhatsApp
            </a>
            <a href="https://instagram.com/pwatacreatives" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: ".35rem" }}>
              <PlatformIcon platform="Instagram" size={14} />
              Instagram
            </a>
            <a href="/">Services</a>
          </div>
          <div>© {new Date().getFullYear()} Pwata Creatives</div>
        </footer>
        <Toaster position="bottom-center" theme="system" />
      </body>
    </html>
  );
}
