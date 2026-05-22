import { formatUGX } from "@/lib/utils";
import { statusLabel } from "@/lib/whatsapp-bot"; // Reuse the status labels

export type IncomingTelegramText = {
  chatId: number;
  fromId: number;
  messageId: number;
  text: string;
};

type OrderLookupResult = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  deposit_amount: number;
  guest_name: string | null;
  guest_phone: string | null;
  customer_name: string | null;
  created_at: string;
};

const DEFAULT_REPLY = [
  "Thanks for messaging Pwata Creatives on Telegram.",
  "",
  "Reply with:",
  "1 - Start a new order",
  "2 - Check order status",
  "3 - See price starting points",
  "4 - Talk to a person",
].join("\n");

const ORDER_APP_URL = (
  process.env.ORDERS_APP_PUBLIC_URL ||
  process.env.ORDERS_APP_URL ||
  "https://pwata-orders.vercel.app"
).replace(/\/$/, "");

// Basic Webhook parsing
export function extractTelegramMessages(payload: any): IncomingTelegramText[] {
  const messages: IncomingTelegramText[] = [];
  if (payload.message && payload.message.text) {
    messages.push({
      chatId: payload.message.chat.id,
      fromId: payload.message.from?.id,
      messageId: payload.message.message_id,
      text: payload.message.text,
    });
  }
  return messages;
}

export async function buildTelegramReply(chatId: number, rawText: string): Promise<string> {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // Handle deep linking like /start ORDER_123
  if (lower.startsWith("/start")) {
    const parts = text.split(" ");
    if (parts.length > 1 && parts[1].startsWith("ST-")) {
      return orderStatusReply(parts[1]); // Look up specific order
    }
    return menuReply();
  }

  if (isMenuRequest(lower)) {
    return menuReply();
  }

  if (lower === "1") {
    return newOrderReply();
  }

  if (isOrderStatusRequest(lower) || extractOrderRef(text)) {
    // If they provided a ref, look it up. Otherwise ask for it.
    const ref = extractOrderRef(text);
    if (ref) return orderStatusReply(ref);
    return "Please send your order number (e.g. ST-20260518-1234) to check status.";
  }

  if (lower === "3") {
    return pricingReply();
  }

  if (lower === "4" || mentionsAny(lower, ["person", "human", "agent", "talk to someone"])) {
    return [
      "A Pwata team member will pick this up here on Telegram.",
      "",
      "Meanwhile, if you want to place a structured order, use:",
      ORDER_APP_URL,
    ].join("\n");
  }

  if (mentionsAny(lower, ["order", "design", "logo", "flyer", "poster", "social", "shirt", "t-shirt", "hoodie", "website", "bot"])) {
    return newOrderReply();
  }

  if (mentionsAny(lower, ["price", "pricing", "cost", "quote", "packages"])) {
    return pricingReply();
  }

  return aiAssistedReply(text);
}

export async function sendTelegramText(chatId: string | number, body: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.warn("Telegram send skipped: TELEGRAM_BOT_TOKEN is missing.");
    return { sent: false, skipped: true };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: body,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Telegram send failed: ${response.status} ${details}`);
  }

  return { sent: true };
}

function isMenuRequest(text: string) {
  return ["hi", "hello", "hey", "start", "menu", "help", "0", "/help", "/menu"].includes(text);
}

function isOrderStatusRequest(text: string) {
  return mentionsAny(text, ["status", "track", "tracking", "where is my order", "my order", "/status"]) || text === "2";
}

function mentionsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function menuReply() {
  return [
    "Welcome to Pwata Creatives.",
    "",
    "Choose an option:",
    "1 - Start a new order",
    "2 - Check order status",
    "3 - See price starting points",
    "4 - Talk to a person",
    "",
    `Order page: ${ORDER_APP_URL}`,
  ].join("\n");
}

function newOrderReply() {
  return [
    "To start a Pwata order, use this order page:",
    ORDER_APP_URL,
    "",
    "It guides you through the brief, captures your contacts, and sends the order into our accounting system for tracking.",
    "",
    "Reply STATUS if you already have an order number.",
  ].join("\n");
}

function pricingReply() {
  return [
    "Pwata quotes depend on the job type and brief.",
    "",
    "Starting points:",
    "- Logo: from UGX 80,000",
    "- Social media pack: from UGX 60,000",
    "- Print design: from UGX 25,000",
    "- Website: from UGX 350,000",
    "- WhatsApp/Telegram bot: from UGX 400,000",
    "",
    `Start here: ${ORDER_APP_URL}`,
  ].join("\n");
}

async function orderStatusReply(orderRef: string) {
  let order: OrderLookupResult | null = null;
  try {
    order = await findOrderByReference(orderRef);
  } catch (error) {
    console.error("Telegram order status lookup failed:", error);
    return [
      "I could not check your order status right now.",
      "",
      "Please send your order number here and a Pwata team member will follow up.",
    ].join("\n");
  }

  if (!order) {
    return [
      "I could not find an order yet.",
      "",
      "Make sure to send your exact order number (e.g. ST-20260518-1234)",
      `Or start a new order here: ${ORDER_APP_URL}`,
    ].join("\n");
  }

  const customerName = order.customer_name || order.guest_name || "there";
  return [
    `Hi ${firstName(customerName)}, here is your Pwata order status:`,
    "",
    `Order: *${order.order_number}*`,
    `Work status: *${statusLabel(order.status)}*`,
    `Payment: *${paymentLabel(order.payment_status)}*`,
    `Total: UGX ${order.total_amount?.toLocaleString()}`,
    `Deposit: UGX ${order.deposit_amount?.toLocaleString()}`,
    "",
    "A team member will follow up on Telegram if we need anything else.",
  ].join("\n");
}

function extractOrderRef(text: string) {
  const match = text.match(/\bST-\d{8}-\d{4}\b/i);
  return match?.[0] ?? null;
}

async function findOrderByReference(orderRef: string): Promise<OrderLookupResult | null> {
  const sql = await getSql();
  const rows = await sql`
    SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount,
           o.deposit_amount, o.guest_name, o.guest_phone, c.name AS customer_name,
           o.created_at
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE upper(o.order_number) = upper(${orderRef})
    ORDER BY o.created_at DESC
    LIMIT 1
  ` as OrderLookupResult[];

  return rows[0] ?? null;
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.sql;
}

async function aiAssistedReply(text: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return DEFAULT_REPLY;

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.TELEGRAM_AI_MODEL || "gemini-2.5-flash",
      contents: `Customer Telegram message: "${text}"`,
      config: {
        systemInstruction: [
          "You are the Telegram assistant for Pwata Creatives in Uganda.",
          "Pwata sells logo design, brand identity, social media graphics, print design, merchandise design, websites, and WhatsApp/Telegram bots.",
          "Reply as a helpful sales/support assistant in 1 to 5 short Telegram-friendly lines.",
          `For structured orders, send customers to this order page: ${ORDER_APP_URL}`,
          "Do not claim a payment was received, an order exists, or a job is complete unless the accounting system says so.",
          "Do not invent exact delivery dates, discounts, private business data, or payment confirmations.",
          "If the customer seems ready to order, guide them to the order page and offer human follow-up.",
          "If unsure, ask one concise clarifying question or suggest replying 4 to talk to a person.",
        ].join("\n"),
        temperature: 0.35,
      },
    });

    const reply = (response.text ?? "").trim();
    return reply || DEFAULT_REPLY;
  } catch (error) {
    console.error("Telegram AI reply failed:", error);
    return DEFAULT_REPLY;
  }
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    partial: "Deposit paid",
    paid: "Paid",
    failed: "Failed",
  };
  return labels[status] ?? status;
}
