const BASE = (process.env.ACCOUNTING_API_URL ?? "https://pwata-accounting.vercel.app").replace(/\/$/, "");
const KEY = process.env.ORDERS_APP_API_KEY ?? "";

async function apiFetch(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Orders-API-Key": KEY,
    ...((init.headers ?? {}) as Record<string, string>),
  };
  return fetch(`${BASE}${path}`, { ...init, headers });
}

export async function fetchProducts() {
  const res = await apiFetch("/api/store/products");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function createOrder(body: Record<string, unknown>) {
  const res = await apiFetch("/api/store/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create order");
  return data as { id: string; order_number: string; total_amount: number; deposit_amount: number };
}

export async function pollOrder(id: string) {
  const res = await apiFetch(`/api/store/orders/${id}`);
  if (!res.ok) return null;
  return res.json();
}
