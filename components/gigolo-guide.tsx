"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, List, MessageCircle, RotateCcw, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/localization-provider";

type ChatQuestion = { q: string; a: string };
type ChatCategory = { id: string; icon: string; label: string; intro: string; questions: ChatQuestion[] };
type Message = { id: string; role: "guide" | "user"; text: string };
type NavigationState =
  | { level: 1 }
  | { level: 2; categoryId: string }
  | { level: 3; categoryId: string; questionIndex: number };

export const chatCategories: ChatCategory[] = [
  {
    id: "membership",
    icon: "💎",
    label: "Membership & PRISM",
    intro: "Here's what members usually ask about membership and PRISM:",
    questions: [
      { q: "How do I join?", a: "Create your account, confirm you're 18 or older, and complete the Standard membership payment. Your account activates after CoinGate confirms the payment." },
      { q: "What is PRISM?", a: "PRISM is our premium membership experience. It unlocks the full PRISM interface, premium browsing features, Kit tracking, Boost credits, and priority support." },
      { q: "How much is PRISM?", a: "PRISM costs ₹10,000 as a one-time upgrade. You can upgrade later from your member homepage or membership page." },
      { q: "Can I cancel PRISM?", a: "PRISM is a one-time upgrade rather than a recurring subscription, so there is no automatic renewal to cancel. Contact support if you have a payment concern." },
    ],
  },
  {
    id: "kit",
    icon: "📦",
    label: "Kit & Orders",
    intro: "Questions about your Kit and orders:",
    questions: [
      { q: "Where is my Kit?", a: "You can track your Kit's status — Order Placed, Packed, Shipped, and Delivered — from your member homepage under Order Tracking." },
      { q: "How long does the Kit take to arrive?", a: "Delivery timelines vary by city. Once shipped, you'll see the latest available status on your homepage." },
      { q: "What's inside the Kit?", a: "Your welcome Kit contains the materials prepared for your verified PRISM membership experience. The order page shows the current Kit description." },
      { q: "My Kit hasn't moved in days. What do I do?", a: "Courier delays can happen. Open Order Tracking, keep your order reference ready, and contact support so the team can follow up." },
    ],
  },
  {
    id: "boost",
    icon: "⚡",
    label: "Boost Credits",
    intro: "Everything about Boost credits:",
    questions: [
      { q: "How does Boost work?", a: "One Boost credit activates the PRISM Boost visual state for one hour. It does not promise placement, visibility, bookings, income, or any other outcome." },
      { q: "How do I buy a Boost credit?", a: "Open Boost Credits from your member area, choose a quantity, and complete the secure CoinGate checkout. Verified credits appear in your saved balance." },
      { q: "Do Boost credits expire?", a: "Unused Boost credits stay in your saved balance. Once you activate one, that Boost remains active for exactly one hour." },
      { q: "Where can I see my credits?", a: "Your available balance and active Boost timer appear in the PRISM Boost panel on your member homepage." },
    ],
  },
  {
    id: "privacy",
    icon: "🔒",
    label: "Privacy & Safety",
    intro: "Privacy and safety, answered:",
    questions: [
      { q: "Is my data private?", a: "Your account information supports private member access and safety. Profiles are not made public simply because an account is created, and the platform does not sell personal data." },
      { q: "How is verification done?", a: "Registration checks the required account details, age confirmation, and profile photos before paid access is completed. Additional reviews may be requested for safety." },
      { q: "What if I feel unsafe?", a: "Stop the conversation or meeting, move to a safe place, and report the concern through the platform. If anyone is in immediate danger, contact local emergency services." },
      { q: "Safety tips", a: "Meet in a public or trusted place first, tell someone you trust about your plans, keep consent clear and ongoing, and never share financial credentials." },
    ],
  },
  {
    id: "bookings",
    icon: "💬",
    label: "Bookings & Messaging",
    intro: "How bookings and messaging work:",
    questions: [
      { q: "How do I book someone?", a: "Message a companion, agree on availability, the plan, and boundaries, then confirm the details through the platform." },
      { q: "Can I change a plan?", a: "Discuss changes in the conversation before anything is confirmed. Everyone involved must agree to the updated plan and boundaries." },
      { q: "Why can't I message someone?", a: "Messaging may depend on your membership access, whether you are signed in, and the companion's current availability settings." },
      { q: "Someone stopped replying", a: "Give them space and do not pressure them for a response. Every member may choose whether to continue a conversation." },
    ],
  },
  {
    id: "account",
    icon: "💳",
    label: "Account & Billing",
    intro: "Account and billing help:",
    questions: [
      { q: "How do payments work?", a: "Membership purchases use CoinGate's hosted cryptocurrency checkout. The website activates the purchase only after CoinGate confirms the payment." },
      { q: "Where is my payment history?", a: "Open Payment History from your member menu to review your verified membership, PRISM, Kit, and Boost transactions." },
      { q: "How do I update my profile?", a: "Open Profile from your member menu to update your display name, city, introduction, privacy preference, and profile photos." },
      { q: "How do I delete my account?", a: "Use the privacy and support options to request deletion. Your request will be handled according to the Privacy Policy." },
    ],
  },
  {
    id: "payments",
    icon: "💳",
    label: "Payments & Checkout",
    intro: "Help with CoinGate payments and checkout:",
    questions: [
      { q: "How do I complete payment?", a: "Choose your purchase and continue to CoinGate's secure checkout. Select an available cryptocurrency and follow the payment instructions shown there." },
      { q: "Why is my payment pending?", a: "Cryptocurrency payments can require network confirmations. Keep your CoinGate order page open and check your Payment History for the latest verified status." },
      { q: "Where can I find my payment record?", a: "Open Payment History from your member menu to view verified membership, PRISM, and Boost purchases." },
      { q: "Is checkout secure?", a: "Payment is completed on CoinGate's hosted checkout. Gigolo India verifies the order directly with CoinGate before granting access or credits." },
    ],
  },
];

export const chatCategoriesHi: ChatCategory[] = [
  {
    id: "membership",
    icon: "💎",
    label: "सदस्यता और PRISM",
    intro: "सदस्य आम तौर पर सदस्यता और PRISM के बारे में ये सवाल पूछते हैं:",
    questions: [
      { q: "मैं कैसे जुड़ूँ?", a: "अपना अकाउंट बनाएँ, पुष्टि करें कि आपकी उम्र 18 वर्ष या उससे अधिक है और Standard सदस्यता का भुगतान पूरा करें। CoinGate से भुगतान की पुष्टि मिलते ही आपका अकाउंट सक्रिय हो जाएगा।" },
      { q: "PRISM क्या है?", a: "PRISM हमारा प्रीमियम सदस्यता अनुभव है। इसमें पूरा PRISM इंटरफ़ेस, प्रीमियम ब्राउज़िंग सुविधाएँ, Kit ट्रैकिंग, Boost क्रेडिट और प्राथमिक सहायता मिलती है।" },
      { q: "PRISM की कीमत कितनी है?", a: "PRISM का एकमुश्त अपग्रेड ₹10,000 का है। आप बाद में अपने सदस्य होमपेज या सदस्यता पेज से अपग्रेड कर सकते हैं।" },
      { q: "क्या मैं PRISM रद्द कर सकता हूँ?", a: "PRISM एक बार किया जाने वाला अपग्रेड है, आवर्ती सदस्यता नहीं, इसलिए इसे अपने आप नवीनीकृत या रद्द करने की जरूरत नहीं होती। भुगतान से जुड़ी समस्या के लिए सहायता से संपर्क करें।" },
    ],
  },
  {
    id: "kit",
    icon: "📦",
    label: "Kit और ऑर्डर",
    intro: "आपके Kit और ऑर्डर से जुड़े सवाल:",
    questions: [
      { q: "मेरा Kit कहाँ है?", a: "आप सदस्य होमपेज के Order Tracking भाग में अपने Kit की स्थिति — Order Placed, Packed, Shipped और Delivered — देख सकते हैं।" },
      { q: "Kit पहुँचने में कितना समय लगता है?", a: "डिलीवरी का समय शहर के अनुसार बदलता है। भेजे जाने के बाद आपको होमपेज पर नवीनतम उपलब्ध स्थिति दिखाई देगी।" },
      { q: "Kit में क्या मिलता है?", a: "आपके स्वागत Kit में सत्यापित PRISM सदस्यता अनुभव के लिए तैयार सामग्री होती है। ऑर्डर पेज पर Kit का वर्तमान विवरण देखें।" },
      { q: "मेरे Kit की स्थिति कई दिनों से नहीं बदली", a: "कूरियर में कभी-कभी देरी हो सकती है। Order Tracking खोलें, अपना ऑर्डर संदर्भ तैयार रखें और सहायता टीम से संपर्क करें।" },
    ],
  },
  {
    id: "boost",
    icon: "⚡",
    label: "Boost क्रेडिट",
    intro: "Boost क्रेडिट के बारे में जरूरी जानकारी:",
    questions: [
      { q: "Boost कैसे काम करता है?", a: "एक Boost क्रेडिट PRISM Boost की दृश्य स्थिति को एक घंटे के लिए सक्रिय करता है। इससे प्लेसमेंट, दृश्यता, बुकिंग, आय या किसी अन्य परिणाम की गारंटी नहीं मिलती।" },
      { q: "Boost क्रेडिट कैसे खरीदूँ?", a: "अपने सदस्य क्षेत्र में Boost Credits खोलें, मात्रा चुनें और सुरक्षित CoinGate चेकआउट पूरा करें। सत्यापित क्रेडिट आपके बैलेंस में दिखाई देंगे।" },
      { q: "क्या Boost क्रेडिट की समय-सीमा होती है?", a: "इस्तेमाल न किए गए Boost क्रेडिट आपके बैलेंस में बने रहते हैं। एक क्रेडिट सक्रिय करने के बाद Boost ठीक एक घंटे तक चलता है।" },
      { q: "मैं अपने क्रेडिट कहाँ देख सकता हूँ?", a: "आपका उपलब्ध बैलेंस और सक्रिय Boost टाइमर सदस्य होमपेज के PRISM Boost पैनल में दिखाई देता है।" },
    ],
  },
  {
    id: "privacy",
    icon: "🔒",
    label: "गोपनीयता और सुरक्षा",
    intro: "गोपनीयता और सुरक्षा से जुड़े जवाब:",
    questions: [
      { q: "क्या मेरा डेटा निजी है?", a: "आपकी अकाउंट जानकारी का उपयोग निजी सदस्य पहुँच और सुरक्षा के लिए किया जाता है। केवल अकाउंट बनाने से प्रोफ़ाइल सार्वजनिक नहीं होती और प्लेटफ़ॉर्म व्यक्तिगत डेटा नहीं बेचता।" },
      { q: "सत्यापन कैसे होता है?", a: "भुगतान वाला एक्सेस पूरा होने से पहले पंजीकरण विवरण, उम्र की पुष्टि और प्रोफ़ाइल फ़ोटो जाँची जाती हैं। सुरक्षा के लिए अतिरिक्त समीक्षा भी माँगी जा सकती है।" },
      { q: "अगर मैं असुरक्षित महसूस करूँ तो क्या करूँ?", a: "बातचीत या मुलाकात रोकें, सुरक्षित जगह पर जाएँ और प्लेटफ़ॉर्म पर चिंता की रिपोर्ट करें। अगर कोई तुरंत खतरे में है तो स्थानीय आपातकालीन सेवाओं से संपर्क करें।" },
      { q: "सुरक्षा सुझाव", a: "पहली बार सार्वजनिक या भरोसेमंद जगह पर मिलें, अपनी योजना किसी विश्वसनीय व्यक्ति को बताएँ, सहमति स्पष्ट रखें और वित्तीय जानकारी साझा न करें।" },
    ],
  },
  {
    id: "bookings",
    icon: "💬",
    label: "बुकिंग और मैसेजिंग",
    intro: "बुकिंग और मैसेजिंग कैसे काम करते हैं:",
    questions: [
      { q: "मैं किसी को कैसे बुक करूँ?", a: "किसी साथी को संदेश भेजें, उपलब्धता, योजना और सीमाओं पर सहमति बनाएँ, फिर प्लेटफ़ॉर्म पर विवरण की पुष्टि करें।" },
      { q: "क्या मैं योजना बदल सकता हूँ?", a: "पुष्टि से पहले बातचीत में बदलावों पर चर्चा करें। अपडेट की गई योजना और सीमाओं पर शामिल सभी लोगों की सहमति जरूरी है।" },
      { q: "मैं किसी को संदेश क्यों नहीं भेज पा रहा हूँ?", a: "मैसेजिंग आपकी सदस्यता पहुँच, साइन-इन स्थिति और साथी की मौजूदा उपलब्धता सेटिंग पर निर्भर हो सकती है।" },
      { q: "किसी ने जवाब देना बंद कर दिया", a: "उन्हें समय दें और जवाब के लिए दबाव न डालें। हर सदस्य यह चुन सकता है कि वह बातचीत जारी रखना चाहता है या नहीं।" },
    ],
  },
  {
    id: "account",
    icon: "💳",
    label: "अकाउंट और बिलिंग",
    intro: "अकाउंट और बिलिंग में सहायता:",
    questions: [
      { q: "भुगतान कैसे काम करता है?", a: "सदस्यता की खरीद CoinGate के सुरक्षित क्रिप्टो चेकआउट से होती है। CoinGate की सत्यापित पुष्टि के बाद ही वेबसाइट खरीद सक्रिय करती है।" },
      { q: "मेरा भुगतान इतिहास कहाँ है?", a: "अपनी सत्यापित सदस्यता, PRISM, Kit और Boost लेनदेन देखने के लिए सदस्य मेनू से Payment History खोलें।" },
      { q: "मैं अपनी प्रोफ़ाइल कैसे अपडेट करूँ?", a: "डिस्प्ले नाम, शहर, परिचय, गोपनीयता पसंद और प्रोफ़ाइल फ़ोटो बदलने के लिए सदस्य मेनू से Profile खोलें।" },
      { q: "मैं अपना अकाउंट कैसे हटाऊँ?", a: "अकाउंट हटाने का अनुरोध करने के लिए गोपनीयता और सहायता विकल्पों का उपयोग करें। आपका अनुरोध Privacy Policy के अनुसार संभाला जाएगा।" },
    ],
  },
  {
    id: "payments",
    icon: "💳",
    label: "भुगतान और चेकआउट",
    intro: "CoinGate भुगतान और चेकआउट में सहायता:",
    questions: [
      { q: "मैं भुगतान कैसे पूरा करूँ?", a: "अपनी खरीद चुनें और CoinGate के सुरक्षित चेकआउट पर जाएँ। उपलब्ध क्रिप्टोकरेंसी चुनकर वहाँ दिए गए निर्देशों का पालन करें।" },
      { q: "मेरा भुगतान लंबित क्यों है?", a: "क्रिप्टो भुगतान में नेटवर्क पुष्टि का समय लग सकता है। CoinGate ऑर्डर पेज खुला रखें और नवीनतम सत्यापित स्थिति के लिए Payment History देखें।" },
      { q: "भुगतान रिकॉर्ड कहाँ मिलेगा?", a: "सत्यापित सदस्यता, PRISM और Boost खरीद देखने के लिए सदस्य मेनू से Payment History खोलें।" },
      { q: "क्या चेकआउट सुरक्षित है?", a: "भुगतान CoinGate के होस्टेड चेकआउट पर पूरा होता है। एक्सेस या क्रेडिट देने से पहले Gigolo India सीधे CoinGate से ऑर्डर सत्यापित करता है।" },
    ],
  },
];

const guideCopy = {
  en: {
    title: "Ask Gigolo Guide", subtitle: "PRISM member support", greeting: "Hi, I'm your PRISM guide. Choose a topic below or type a question and I'll help you find the right answer.", fallback: "Thanks for reaching out. We'll get back to you on the email or phone number linked to your registration within a short while.", chooseTopic: "Choose a topic", questions: "questions", backCategories: "Back to categories", moreQuestions: "More questions in this category", seeAll: "See all categories", placeholder: "Type your question…", cooldownPlaceholder: (seconds: number) => `You can send another message in ${seconds}s`, cooldown: (seconds: number) => `Please wait ${seconds} seconds before sending another message.`, footer: "Guidance for private, consent-first connections.", typing: "Gigolo Guide is typing", clear: "Clear conversation", close: "Close Gigolo Guide", open: "Open Gigolo Guide", send: "Send message", categoryList: "Support categories", answerNavigation: "Answer follow-up navigation",
  },
  hi: {
    title: "गिगोलो गाइड से पूछें", subtitle: "PRISM सदस्य सहायता", greeting: "नमस्ते, मैं आपका PRISM गाइड हूँ। नीचे कोई विषय चुनें या अपना सवाल लिखें और मैं सही जवाब खोजने में आपकी मदद करूँगा।", fallback: "संपर्क करने के लिए धन्यवाद। हम आपके पंजीकरण से जुड़े ईमेल या फ़ोन नंबर पर थोड़ी देर में जवाब देंगे।", chooseTopic: "कोई विषय चुनें", questions: "सवाल", backCategories: "सभी श्रेणियों पर वापस जाएँ", moreQuestions: "इस श्रेणी के और सवाल", seeAll: "सभी श्रेणियाँ देखें", placeholder: "अपना सवाल लिखें…", cooldownPlaceholder: (seconds: number) => `आप ${seconds} सेकंड बाद दूसरा संदेश भेज सकते हैं`, cooldown: (seconds: number) => `दूसरा संदेश भेजने से पहले ${seconds} सेकंड प्रतीक्षा करें।`, footer: "निजी और सहमति-प्रथम संबंधों के लिए मार्गदर्शन।", typing: "गिगोलो गाइड जवाब लिख रहा है", clear: "बातचीत साफ़ करें", close: "गिगोलो गाइड बंद करें", open: "गिगोलो गाइड खोलें", send: "संदेश भेजें", categoryList: "सहायता श्रेणियाँ", answerNavigation: "जवाब के बाद के विकल्प",
  },
};

const STORAGE = {
  messages: "gigolo-guide-messages-v3",
  navigation: "gigolo-guide-navigation-v3",
  cooldown: "gigolo-guide-cooldown-v1",
  scroll: "gigolo-guide-scroll-v3",
};

function messageId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function isStoredMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Message>;
  return typeof item.id === "string" && (item.role === "guide" || item.role === "user") && typeof item.text === "string";
}

function parseNavigation(value: string | null): NavigationState {
  try {
    const parsed = JSON.parse(value || "null") as { level?: number; categoryId?: unknown; questionIndex?: unknown } | null;
    if (!parsed || parsed.level === 1) return { level: 1 };
    if (typeof parsed.categoryId !== "string") return { level: 1 };
    const category = chatCategories.find((item) => item.id === parsed.categoryId);
    if (!category) return { level: 1 };
    if (parsed.level === 2) return { level: 2, categoryId: category.id };
    if (parsed.level === 3 && Number.isInteger(parsed.questionIndex) && Number(parsed.questionIndex) >= 0 && Number(parsed.questionIndex) < category.questions.length) {
      return { level: 3, categoryId: category.id, questionIndex: Number(parsed.questionIndex) };
    }
  } catch {
    // Invalid session data falls back to the category list.
  }
  return { level: 1 };
}

export function GigoloGuide() {
  const { locale } = useTranslation();
  const copy = guideCopy[locale];
  const categories = locale === "hi" ? chatCategoriesHi : chatCategories;
  const messagesStorageKey = `${STORAGE.messages}-${locale}`;
  const navigationStorageKey = `${STORAGE.navigation}-${locale}`;
  const scrollStorageKey = `${STORAGE.scroll}-${locale}`;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: "greeting", role: "guide", text: copy.greeting }]);
  const [navigation, setNavigation] = useState<NavigationState>({ level: 1 });
  const [typing, setTyping] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [hydratedLocale, setHydratedLocale] = useState<string | null>(null);
  const scrollArea = useRef<HTMLDivElement>(null);
  const responseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategoryId = navigation.level === 1 ? undefined : navigation.categoryId;
  const activeCategory = activeCategoryId ? categories.find((item) => item.id === activeCategoryId) : undefined;
  const coolingDown = cooldownEnd > Date.now();
  const latestGuideMessage = [...messages].reverse().find((message) => message.role === "guide")?.text || "";

  useEffect(() => {
    if (responseTimer.current) clearTimeout(responseTimer.current);
    responseTimer.current = null;
    setHydratedLocale(null);
    setTyping(false);
    setMessages([{ id: "greeting", role: "guide", text: copy.greeting }]);
    setNavigation({ level: 1 });
    setInput("");
    try {
      const storedMessages = JSON.parse(sessionStorage.getItem(messagesStorageKey) || "null") as unknown;
      if (Array.isArray(storedMessages) && storedMessages.length > 0 && storedMessages.every(isStoredMessage)) setMessages(storedMessages);
      setNavigation(parseNavigation(sessionStorage.getItem(navigationStorageKey)));
      const storedCooldown = Number(sessionStorage.getItem(STORAGE.cooldown));
      if (Number.isFinite(storedCooldown) && storedCooldown > Date.now()) {
        setCooldownEnd(storedCooldown);
        setRemaining(Math.ceil((storedCooldown - Date.now()) / 1000));
      }
    } catch {
      sessionStorage.removeItem(messagesStorageKey);
      sessionStorage.removeItem(navigationStorageKey);
    }
    setHydratedLocale(locale);
  }, [copy.greeting, locale, messagesStorageKey, navigationStorageKey]);

  useEffect(() => {
    if (hydratedLocale !== locale) return;
    sessionStorage.setItem(messagesStorageKey, JSON.stringify(messages));
    sessionStorage.setItem(navigationStorageKey, JSON.stringify(navigation));
    if (cooldownEnd > Date.now()) sessionStorage.setItem(STORAGE.cooldown, String(cooldownEnd));
    else sessionStorage.removeItem(STORAGE.cooldown);
  }, [cooldownEnd, hydratedLocale, locale, messages, messagesStorageKey, navigation, navigationStorageKey]);

  useEffect(() => {
    if (!cooldownEnd) {
      setRemaining(0);
      return;
    }
    const update = () => {
      const seconds = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setCooldownEnd(0);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [cooldownEnd]);

  useEffect(() => {
    if (!open || !scrollArea.current) return;
    const frame = requestAnimationFrame(() => {
      if (!scrollArea.current) return;
      scrollArea.current.scrollTop = Number(sessionStorage.getItem(scrollStorageKey)) || scrollArea.current.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [open, scrollStorageKey]);

  useEffect(() => {
    if (hydratedLocale !== locale || !open) return;
    const frame = requestAnimationFrame(() => scrollArea.current?.scrollTo({ top: scrollArea.current.scrollHeight, behavior: "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [hydratedLocale, locale, messages, navigation, open, typing]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => () => {
    if (responseTimer.current) clearTimeout(responseTimer.current);
  }, []);

  function queueGuideReply(text: string, nextNavigation?: NavigationState) {
    setTyping(true);
    responseTimer.current = setTimeout(() => {
      setMessages((current) => [...current, { id: messageId(), role: "guide", text }]);
      if (nextNavigation) setNavigation(nextNavigation);
      setTyping(false);
      responseTimer.current = null;
    }, 600 + Math.floor(Math.random() * 301));
  }

  function chooseCategory(category: ChatCategory) {
    if (typing) return;
    setMessages((current) => [...current, { id: messageId(), role: "user", text: `${category.icon} ${category.label}` }]);
    queueGuideReply(category.intro, { level: 2, categoryId: category.id });
  }

  function chooseQuestion(category: ChatCategory, question: ChatQuestion, questionIndex: number) {
    if (typing) return;
    setMessages((current) => [...current, { id: messageId(), role: "user", text: question.q }]);
    queueGuideReply(question.a, { level: 3, categoryId: category.id, questionIndex });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || coolingDown || typing) return;
    setMessages((current) => [...current, { id: messageId(), role: "user", text: question }]);
    setInput("");
    const end = Date.now() + 90_000;
    setCooldownEnd(end);
    setRemaining(90);
    sessionStorage.setItem(STORAGE.cooldown, String(end));
    queueGuideReply(copy.fallback);
  }

  function clearConversation() {
    if (responseTimer.current) clearTimeout(responseTimer.current);
    responseTimer.current = null;
    setTyping(false);
    setMessages([{ id: "greeting", role: "guide", text: copy.greeting }]);
    setNavigation({ level: 1 });
    setInput("");
    sessionStorage.removeItem(messagesStorageKey);
    sessionStorage.removeItem(navigationStorageKey);
    sessionStorage.removeItem(scrollStorageKey);
  }

  function navigationRows() {
    if (navigation.level === 1) {
      return (
        <section aria-label={copy.categoryList} className="space-y-2">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[.15em] text-cyan-200">{copy.chooseTopic}</p>
          {categories.map((category) => (
            <button type="button" key={category.id} disabled={typing} onClick={() => chooseCategory(category)} className="group flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 p-3 text-left transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-45">
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauve-700/70 text-lg">{category.icon}</span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-mauve-50">{category.label}</span><span className="mt-0.5 block text-[10px] text-mauve-400">{category.questions.length} {copy.questions}</span></span>
              <ChevronRight aria-hidden="true" size={15} className="shrink-0 text-mauve-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" />
            </button>
          ))}
        </section>
      );
    }

    if (!activeCategory) return null;
    if (navigation.level === 2) {
      return (
        <section aria-label={`${activeCategory.label}: ${copy.questions}`} className="space-y-2">
          <button type="button" disabled={typing} onClick={() => setNavigation({ level: 1 })} aria-label={copy.backCategories} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[11px] font-semibold text-cyan-200 transition hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-45"><ChevronLeft size={14} /> {copy.backCategories}</button>
          <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[.15em] text-mauve-400"><span aria-hidden="true">{activeCategory.icon}</span> {activeCategory.label}</p>
          {activeCategory.questions.map((question, index) => (
            <button type="button" key={question.q} disabled={typing} onClick={() => chooseQuestion(activeCategory, question, index)} className="group flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 px-4 py-3 text-left text-xs leading-5 text-mauve-100 transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-45"><span className="min-w-0 flex-1">{question.q}</span><ChevronRight aria-hidden="true" size={15} className="shrink-0 text-mauve-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-200" /></button>
          ))}
        </section>
      );
    }

    return (
      <section aria-label={copy.answerNavigation} className="space-y-2">
        <button type="button" onClick={() => setNavigation({ level: 2, categoryId: activeCategory.id })} aria-label={`${copy.moreQuestions}: ${activeCategory.label}`} className="flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 px-4 py-3 text-left text-xs font-semibold text-mauve-100 transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><ChevronLeft aria-hidden="true" size={15} className="text-cyan-200" /><span className="flex-1">{copy.moreQuestions}</span></button>
        <button type="button" onClick={() => setNavigation({ level: 1 })} aria-label={copy.seeAll} className="flex w-full items-center gap-3 rounded-2xl border border-mauve-700 bg-mauve-800/65 px-4 py-3 text-left text-xs font-semibold text-mauve-100 transition hover:border-fuchsia-400 hover:bg-mauve-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><List aria-hidden="true" size={15} className="text-cyan-200" /><span className="flex-1">{copy.seeAll}</span></button>
      </section>
    );
  }

  return (
    <div data-no-translate className="fixed bottom-4 right-4 z-[90] sm:bottom-5 sm:right-5">
      <AnimatePresence>
        {open && (
          <motion.section role="dialog" aria-modal="true" aria-labelledby="gigolo-guide-title" initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 28, scale: 0.98 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-x-0 bottom-0 flex h-[min(86dvh,44rem)] flex-col overflow-hidden rounded-t-[2rem] border border-mauve-700 bg-mauve-900 text-mauve-50 shadow-2xl shadow-mauve-950/60 sm:absolute sm:inset-x-auto sm:bottom-16 sm:right-0 sm:h-[36rem] sm:w-[24rem] sm:rounded-3xl">
            <header className="flex items-center justify-between border-b border-mauve-700 bg-gradient-to-r from-mauve-900 via-fuchsia-950 to-mauve-900 px-5 py-4">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-300 to-cyan-200 text-mauve-900"><Sparkles size={17} /></span><div><p id="gigolo-guide-title" className="text-sm font-semibold">{copy.title}</p><p className="text-[11px] text-mauve-300">{copy.subtitle}</p></div></div>
              <div className="flex items-center gap-1"><button type="button" onClick={clearConversation} aria-label={copy.clear} title={copy.clear} className="grid h-9 w-9 place-items-center rounded-lg text-mauve-300 transition hover:bg-white/5 hover:text-mauve-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><RotateCcw size={16} /></button><button type="button" onClick={() => setOpen(false)} aria-label={copy.close} className="grid h-9 w-9 place-items-center rounded-lg text-mauve-300 transition hover:bg-white/5 hover:text-mauve-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200"><X size={18} /></button></div>
            </header>

            <p className="sr-only" aria-live="polite" aria-atomic="true">{latestGuideMessage}</p>
            <div ref={scrollArea} onScroll={(event) => sessionStorage.setItem(scrollStorageKey, String(event.currentTarget.scrollTop))} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="space-y-3">
                {messages.map((message) => <motion.div key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[88%] rounded-2xl px-3 py-2.5 text-xs leading-5 ${message.role === "user" ? "ml-auto rounded-br-md bg-fuchsia-500 text-white" : "rounded-bl-md bg-mauve-800 text-mauve-100"}`}>{message.text}</motion.div>)}
                {typing && <div role="status" aria-label={copy.typing} className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-mauve-800 px-4 py-3"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200 [animation-delay:-.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-200" /></div>}
              </div>
              {!typing && navigationRows()}
            </div>

            <form onSubmit={submit} className="border-t border-mauve-700 p-3">
              <div className="flex gap-2"><input value={input} onChange={(event) => setInput(event.target.value)} disabled={coolingDown} aria-label={copy.title} aria-describedby={coolingDown ? "gigolo-guide-cooldown" : undefined} placeholder={coolingDown ? copy.cooldownPlaceholder(remaining) : copy.placeholder} className="h-10 min-w-0 flex-1 rounded-xl border border-mauve-700 bg-mauve-800 px-3 text-xs text-mauve-50 outline-none transition placeholder:text-mauve-400 focus:border-fuchsia-400 disabled:cursor-not-allowed disabled:bg-mauve-950 disabled:text-mauve-500" /><button type="submit" disabled={!input.trim() || coolingDown || typing} aria-label={copy.send} className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40"><Send size={15} /></button></div>
              {coolingDown && <p id="gigolo-guide-cooldown" role="status" aria-live="polite" className="mt-2 text-[10px] text-mauve-400">{copy.cooldown(remaining)}</p>}
            </form>
            <div className="flex items-center gap-2 border-t border-mauve-800 px-4 py-2 text-[10px] text-mauve-400"><ShieldCheck size={12} /> {copy.footer}</div>
          </motion.section>
        )}
      </AnimatePresence>
      <motion.button type="button" onClick={() => setOpen((current) => !current)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} aria-label={open ? copy.close : copy.open} aria-expanded={open} className="button-shine flex h-12 items-center gap-2 rounded-full bg-mauve-900 px-4 text-sm font-semibold text-mauve-50 shadow-2xl shadow-mauve-950/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 dark:bg-mauve-50 dark:text-mauve-950">{open ? <X size={18} /> : <MessageCircle size={18} />}<span className="hidden sm:inline">{copy.title}</span></motion.button>
    </div>
  );
}
