import { neon } from "@neondatabase/serverless";
import { formatUGX } from "@/lib/utils";
import { statusLabel } from "@/lib/whatsapp-bot";
import { getBotSession, updateBotSessionHistory, setHumanMode, getProductsForAI } from "./bot-memory";
import type { Content } from "@google/genai";

// Use Neon directly — avoids importing db.ts which loads better-sqlite3 and crashes on Vercel
const sqlDirect = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://placeholder");

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

export async function buildTelegramReply(chatId: number, rawText: string): Promise<string | null> {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  const session = await getBotSession(chatId);

  // If in human mode, AI is paused. The admin handles it manually.
  if (session.is_human_mode) {
    // If the user wants to resume bot, they could type /reset but for now we ignore.
    return null; 
  }

  // Handle deep linking like /start ORDER_123
  if (lower.startsWith("/start")) {
    const parts = text.split(" ");
    if (parts.length > 1 && parts[1].startsWith("ST-")) {
      return orderStatusReply(parts[1]); // Look up specific order
    }
    // Return menu but also initialize AI history
  }

  // If user explicitly asks for human
  if (lower === "4" || mentionsAny(lower, ["person", "human", "agent", "talk to someone"])) {
    await setHumanMode(chatId, true);
    return [
      "A Pwata team member will pick this up here on Telegram shortly.",
      "",
      "Meanwhile, if you want to place a structured order, use:",
      ORDER_APP_URL,
    ].join("\n");
  }

  // We route everything else directly to the new Smart AI!
  return aiAssistedReply(chatId, text, session);
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
  const rows = await sqlDirect`
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

async function aiAssistedReply(chatId: number, text: string, session: any): Promise<string> {
  console.log(`[AI] Starting aiAssistedReply for chatId=${chatId}`);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[AI] No GEMINI_API_KEY, returning DEFAULT_REPLY");
    return DEFAULT_REPLY;
  }
  console.log(`[AI] API key found (${apiKey.length} chars)`);

  try {
    const { GoogleGenAI, Type } = await import("@google/genai");
    console.log("[AI] GoogleGenAI imported OK");
    const ai = new GoogleGenAI({ apiKey });
    
    // Fetch live product data for RAG
    const products = await getProductsForAI();
    let productContext = "Live Pwata Services & Prices:\\n";
    products.forEach(p => {
      productContext += `- ${p.name} (${p.category}): UGX ${p.price.toLocaleString()}\\n`;
    });

    const systemInstruction = [
      "You are the friendly Telegram assistant for Pwata Creatives in Uganda.",
      "Pwata sells logo design, brand identity, social media graphics, print design, merchandise design, websites, and WhatsApp/Telegram bots.",
      "Reply concisely in 1 to 5 short Telegram-friendly lines. Use emojis.",
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

    const model = process.env.TELEGRAM_AI_MODEL || "gemini-2.5-flash";
    console.log(`[AI] Calling Gemini model=${model} history_len=${conversation.length}`);
    let response = await ai.models.generateContent({
      model,
      contents: conversation,
      config: { systemInstruction, tools, temperature: 0.35 },
    });
    console.log(`[AI] Gemini responded, text length=${(response.text ?? "").length}, functionCalls=${response.functionCalls?.length ?? 0}`);

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
      await updateBotSessionHistory(chatId, conversation);
      return reply;
    }
    
    return DEFAULT_REPLY;
  } catch (error: any) {
    console.error("[AI] Telegram Agentic AI reply failed:", error?.message || error);
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
