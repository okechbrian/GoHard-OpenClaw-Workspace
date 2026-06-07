import { neon } from "@neondatabase/serverless";
import type { Content } from "@google/genai";

// Use Neon directly — avoids importing db.ts which loads better-sqlite3 and crashes on Vercel
const sql = neon(process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "postgres://placeholder");

function generateId() {
  return crypto.randomUUID();
}

export type BotSession = {
  id: string;
  chat_id: string;
  history: Content[];
  is_human_mode: boolean;
};

/**
 * Fetches the session for a chat. Creates one if it doesn't exist.
 */
export async function getBotSession(chatId: string | number): Promise<BotSession> {
  const cid = String(chatId);
  const rows = await sql`
    SELECT id, chat_id, history, is_human_mode
    FROM bot_sessions
    WHERE chat_id = ${cid}
  `;

  if (rows.length > 0) {
    const rawHistory = rows[0].history;
    const history = typeof rawHistory === "string" ? JSON.parse(rawHistory) : (rawHistory || []);
    return {
      id: rows[0].id,
      chat_id: rows[0].chat_id,
      history: history as Content[],
      is_human_mode: Boolean(rows[0].is_human_mode),
    };
  }

  // Create new session
  const newSession: BotSession = {
    id: generateId(),
    chat_id: cid,
    history: [],
    is_human_mode: false,
  };

  await sql`
    INSERT INTO bot_sessions (id, chat_id, history, is_human_mode)
    VALUES (${newSession.id}, ${cid}, ${JSON.stringify(newSession.history)}::jsonb, ${newSession.is_human_mode})
  `;

  return newSession;
}

/**
 * Appends new messages to the chat history, keeping only the last 20 turns to save tokens.
 */
export async function updateBotSessionHistory(chatId: string | number, newMessages: Content[]) {
  const cid = String(chatId);
  const session = await getBotSession(cid);
  
  const updatedHistory = [...session.history, ...newMessages].slice(-20); // Keep last 20

  await sql`
    UPDATE bot_sessions
    SET history = ${JSON.stringify(updatedHistory)}::jsonb, updated_at = NOW()
    WHERE chat_id = ${cid}
  `;
}

/**
 * Toggles human mode. When true, the AI is disabled and messages are just forwarded to the Admin.
 */
export async function setHumanMode(chatId: string | number, enabled: boolean) {
  const cid = String(chatId);
  await sql`
    UPDATE bot_sessions
    SET is_human_mode = ${enabled}, updated_at = NOW()
    WHERE chat_id = ${cid}
  `;
}

/**
 * Fetches all products to provide context to the AI (RAG).
 */
export async function getProductsForAI() {
  const rows = await sql`
    SELECT name, category, base_price, print_fee, customizable
    FROM products
    ORDER BY category, name
  `;
  return rows.map(r => ({
    name: r.name,
    category: r.category,
    price: Number(r.base_price),
    print_fee: Number(r.print_fee),
    customizable: r.customizable
  }));
}
