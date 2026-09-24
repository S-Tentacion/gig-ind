import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, localizePath, localeFromPath, ROUTES } from "@/lib/routes";

export default async function LegacyBuyPage() {
  const publicPath = (await headers()).get("x-gigolo-public-path") || "";
  redirect(localizePath(ROUTES.membership, localeFromPath(publicPath) ?? DEFAULT_LOCALE));
}
