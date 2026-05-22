/**
 * Local Telegram Polling Script for Development
 * 
 * Run this script locally using:
 * npx tsx scripts/telegram-dev.ts
 * 
 * It uses long-polling to fetch updates from Telegram and forwards them to your local Next.js webhook.
 * Ensure your Next.js dev server is running on port 3000!
 */

import { config } from "dotenv";
import path from "path";

// Load .env.local
config({ path: path.resolve(process.cwd(), ".env.local") });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const LOCAL_WEBHOOK_URL = "http://localhost:3000/api/telegram/webhook";
const SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN || "";

if (!TOKEN) {
  console.error("❌ ERROR: TELEGRAM_BOT_TOKEN is missing in .env.local");
  console.error("Please create a bot via @BotFather on Telegram and add the token to .env.local.");
  process.exit(1);
}

let lastUpdateId = 0;

async function pollTelegram() {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    
    if (!response.ok) {
      console.error("Failed to fetch updates:", response.status, await response.text());
      setTimeout(pollTelegram, 5000); // Retry after 5s
      return;
    }

    const data = await response.json();

    if (data.ok && data.result && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;

        // Forward to local Next.js webhook
        const forwardRes = await fetch(LOCAL_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(SECRET_TOKEN ? { "X-Telegram-Bot-Api-Secret-Token": SECRET_TOKEN } : {})
          },
          body: JSON.stringify(update),
        });

        if (forwardRes.ok) {
          console.log(`✅ Forwarded update ${update.update_id} to local webhook`);
        } else {
          console.error(`❌ Local webhook failed for update ${update.update_id}:`, forwardRes.status);
        }
      }
    }
  } catch (error) {
    console.error("Polling error:", error);
  }

  // Loop immediately (long-polling prevents high CPU usage via the timeout param)
  setTimeout(pollTelegram, 500);
}

console.log("🚀 Starting local Telegram polling simulator...");
console.log(`Make sure your Next.js app is running at ${LOCAL_WEBHOOK_URL}`);
pollTelegram();
