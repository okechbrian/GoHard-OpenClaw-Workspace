"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import NavIcon from "@/components/NavIcon";
import ThemeToggle from "@/components/ThemeToggle";
import { unlockAudio } from "@/lib/notification-sound";
import { toast } from "sonner";
import "./globals.css";

const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('pwata-theme');var t=s||(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

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
  const [notifState, setNotifState] = useState<"off" | "on" | "denied">("off");

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

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") setNotifState("on");
      else if (Notification.permission === "denied") setNotifState("denied");
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "DELETE" });
    window.location.href = "/login";
  };

  const [avatarBroken, setAvatarBroken] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifOrders, setNotifOrders] = useState<any[]>([]);
  const [notifBadge, setNotifBadge] = useState(0);

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
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="en" className={inter.variable}>
        <head>
          <title>Pwata Creatives</title>
          <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        </head>
        <body><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-muted)" }}>Loading...</div></body>
      </html>
    );
  }

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <title>Pwata Creatives — Accounting</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {/* Top bar */}
        <div style={{ position: "sticky", top: 0, zIndex: 30, background: "var(--top-bar-bg)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--border)", padding: "0.65rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  unlockAudio();
                  if (notifOpen) { setNotifOpen(false); return; }
                  setNotifOpen(true);
                  setNotifBadge(0);
                  if (Notification.permission === "default") {
                    const r = await Notification.requestPermission();
                    if (r === "granted") setNotifState("on");
                    else if (r === "denied") setNotifState("denied");
                  } else if (Notification.permission === "granted") {
                    setNotifState("on");
                  }
                  try {
                    const res = await fetch("/api/orders/recent");
                    const data = await res.json();
                    if (Array.isArray(data)) setNotifOrders(data);
                  } catch {}
                }}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "1rem", lineHeight: 1, padding: "2px 4px", position: "relative",
                  opacity: notifState === "on" ? 1 : 0.5,
                }}
                title={
                  notifState === "on" ? "Recent orders" :
                  notifState === "denied" ? "Notifications blocked" :
                  "Enable notifications"
                }
              >
                {notifState === "on" ? "🔔" : notifState === "denied" ? "🚫" : "🔕"}
                {notifBadge > 0 && (
                  <span style={{
                    position: "absolute", top: -4, right: -4,
                    background: "#ef4444", color: "#fff",
                    fontSize: "0.55rem", fontWeight: 700,
                    padding: "1px 4px", borderRadius: 8, lineHeight: 1.2,
                  }}>
                    {notifBadge > 9 ? "9+" : notifBadge}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div
                    style={{ position: "fixed", inset: 0, zIndex: 39 }}
                    onClick={() => setNotifOpen(false)}
                  />
                  <div style={{
                    position: "absolute", top: "100%", right: 0, zIndex: 40,
                    width: 300, maxHeight: 320, overflowY: "auto",
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    padding: "0.5rem 0", marginTop: 6,
                  }}>
                    <p style={{ padding: "0.25rem 0.75rem 0.5rem", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                      Recent orders
                    </p>
                    {notifOrders.length === 0 ? (
                      <p style={{ padding: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>No recent orders</p>
                    ) : (
                      notifOrders.map((o, i) => (
                        <Link
                          key={o.id}
                          href={`/orders/${o.id}`}
                          onClick={() => setNotifOpen(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.45rem 0.75rem", textDecoration: "none", color: "inherit",
                            background: i === 0 ? "rgba(227,122,84,0.06)" : "transparent",
                            borderBottom: i < notifOrders.length - 1 ? "1px solid var(--border)" : "none",
                          }}
                        >
                          <span style={{ fontSize: "0.85rem", flexShrink: 0 }}>{i === 0 ? "🆕" : "📋"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: "0.8rem", fontWeight: 600 }}>{o.order_number}</p>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {o.customer}
                            </p>
                          </div>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right" }}>
                            <span className={`badge ${o.status === "completed" ? "badge-green" : o.status === "cancelled" ? "badge-red" : "badge-yellow"}`} style={{ fontSize: "0.5rem" }}>
                              {o.status}
                            </span>
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            <ThemeToggle />
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
