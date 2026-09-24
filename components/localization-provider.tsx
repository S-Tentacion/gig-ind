"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useLayoutEffect, useMemo, type ComponentProps, type ReactNode } from "react";
import { Languages } from "lucide-react";
import commonEn from "@/locales/en/common.json";
import homeEn from "@/locales/en/home.json";
import standardEn from "@/locales/en/standard.json";
import premiumEn from "@/locales/en/premium.json";
import membershipEn from "@/locales/en/membership.json";
import commonHi from "@/locales/hi/common.json";
import homeHi from "@/locales/hi/home.json";
import standardHi from "@/locales/hi/standard.json";
import premiumHi from "@/locales/hi/premium.json";
import membershipHi from "@/locales/hi/membership.json";
import hindiUi from "@/locales/hi/ui.json";
import { DEFAULT_LOCALE, localizePath, localeFromPath, switchPathLocale, type AppLocale } from "@/lib/routes";

type Dictionary = Record<string, string>;
type PageName = "common" | "home" | "standard" | "premium" | "membership";
type TranslationContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  localizedPath: (href: string) => string;
  t: (page: PageName, key: string, values?: Record<string, string | number>) => string;
  tr: (text: string, values?: Record<string, string | number>) => string;
};

const TranslationContext = createContext<TranslationContextValue | null>(null);
const dictionaries: Record<AppLocale, Record<PageName, Dictionary>> = { en: { common: commonEn, home: homeEn, standard: standardEn, premium: premiumEn, membership: membershipEn }, hi: { common: commonHi, home: homeHi, standard: standardHi, premium: premiumHi, membership: membershipHi } };
const hindiPhrases = hindiUi as Dictionary;
const hindiToEnglish: Dictionary = {
  ...Object.fromEntries(Object.entries(hindiPhrases).map(([english, hindi]) => [hindi, english])),
  ...Object.fromEntries((Object.keys(dictionaries.en) as PageName[]).flatMap((page) => Object.entries(dictionaries.hi[page]).map(([key, hindi]) => [hindi, dictionaries.en[page][key] ?? hindi]))),
};
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function interpolate(value: string, values?: Record<string, string | number>) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(values?.[key] ?? `{${key}}`));
}

function translatePhrase(value: string, locale: AppLocale) {
  if (locale === "en") return hindiToEnglish[value] ?? value;
  const direct = hindiPhrases[value];
  if (direct) return direct;
  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Welcome back, (.+)\.$/, (match) => `वापसी पर स्वागत है, ${match[1]}।`],
    [/^Browse (.+)$/, (match) => `${match[1]} में देखें`],
    [/^Hi (.+), (.+)$/, (match) => `नमस्ते ${match[1]}, ${match[2]}`],
    [/^Available credits: (\d+)$/, (match) => `उपलब्ध क्रेडिट: ${match[1]}`],
    [/^Step (\d+)$/, (match) => `चरण ${match[1]}`],
  ];
  for (const [pattern, format] of patterns) {
    const match = value.match(pattern);
    if (match) return format(match);
  }
  return value;
}

function translateTree(root: ParentNode, locale: AppLocale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent && !parent.closest("[data-no-translate]") && !["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "TEXTAREA"].includes(parent.tagName)) {
      const current = textNode.nodeValue ?? "";
      const leading = current.match(/^\s*/)?.[0] ?? "";
      const trailing = current.match(/\s*$/)?.[0] ?? "";
      const source = originalText.get(textNode) ?? (locale === "hi" ? (hindiToEnglish[current.trim()] ?? current.trim()) : current.trim());
      if (!originalText.has(textNode)) originalText.set(textNode, source);
      textNode.nodeValue = `${leading}${translatePhrase(source, locale)}${trailing}`;
    }
    node = walker.nextNode();
  }

  root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach((element) => {
    if (element.closest("[data-no-translate]")) return;
    const saved = originalAttributes.get(element) ?? new Map<string, string>();
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      const source = saved.get(attribute) ?? (locale === "hi" ? (hindiToEnglish[current] ?? current) : current);
      if (!saved.has(attribute)) saved.set(attribute, source);
      element.setAttribute(attribute, translatePhrase(source, locale));
    }
    originalAttributes.set(element, saved);
  });
}

export function LocalizationProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: ReactNode; initialLocale?: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = localeFromPath(pathname) ?? initialLocale;
  const setLocale = (nextLocale: AppLocale) => router.replace(switchPathLocale(`${pathname}${window.location.search}${window.location.hash}`, nextLocale));

  useLayoutEffect(() => {
    document.documentElement.lang = locale === "hi" ? "hi" : "en";
    const apply = () => translateTree(document.body, locale);
    apply();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) translateTree(node, locale);
        else if (node instanceof Text && node.parentElement) translateTree(node.parentElement, locale);
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  const value = useMemo<TranslationContextValue>(() => ({
    locale,
    setLocale,
    localizedPath: (href) => localizePath(href, locale),
    t: (page, key, values) => interpolate(dictionaries[locale][page][key] ?? dictionaries.en[page][key] ?? key, values),
    tr: (text, values) => interpolate(translatePhrase(text, locale), values),
  }), [locale]);

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) throw new Error("useTranslation must be used inside LocalizationProvider");
  return context;
}

export const useLocale = useTranslation;

export function LocalizedLink({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { localizedPath } = useTranslation();
  return <NextLink href={typeof href === "string" ? localizedPath(href) : href} {...props} />;
}

export function useLocalizedRouter() {
  const router = useRouter();
  const { localizedPath } = useTranslation();
  return useMemo(() => ({
    back: router.back,
    forward: router.forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(localizedPath(href), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localizedPath(href), options),
  }), [localizedPath, router]);
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();
  const nextLocale: AppLocale = locale === "en" ? "hi" : "en";
  return <button type="button" data-no-translate onClick={() => setLocale(nextLocale)} aria-label={t("common", "languageLabel")} className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950 ${className}`}><Languages size={14} />{t("common", "language")}</button>;
}

export function LanguageToggle() {
  return <LanguageSwitcher className="fixed bottom-5 left-5 z-40 bg-[#151022]/95 shadow-xl backdrop-blur" />;
}
