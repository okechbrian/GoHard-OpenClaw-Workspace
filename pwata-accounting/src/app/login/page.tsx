"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const DENY_MESSAGES: Record<string, string> = {
  "1": "This Google account isn't authorized for Pwata Creatives Accounting. Contact the admin to request access.",
  "state": "Sign-in session expired. Please try again.",
  "exchange": "Couldn't complete sign-in with Google. Please try again.",
  "token": "Couldn't verify your Google account. Please try again.",
  "unverified": "Your Google email isn't verified.",
  "config": "Sign-in is temporarily unavailable. Please try again later.",
};

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const deny = params.get("denied");
  const message = deny ? (DENY_MESSAGES[deny] ?? DENY_MESSAGES["1"]) : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="brand-mark" style={{ justifyContent: "center", marginBottom: "1.5rem", gap: ".75rem" }}>
          <img src="/logo.jpg" alt="Pwata Creatives" className="logo-img" style={{ width: 44, height: 44 }} />
          <span className="brand-name">
            <b style={{ fontSize: "1.05rem" }}>Pwata Creatives</b>
            <small>Accounting</small>
          </span>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", marginBottom: "1.5rem" }}>
          Sign in with your Google account to continue
        </p>

        {message && (
          <div role="alert" style={{
            padding: "0.75rem 0.9rem",
            background: "rgba(239,68,68,.1)",
            border: "1px solid rgba(239,68,68,.3)",
            borderRadius: "10px",
            color: "#ef4444",
            fontSize: "0.8rem",
            marginBottom: "1rem",
          }}>
            {message}
          </div>
        )}

        <a
          href="/api/auth/login/google"
          className="btn btn-lg"
          style={{
            width: "100%",
            minHeight: "48px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.65rem",
            background: "#fff",
            color: "#1f1f1f",
            border: "1px solid #dadce0",
            borderRadius: "10px",
            fontWeight: 600,
            fontSize: "0.95rem",
            textDecoration: "none",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </a>

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Looking for the customer side? <a href="https://pwata-orders.vercel.app" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Order design work →</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
