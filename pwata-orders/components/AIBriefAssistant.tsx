"use client";
import { useState } from "react";
import type { ServiceType } from "@/lib/services";

interface Props {
  serviceType: ServiceType;
  onFill: (fields: Record<string, unknown>) => void;
}

export default function AIBriefAssistant({ serviceType, onFill }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/brief-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_type: serviceType, free_text: text }),
      });
      const data = await res.json();
      if (data.ok) {
        onFill(data.fields);
        setOpen(false);
        setText("");
      } else {
        setError(data.error ?? "Could not parse response. Try again.");
      }
    } catch {
      setError("Network error. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const placeholders: Record<ServiceType, string> = {
    logo: "e.g. \"I need a bold street logo for my football club Kizibazi FC. Red and black, energetic.\"",
    social: "e.g. \"5 Instagram posts for a promotion on our new coffee blend. Modern, warm tones.\"",
    print: "e.g. \"A4 flyer for an end-of-year party at Club Silk on Dec 20th. Vibrant, include: doors open 9pm, tickets 10k.\"",
    merchandise: "e.g. \"Hoodies for my Makerere engineering class. Print \\\"Eng. Class 2025\\\" and our faculty motto.\"",
  };

  return (
    <>
      <button type="button" className="ai-fab" onClick={() => setOpen(true)}>
        ✨ Describe your idea
      </button>

      {open && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !loading) setOpen(false); }}>
          <div className="modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1rem" }}>✨ AI Brief Assistant</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Describe your idea — we'll fill in the form for you.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.25rem", cursor: "pointer" }}>✕</button>
            </div>

            <div className="form-group">
              <textarea
                className="input"
                rows={5}
                placeholder={placeholders[serviceType]}
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>
            )}

            <button
              type="button"
              className="btn btn-full"
              disabled={!text.trim() || loading}
              onClick={handleSubmit}
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", border: "none" }}
            >
              {loading ? "Thinking..." : "✨ Fill my brief"}
            </button>

            {loading && (
              <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
                Analysing your description...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
