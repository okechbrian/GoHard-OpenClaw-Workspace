"use client";

import { useState } from "react";

const isDev = process.env.NODE_ENV !== "production";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

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
          Sign in to your accounting workspace
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="you@pwata.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input className="input" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: "#ef4444", fontSize: "0.85rem", marginBottom: "1rem" }}>{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {isDev && (
          <div style={{ marginTop: "1.5rem", padding: "0.9rem 1rem", background: "var(--bg-input)", borderRadius: "10px", border: "1px dashed var(--border)" }}>
            <p style={{ display: "inline-block", fontSize: "0.6rem", fontWeight: 700, letterSpacing: ".1em", color: "var(--primary)", textTransform: "uppercase", marginBottom: "0.5rem", background: "rgba(255,123,0,.12)", padding: "2px 6px", borderRadius: "4px" }}>Dev demo</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>gohard@pwata.com / gohard123</p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>wife@pwata.com / pwata2024</p>
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Looking for the customer side? <a href="https://pwata-orders.vercel.app" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Order design work →</a>
        </p>
      </div>
    </div>
  );
}
