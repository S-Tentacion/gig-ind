"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { Languages } from "lucide-react";
import commonEn from "@/locales/en/common.json";
import homeEn from "@/locales/en/home.json";
import standardEn from "@/locales/en/standard.json";
import premiumEn from "@/locales/en/premium.json";
import commonHi from "@/locales/hi/common.json";
import homeHi from "@/locales/hi/home.json";
import standardHi from "@/locales/hi/standard.json";
import premiumHi from "@/locales/hi/premium.json";
import hindiUi from "@/locales/hi/ui.json";

type Locale = "en" | "hi";
type Dictionary = Record<string, string>;
type PageName = "common" | "home" | "standard" | "premium";
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (page: PageName, key: string, values?: Record<string, string | number>) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);
const dictionaries: Record<Locale, Record<PageName, Dictionary>> = { en: { common: commonEn, home: homeEn, standard: standardEn, premium: premiumEn }, hi: { common: commonHi, home: homeHi, standard: standardHi, premium: premiumHi } };
const hindiPhrases = hindiUi as Dictionary;
const hindiToEnglish: Dictionary = {
  ...Object.fromEntries(Object.entries(hindiPhrases).map(([english, hindi]) => [hindi, english])),
  ...Object.fromEntries((Object.keys(dictionaries.en) as PageName[]).flatMap((page) => Object.entries(dictionaries.hi[page]).map(([key, hindi]) => [hindi, dictionaries.en[page][key] ?? hindi]))),
};
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function translatePhrase(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const phrase = value.trim();
  const direct = hindiPhrases[phrase];
  if (direct) return `${leading}${direct}${trailing}`;

  const patterns: Array<[RegExp, (match: RegExpMatchArray) => string]> = [
    [/^Welcome back, (.+)\.$/, (match) => `वापसी पर स्वागत है, ${match[1]}।`],
    [/^Browse (.+)$/, (match) => `${match[1]} में देखें`],
    [/^Hi (.+), (.+)$/, (match) => `नमस्ते ${match[1]}, ${match[2]}`],
    [/^Available credits: (\d+)$/, (match) => `उपलब्ध क्रेडिट: ${match[1]}`],
    [/^Step (\d+)$/, (match) => `चरण ${match[1]}`],
  ];
  for (const [pattern, format] of patterns) {
    const match = phrase.match(pattern);
    if (match) return `${leading}${format(match)}${trailing}`;
  }
  return value;
}

function restoreEnglishPhrase(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  return `${leading}${hindiToEnglish[value.trim()] ?? value.trim()}${trailing}`;
}

function translateTree(root: ParentNode, locale: Locale) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const textNode = node as Text;
    const parent = textNode.parentElement;
    if (parent && !parent.closest("[data-no-translate]") && !["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "TEXTAREA"].includes(parent.tagName)) {
      const source = originalText.get(textNode) ?? (locale === "hi" ? restoreEnglishPhrase(textNode.nodeValue ?? "") : textNode.nodeValue ?? "");
      if (!originalText.has(textNode)) originalText.set(textNode, source);
      textNode.nodeValue = locale === "hi" ? translatePhrase(source) : source;
    }
    node = walker.nextNode();
  }

  root.querySelectorAll?.("[placeholder], [aria-label], [title]").forEach((element) => {
    if (element.closest("[data-no-translate]")) return;
    const saved = originalAttributes.get(element) ?? new Map<string, string>();
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const current = element.getAttribute(attribute);
      if (current === null) continue;
      const source = saved.get(attribute) ?? (locale === "hi" ? restoreEnglishPhrase(current) : current);
      if (!saved.has(attribute)) saved.set(attribute, source);
      element.setAttribute(attribute, locale === "hi" ? translatePhrase(source) : source);
    }
    originalAttributes.set(element, saved);
  });
}

function interpolate(value: string, values?: Record<string, string | number>) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(values?.[key] ?? `{${key}}`));
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const segment = pathname.split("/").filter(Boolean)[0];
  const locale: Locale = segment === "hi" ? "hi" : "en";
  const setLocale = (nextLocale: Locale) => {
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "en" || segments[0] === "hi") segments[0] = nextLocale;
    else segments.unshift(nextLocale);
    router.replace(`/${segments.join("/")}${window.location.search}`);
  };
  useEffect(() => { document.documentElement.lang = locale === "hi" ? "hi" : "en"; }, [locale]);
  useEffect(() => {
    const apply = () => translateTree(document.body, locale);
    apply();
    const timer = window.setTimeout(apply, 0);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) translateTree(node, locale);
          else if (node instanceof Text && node.parentElement) translateTree(node.parentElement, locale);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { window.clearTimeout(timer); observer.disconnect(); };
  }, [locale, pathname]);
  const value = useMemo(() => ({ locale, setLocale, t: (page: PageName, key: string, values?: Record<string, string | number>) => interpolate(dictionaries[locale][page][key] ?? dictionaries.en[page][key] ?? key, values) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const nextLocale = locale === "en" ? "hi" : "en";
  return <button type="button" onClick={() => setLocale(nextLocale)} aria-label={t("common", "languageLabel")} className={`inline-flex items-center gap-1.5 rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-2 text-xs font-bold text-cyan-100 transition hover:bg-cyan-200 hover:text-mauve-950 ${className}`}><Languages size={14} />{t("common", "language")}</button>;
}

export function LanguageToggle() {
  return <LanguageSwitcher className="fixed bottom-5 left-5 z-40 bg-[#151022]/95 shadow-xl backdrop-blur" />;
}
