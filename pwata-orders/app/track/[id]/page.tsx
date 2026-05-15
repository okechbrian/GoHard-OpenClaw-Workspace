"use client";
import { use, useEffect, useState } from "react";
import OrderTracker from "@/components/OrderTracker";

export default function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/order-poll/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Order not found");
        return r.json();
      })
      .then((data) => {
        setOrder({
          ...data,
          items: (data.items ?? []).map((item: any) => ({
            ...item,
            customizations: typeof item.customizations === "string"
              ? JSON.parse(item.customizations)
              : (item.customizations ?? {}),
          })),
        });
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: "3rem", textAlign: "center" }}>
        <div className="spinner" />
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>Loading order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container" style={{ paddingTop: "2rem", textAlign: "center" }}>
        <p style={{ color: "var(--danger)", marginBottom: "1rem" }}>⚠️ {error || "Order not found."}</p>
        <a href="/" className="btn btn-primary" style={{ textDecoration: "none" }}>← Back to services</a>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <h2 style={{ fontWeight: 800, fontSize: "1rem", marginBottom: "1rem" }}>Order Tracking</h2>
      <OrderTracker order={order} />
    </div>
  );
}
