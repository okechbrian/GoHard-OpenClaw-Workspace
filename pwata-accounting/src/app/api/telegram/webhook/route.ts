import { buildTelegramReply, extractTelegramMessages, sendTelegramText } from "@/lib/telegram-bot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("[TELEGRAM] Webhook POST received");

  try {
    const payload = await request.json();
    console.log("[TELEGRAM] Payload:", JSON.stringify(payload).slice(0, 500));

    const messages = extractTelegramMessages(payload);
    console.log("[TELEGRAM] Extracted messages:", messages.length);

    for (const message of messages) {
      console.log(`[TELEGRAM] Processing chatId=${message.chatId} text="${message.text}"`);
      try {
        const reply = await buildTelegramReply(message.chatId, message.text);
        console.log(`[TELEGRAM] Reply built (${reply ? reply.length : 0} chars)`);
        if (reply) {
          const result = await sendTelegramText(message.chatId, reply);
          console.log("[TELEGRAM] Send result:", result);
        } else {
          console.log("[TELEGRAM] No reply generated (human mode or null)");
        }
      } catch (msgError) {
        console.error("[TELEGRAM] Error processing message:", msgError);
      }
    }

    return NextResponse.json({ ok: true, processed: messages.length });
  } catch (error) {
    console.error("[TELEGRAM] Webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
