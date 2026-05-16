"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/orders", label: "Orders", icon: "📋" },
  { href: "/products", label: "Catalog", icon: "🛍️" },
  { href: "/sales", label: "Sales", icon: "💰" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
  { href: "/expenses", label: "Expenses", icon: "📉" },
  { href: "/customers", label: "Clients", icon: "👥" },
  { href: "/inventory", label: "Stock", icon: "📦" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (pathname.startsWith("/store")) return;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated && pathname !== "/login") {
          window.location.href = "/login";
        } else {
          setUser(data.user);
          setLoading(false);
        }
      })
      .catch(() => {
        if (pathname !== "/login") window.location.href = "/login";
      });
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/store") || pathname === "/login" || !user) return;
    const tick = () => {
      fetch("/api/orders/pending-approvals")
        .then((r) => r.json())
        .then((d) => setPendingCount(d.count ?? 0))
        .catch(() => { /* ignore */ });
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [pathname, user]);

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  };

  if (pathname === "/login" || pathname.startsWith("/store")) {
    return (
      <html lang="en" className={inter.variable}>
        <head>
          <title>Pwata Creatives</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="theme-color" content="#ff7b00" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="en" className={inter.variable}>
        <head><title>Pwata Creatives</title></head>
        <body><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>Loading...</div></body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Pwata Creatives — Accounting</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(22,22,22,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)", padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="brand-mark">
            <img src="/logo.jpg" alt="Pwata Creatives" className="logo-img" />
            <span className="brand-name">
              <b>Pwata Creatives</b>
              <small>Accounting</small>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user?.name}</span>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>Logout</button>
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>

        <nav className="bottom-nav">
          {navItems.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const showBadge = item.href === "/orders" && pendingCount > 0;
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""} style={{ position: "relative" }}>
                <span className="bottom-nav-icon">{item.icon}</span>
                {item.label}
                {showBadge && (
                  <span className="nav-badge">{pendingCount > 9 ? "9+" : pendingCount}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </body>
    </html>
  );
}
