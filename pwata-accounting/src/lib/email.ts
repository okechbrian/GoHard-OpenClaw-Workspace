import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM ?? "Pwata Creatives <noreply@pwata-creatives.com>";

function getResend(): Resend | null {
  if (!RESEND_API_KEY) {
    console.warn("⚠ RESEND_API_KEY not set — skipping email");
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

export async function sendDepositConfirmationEmail(params: {
  to: string;
  orderNumber: string;
  trackingLink: string;
  invoicePdfUrl?: string;
  customerName: string;
}) {
  const resend = getResend();
  if (!resend) return { sent: false, reason: "no API key" };

  const { to, orderNumber, trackingLink, invoicePdfUrl, customerName } = params;
  const nameFirst = customerName.trim().split(/\s+/)[0] || "there";

  const html = [
    `<!DOCTYPE html>`,
    `<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9f9f9;">`,
    `<div style="background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`,
    `<h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #111;">Hi ${nameFirst} 👋</h1>`,
    `<p style="font-size: 16px; color: #444; margin: 0 0 20px; line-height: 1.5;">`,
    `Your deposit for order <strong>${orderNumber}</strong> has been confirmed — we're now working on your designs!</p>`,
    `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">`,
    `<p style="margin: 0 0 4px; font-size: 14px; color: #166534;"><strong>✅ Deposit Confirmed</strong></p>`,
    `<p style="margin: 0; font-size: 14px; color: #166534;">Order status: <strong>In Design</strong></p>`,
    `</div>`,
    `<div style="display: flex; gap: 12px; margin-bottom: 24px;">`,
    `<a href="${trackingLink}" style="display: inline-block; padding: 12px 24px; background: #f97316; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">📋 Track Order</a>`,
    invoicePdfUrl
      ? `<a href="${invoicePdfUrl}" style="display: inline-block; padding: 12px 24px; background: #111; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">🧾 View Invoice</a>`
      : "",
    `</div>`,
    `<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />`,
    `<p style="font-size: 13px; color: #888; margin: 0; line-height: 1.4;">`,
    `If you have any questions, reply to this email or contact us on WhatsApp.<br/>`,
    `— Pwata Creatives Team</p>`,
    `</div></body></html>`,
  ].join("\n");

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Your Pwata Order ${orderNumber} — Deposit Confirmed!`,
      html,
    });
    if (error) {
      console.error("❌ Resend send error:", error);
      return { sent: false, reason: error.message };
    }
    console.log(`✅ Deposit confirmation email sent to ${to} for order ${orderNumber}`);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("❌ Failed to send deposit confirmation email:", err);
    return { sent: false, reason: String(err) };
  }
}
