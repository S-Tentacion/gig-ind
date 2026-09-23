import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const siteUrl = (process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

if (!siteUrl.startsWith("https://")) throw new Error("Pass the public HTTPS site URL, for example: npm run telegram:webhook -- https://example.com");
if (!token || !secret) throw new Error("TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET are required.");

const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    url: `${siteUrl}/api/payments/webhook`,
    secret_token: secret,
    allowed_updates: ["message", "pre_checkout_query"],
    drop_pending_updates: false,
  }),
});
const result = await response.json();
if (!response.ok || !result.ok) throw new Error(result.description || "Telegram rejected the webhook.");
console.log(`Telegram webhook configured for ${siteUrl}/api/payments/webhook`);
