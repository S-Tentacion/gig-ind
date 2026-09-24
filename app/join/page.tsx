import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, localizePath, localeFromPath, ROUTES } from "@/lib/routes";

export default async function JoinPage() {
  const publicPath = (await headers()).get("x-gigolo-public-path") || "";
  redirect(localizePath(ROUTES.register, localeFromPath(publicPath) ?? DEFAULT_LOCALE));
}
