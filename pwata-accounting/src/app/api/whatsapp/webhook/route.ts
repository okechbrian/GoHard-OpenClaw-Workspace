import { buildPwataReply, extractIncomingTexts, sendWhatsAppText } from "@/lib/whatsapp-bot";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({ error: "Webhook verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const messages = extractIncomingTexts(payload);

    for (const message of messages) {
      const reply = await buildPwataReply(message.from, message.text);
      await sendWhatsAppText(message.from, reply);
    }

    return NextResponse.json({ ok: true, processed: messages.length });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
