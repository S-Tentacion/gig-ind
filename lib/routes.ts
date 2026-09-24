export const SUPPORTED_LOCALES = ["en", "hi"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LOCALE_COOKIE = "gigolo_locale";

export const ROUTES = {
  home: "/",
  authCallback: "/auth/callback",
  becomeCompanion: "/become-companion",
  boostCredits: "/boost-credits",
  browse: "/browse",
  buy: "/buy",
  communityGuidelines: "/community-guidelines",
  faq: "/faq",
  howItWorks: "/how-it-works",
  join: "/join",
  kitOrders: "/kit-orders",
  login: "/login",
  membership: "/membership",
  messages: "/messages",
  payments: "/payments",
  privacy: "/privacy",
  profile: "/profile",
  register: "/register",
  safety: "/safety",
  setPassword: "/set-password",
  terms: "/terms",
  browseCity: (city: string) => `/browse/${encodeURIComponent(city.toLowerCase())}`,
  browseQuery: (params: Record<string, string>) => `/browse?${new URLSearchParams(params).toString()}`,
  messagesQuery: (params: Record<string, string>) => `/messages?${new URLSearchParams(params).toString()}`,
} as const;

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function localeFromPath(pathname: string): AppLocale | null {
  const segment = pathname.split("/").filter(Boolean)[0];
  return isAppLocale(segment) ? segment : null;
}

export function stripLocale(pathname: string) {
  const [first, ...rest] = pathname.split("/").filter(Boolean);
  if (!isAppLocale(first)) return pathname || "/";
  return `/${rest.join("/")}` || "/";
}

export function localizePath(href: string, locale: AppLocale) {
  if (!href || href.startsWith("#") || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("/api/")) return href;
  const url = new URL(href, "https://local.gigolo.invalid");
  const path = stripLocale(url.pathname);
  return `/${locale}${path === "/" ? "" : path}${url.search}${url.hash}`;
}

export function switchPathLocale(href: string, locale: AppLocale) {
  return localizePath(href, locale);
}
