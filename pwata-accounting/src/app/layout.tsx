"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import NavIcon from "@/components/NavIcon";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const PRIMARY_NAV = [
  { href: "/",        label: "Home",    icon: "home" },
  { href: "/orders",  label: "Orders",  icon: "orders" },
  { href: "/sales",   label: "Sales",   icon: "sales" },
  { href: "/reports", label: "Reports", icon: "reports" },
];

const SECONDARY_NAV = [
  { href: "/invoices",  label: "Invoices", icon: "invoices" },
  { href: "/expenses",  label: "Expenses", icon: "expenses" },
  { href: "/products",  label: "Catalog",  icon: "catalog" },
  { href: "/customers", label: "Clients",  icon: "clients" },
  { href: "/inventory", label: "Stock",    icon: "stock" },
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
    await fetch("/api/auth/logout", { method: "DELETE" });
    window.location.href = "/login";
  };

  const [avatarBroken, setAvatarBroken] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the More sheet on navigation
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  // ESC closes the More sheet
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMoreOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const isSecondaryActive = SECONDARY_NAV.some((item) => pathname.startsWith(item.href));

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
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {user?.picture && !avatarBroken ? (
              <img
                src={user.picture}
                alt=""
                referrerPolicy="no-referrer"
                width={28}
                height={28}
                onError={() => setAvatarBroken(true)}
                style={{ borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }}
              />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--primary)", color: "#000",
                display: "grid", placeItems: "center",
                fontWeight: 700, fontSize: "0.75rem",
              }}>
                {user?.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{user?.name}</span>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }}>Logout</button>
          </div>
        </div>

        <div className="main-content">
          {children}
        </div>

        <nav className="bottom-nav">
          {PRIMARY_NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const showBadge = item.href === "/orders" && pendingCount > 0;
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
                {showBadge && (
                  <span className="nav-badge">{pendingCount > 9 ? "9+" : pendingCount}</span>
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={isSecondaryActive ? "active" : ""}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <NavIcon name="more" />
            <span>More</span>
          </button>
        </nav>

        {moreOpen && (
          <>
            <div className="more-sheet-backdrop" onClick={() => setMoreOpen(false)} />
            <div className="more-sheet" role="dialog" aria-label="More navigation">
              <div className="more-sheet-handle" />
              <p className="more-sheet-title">More</p>
              <div className="more-sheet-grid">
                {SECONDARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={pathname.startsWith(item.href) ? "active" : ""}
                  >
                    <NavIcon name={item.icon} size={24} />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </body>
    </html>
  );
}
