import { timingSafeEqual } from "crypto";

export interface ChargeParams {
  amount: number;
  email: string;
  phone_number: string;
  network: "MTN" | "AIRTEL";
  tx_ref: string;
  order_id: string;
  customer_name: string;
}

export async function initiateCharge(
  params: ChargeParams
): Promise<{ ok: boolean; flw_ref?: string; error?: string }> {
  const secretKey = process.env.FLW_SECRET_KEY;
  if (!secretKey) return { ok: false, error: "Payment gateway not configured" };

  try {
    const res = await fetch(
      "https://api.flutterwave.com/v3/charges?type=mobile_money_uganda",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: "UGX",
          email: params.email,
          phone_number: params.phone_number,
          network: params.network,
          tx_ref: params.tx_ref,
          fullname: params.customer_name,
          meta: { order_id: params.order_id },
        }),
      }
    );

    const data = await res.json();

    if (data.status === "success" || data.data?.status === "pending") {
      return { ok: true, flw_ref: data.data?.flw_ref };
    }
    return { ok: false, error: data.message || "Charge initiation failed" };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error" };
  }
}

export function verifyWebhookSignature(
  secretHash: string,
  incomingHash: string
): boolean {
  try {
    const a = Buffer.from(secretHash);
    const b = Buffer.from(incomingHash);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
