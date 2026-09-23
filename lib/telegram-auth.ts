import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type TelegramLoginData = {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
};

export function verifyTelegramLogin(searchParams: URLSearchParams): TelegramLoginData | null {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const hash = searchParams.get("hash") || "";
  const id = searchParams.get("id") || "";
  const authDate = searchParams.get("auth_date") || "";
  if (!token || !hash || !/^\d+$/.test(id) || !/^\d+$/.test(authDate)) return null;

  const ageSeconds = Math.floor(Date.now() / 1000) - Number(authDate);
  if (ageSeconds < -30 || ageSeconds > 300) return null;
  const dataCheckString = [...searchParams.entries()]
    .filter(([key]) => key !== "hash" && key !== "next" && key !== "state")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHash("sha256").update(token).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (expected.length !== hash.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(hash))) return null;

  return {
    id,
    auth_date: authDate,
    hash,
    first_name: searchParams.get("first_name") || undefined,
    last_name: searchParams.get("last_name") || undefined,
    username: searchParams.get("username") || undefined,
    photo_url: searchParams.get("photo_url") || undefined,
  };
}
