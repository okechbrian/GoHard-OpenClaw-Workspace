import { buildTelegramReply, extractTelegramMessages, sendTelegramText } from "@/lib/telegram-bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Optional security: verify Telegram secret token
  const secretToken = process.env.TELEGRAM_SECRET_TOKEN;
  if (secretToken) {
    const providedToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (providedToken !== secretToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const payload = await request.json();
    const messages = extractTelegramMessages(payload);

    for (const message of messages) {
      const reply = await buildTelegramReply(message.chatId, message.text);
      await sendTelegramText(message.chatId, reply);
    }

    return NextResponse.json({ ok: true, processed: messages.length });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
