"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import "./globals.css";

const navItems = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/sales", label: "Sales", icon: "💰" },
  { href: "/expenses", label: "Expenses", icon: "📉" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
  { href: "/customers", label: "Clients", icon: "👥" },
  { href: "/inventory", label: "Stock", icon: "📦" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const handleLogout = async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    window.location.href = "/login";
  };

  if (pathname === "/login") {
    return (
      <html lang="en">
        <head>
          <title>Pwata Creatives — Login</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
          <meta name="theme-color" content="#0f172a" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="en">
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
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--bg-card)", borderBottom: "1px solid var(--border)", padding: "0.5rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, color: "#6366f1", fontSize: "0.875rem" }}>Pwata</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user?.name}</span>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem" }}>Logout</button>
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>

        <nav className="bottom-nav">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={pathname === item.href ? "active" : ""}>
              <span className="bottom-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </body>
    </html>
  );
}
