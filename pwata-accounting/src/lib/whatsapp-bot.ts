import { formatUGX } from "@/lib/utils";
import { getBotSession, updateBotSessionHistory, setHumanMode, getProductsForAI } from "./bot-memory";
import type { Content } from "@google/genai";

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          id?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

export type IncomingWhatsAppText = {
  from: string;
  messageId: string;
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
  "Thanks for messaging Pwata Creatives.",
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

export function extractIncomingTexts(payload: WhatsAppWebhookPayload): IncomingWhatsAppText[] {
  const messages: IncomingWhatsAppText[] = [];

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (message.type !== "text") continue;
        const text = message.text?.body?.trim();
        if (!message.from || !message.id || !text) continue;
        messages.push({ from: message.from, messageId: message.id, text });
      }
    }
  }

  return messages;
}

export async function buildPwataReply(from: string, rawText: string): Promise<string | null> {
  const text = rawText.trim();
  const lower = text.toLowerCase();
  
  const session = await getBotSession(from);

  // If in human mode, AI is paused. The admin handles it manually.
  if (session.is_human_mode) {
    return null; 
  }

  // If user explicitly asks for human
  if (lower === "4" || mentionsAny(lower, ["person", "human", "agent", "talk to someone"])) {
    await setHumanMode(from, true);
    return [
      "A Pwata team member will pick this up here on WhatsApp shortly.",
      "",
      "Meanwhile, if you want to place a structured order, use:",
      ORDER_APP_URL,
    ].join("\n");
  }

  // Route everything else directly to the new Smart AI
  return aiAssistedReply(from, text, session);
}

export async function sendWhatsAppText(to: string, body: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v25.0";

  if (!token || !phoneNumberId) {
    console.warn("WhatsApp send skipped: WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing.");
    return { sent: false, skipped: true };
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: false,
        body,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${details}`);
  }

  return { sent: true };
}

function isMenuRequest(text: string) {
  return ["hi", "hello", "hey", "start", "menu", "help", "0"].includes(text);
}

function isOrderStatusRequest(text: string) {
  return mentionsAny(text, ["status", "track", "tracking", "where is my order", "my order"]) || text === "2";
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

async function orderStatusReply(from: string, text: string) {
  let order: OrderLookupResult | null = null;
  try {
    const orderRef = extractOrderRef(text);
    order = orderRef
      ? await findOrderByReference(orderRef)
      : await findLatestOrderByPhone(from);
  } catch (error) {
    console.error("WhatsApp order status lookup failed:", error);
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
      "Send your order number, for example: STATUS ST-20260518-1234",
      `Or start a new order here: ${ORDER_APP_URL}`,
    ].join("\n");
  }

  const customerName = order.customer_name || order.guest_name || "there";
  return [
    `Hi ${firstName(customerName)}, here is your Pwata order status:`,
    "",
    `Order: ${order.order_number}`,
    `Work status: ${statusLabel(order.status)}`,
    `Payment: ${paymentLabel(order.payment_status)}`,
    `Total: ${formatUGX(Number(order.total_amount || 0))}`,
    `Deposit: ${formatUGX(Number(order.deposit_amount || 0))}`,
    "",
    "A team member will follow up on WhatsApp if we need anything else.",
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

async function findLatestOrderByPhone(phone: string): Promise<OrderLookupResult | null> {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return null;

  const sql = await getSql();
  const rows = await sql`
    SELECT o.id, o.order_number, o.status, o.payment_status, o.total_amount,
           o.deposit_amount, o.guest_name, o.guest_phone, c.name AS customer_name,
           o.created_at
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE regexp_replace(coalesce(o.guest_phone, ''), '[^0-9]', '', 'g') = ${digits}
       OR regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = ${digits}
    ORDER BY o.created_at DESC
    LIMIT 1
  ` as OrderLookupResult[];

  return rows[0] ?? null;
}

export function normalizePhoneDigits(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `256${digits.slice(1)}`;
  return digits;
}

async function getSql() {
  const db = await import("@/lib/db");
  return db.sql;
}

async function aiAssistedReply(from: string, text: string, session: any): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return DEFAULT_REPLY;

  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
    // Fetch live product data for RAG
    const products = await getProductsForAI();
    let productContext = "Live Pwata Services & Prices:\\n";
    products.forEach(p => {
      productContext += `- ${p.name} (${p.category}): UGX ${p.price.toLocaleString()}\\n`;
    });

    const systemInstruction = [
      "You are the friendly WhatsApp assistant for Pwata Creatives in Uganda.",
      "Pwata sells logo design, brand identity, social media graphics, print design, merchandise design, websites, and WhatsApp/Telegram bots.",
      "Reply concisely in 1 to 5 short WhatsApp-friendly lines. Use emojis.",
      `For structured orders, send customers to this order page: ${ORDER_APP_URL}`,
      "You have access to live pricing below. Do not invent prices.",
      productContext,
      "If the customer wants to check their order, ask for their order number (e.g. ST-20260518-1234) and use your 'checkOrderStatus' tool to find it.",
      "If the customer seems highly frustrated or explicitly wants a human, tell them to reply with the number 4."
    ].join("\n");

    const tools = [{
      functionDeclarations: [
        {
          name: "checkOrderStatus",
          description: "Look up a customer's live order status by their order number.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              orderNumber: { type: Type.STRING, description: "The order number, like ST-20260518-1234" }
            },
            required: ["orderNumber"]
          }
        }
      ]
    }];

    // Build conversation history
    const history = session.history as Content[];
    const userMessage: Content = { role: "user", parts: [{ text }] };
    const conversation = [...history, userMessage];

    const model = process.env.WHATSAPP_AI_MODEL || "gemini-2.5-flash";
    let response = await ai.models.generateContent({
      model,
      contents: conversation,
      config: { systemInstruction, tools, temperature: 0.35 },
    });

    // Check if the AI decided to call the checkOrderStatus tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "checkOrderStatus") {
        const orderNumber = (call.args as any)?.orderNumber;
        const order = await findOrderByReference(orderNumber || "");
        
        // Execute tool and generate final response
        const toolResult = order ? {
          status: statusLabel(order.status),
          payment: paymentLabel(order.payment_status),
          total: order.total_amount,
          deposit: order.deposit_amount,
          customer: order.customer_name || order.guest_name
        } : { error: "Order not found. Please double check the number." };

        const toolMessage: Content = {
          role: "user",
          parts: [{
            functionResponse: {
              name: call.name,
              response: toolResult
            }
          }]
        };
        
        conversation.push({ role: "model", parts: [{ functionCall: call }] });
        conversation.push(toolMessage);
        
        response = await ai.models.generateContent({
          model,
          contents: conversation,
          config: { systemInstruction, tools, temperature: 0.35 },
        });
      }
    }

    const reply = (response.text ?? "").trim();
    if (reply) {
      // Save history
      conversation.push({ role: "model", parts: [{ text: reply }] });
      await updateBotSessionHistory(from, conversation);
      return reply;
    }
    
    return DEFAULT_REPLY;
  } catch (error) {
    console.error("WhatsApp Agentic AI reply failed:", error);
    return DEFAULT_REPLY;
  }
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending confirmation",
    in_design: "In design",
    printing: "Printing",
    ready_for_delivery: "Ready for delivery",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] ?? status;
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
