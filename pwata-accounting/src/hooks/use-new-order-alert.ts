"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { playNotificationChime } from "@/lib/notification-sound";

interface Order {
  id: string;
  order_number: string;
  customer_name: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  total_amount: number;
  status: string;
  source?: string;
}

function showNotification(title: string, body: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/logo.jpg", tag: "pwata-new-order" });
  } catch {
    try {
      navigator.serviceWorker?.ready?.then((reg) => {
        reg.showNotification(title, { body, icon: "/logo.jpg", tag: "pwata-new-order" });
      });
    } catch {

    }
  }
}

export function useNewOrderAlert(orders: Order[]) {
  const seenIds = useRef<Set<string>>(new Set());
  const ready = useRef(0);

  useEffect(() => {
    if (ready.current < 2) {
      if (orders.length > 0) {
        for (const o of orders) seenIds.current.add(o.id);
        ready.current = 2;
      } else {
        ready.current++;
      }
      return;
    }

    const newOnes = orders.filter((o) => !seenIds.current.has(o.id));
    if (newOnes.length === 0) return;

    console.log(`[pwata-notif] ${newOnes.length} new order(s) detected:`, newOnes.map((o) => o.order_number));

    for (const o of newOnes) {
      seenIds.current.add(o.id);

      const customer = o.customer_name || o.guest_name || o.guest_phone || "Someone";
      const label = o.source === "store" ? " (Store)" : "";
      const title = `📦 New Order: ${o.order_number}${label}`;
      const body = `${customer} — UGX ${o.total_amount.toLocaleString("en-UG")}`;

      playNotificationChime();
      showNotification(title, body);
      toast(title, { description: body, duration: 6000 });
    }
  }, [orders]);
}
