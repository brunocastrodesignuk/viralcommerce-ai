/**
 * ViralCommerce AI — Preferences Store
 * Persists theme, language and currency to localStorage via Zustand.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Themes ──────────────────────────────────────────────────────────────────

export type ThemeId =
  | "dark"       // padrão — cinza carvão
  | "midnight"   // azul meia-noite profundo
  | "purple"     // roxo vibrante
  | "ocean"      // azul oceano
  | "forest"     // verde floresta
  | "sunset";    // laranja/vermelho pôr-do-sol

export interface ThemeConfig {
  id: ThemeId;
  label: string;
  bg: string;       // body background
  card: string;     // card background
  border: string;   // border color
  accent: string;   // primary accent
  accentHover: string;
  preview: string;  // preview dot color (tailwind color class)
}

export const THEMES: ThemeConfig[] = [
  {
    id: "dark",
    label: "Dark (Padrão)",
    bg: "#030712",
    card: "#111827",
    border: "#1f2937",
    accent: "#0ea5e9",
    accentHover: "#38bdf8",
    preview: "bg-gray-800",
  },
  {
    id: "midnight",
    label: "Midnight Blue",
    bg: "#020617",
    card: "#0f172a",
    border: "#1e3a5f",
    accent: "#6366f1",
    accentHover: "#818cf8",
    preview: "bg-indigo-950",
  },
  {
    id: "purple",
    label: "Purple Neon",
    bg: "#0a0414",
    card: "#130d2a",
    border: "#2d1f4f",
    accent: "#a855f7",
    accentHover: "#c084fc",
    preview: "bg-purple-950",
  },
  {
    id: "ocean",
    label: "Deep Ocean",
    bg: "#011827",
    card: "#052840",
    border: "#0e4163",
    accent: "#06b6d4",
    accentHover: "#22d3ee",
    preview: "bg-cyan-950",
  },
  {
    id: "forest",
    label: "Forest Green",
    bg: "#020f07",
    card: "#071a0d",
    border: "#14532d",
    accent: "#22c55e",
    accentHover: "#4ade80",
    preview: "bg-green-950",
  },
  {
    id: "sunset",
    label: "Sunset Fire",
    bg: "#150a00",
    card: "#1c1200",
    border: "#431407",
    accent: "#f97316",
    accentHover: "#fb923c",
    preview: "bg-orange-950",
  },
];

// ─── Languages ───────────────────────────────────────────────────────────────

export type LangId = "pt" | "en" | "es" | "fr" | "de" | "it" | "ja" | "zh";

export interface LangConfig {
  id: LangId;
  label: string;
  flag: string;
  nativeName: string;
}

export const LANGUAGES: LangConfig[] = [
  { id: "pt", label: "Português", flag: "🇧🇷", nativeName: "Português (BR)" },
  { id: "en", label: "English",   flag: "🇺🇸", nativeName: "English (US)" },
  { id: "es", label: "Español",   flag: "🇪🇸", nativeName: "Español" },
  { id: "fr", label: "Français",  flag: "🇫🇷", nativeName: "Français" },
  { id: "de", label: "Deutsch",   flag: "🇩🇪", nativeName: "Deutsch" },
  { id: "it", label: "Italiano",  flag: "🇮🇹", nativeName: "Italiano" },
  { id: "ja", label: "日本語",     flag: "🇯🇵", nativeName: "日本語" },
  { id: "zh", label: "中文",       flag: "🇨🇳", nativeName: "中文 (简体)" },
];

// ─── Currencies ──────────────────────────────────────────────────────────────

export type CurrencyId = "BRL" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "MXN";

export interface CurrencyConfig {
  id: CurrencyId;
  symbol: string;
  label: string;
  flag: string;
  rate: number; // relative to USD
}

export const CURRENCIES: CurrencyConfig[] = [
  { id: "USD", symbol: "$",  label: "Dólar Americano",      flag: "🇺🇸", rate: 1.0   },
  { id: "BRL", symbol: "R$", label: "Real Brasileiro",       flag: "🇧🇷", rate: 5.05  },
  { id: "EUR", symbol: "€",  label: "Euro",                  flag: "🇪🇺", rate: 0.92  },
  { id: "GBP", symbol: "£",  label: "Libra Esterlina",       flag: "🇬🇧", rate: 0.79  },
  { id: "JPY", symbol: "¥",  label: "Iene Japonês",          flag: "🇯🇵", rate: 150.5 },
  { id: "AUD", symbol: "A$", label: "Dólar Australiano",     flag: "🇦🇺", rate: 1.54  },
  { id: "CAD", symbol: "C$", label: "Dólar Canadense",       flag: "🇨🇦", rate: 1.36  },
  { id: "MXN", symbol: "MX$",label: "Peso Mexicano",         flag: "🇲🇽", rate: 17.1  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface PreferencesState {
  theme: ThemeId;
  language: LangId;
  currency: CurrencyId;
  setTheme: (t: ThemeId) => void;
  setLanguage: (l: LangId) => void;
  setCurrency: (c: CurrencyId) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "dark",
      language: "pt",
      currency: "USD",
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
    }),
    { name: "viralcommerce-preferences" }
  )
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Apply a theme's CSS variables to :root */
export function applyTheme(themeId: ThemeId) {
  const t = THEMES.find((x) => x.id === themeId) ?? THEMES[0];
  const root = document.documentElement;
  root.style.setProperty("--vc-bg",          t.bg);
  root.style.setProperty("--vc-card",        t.card);
  root.style.setProperty("--vc-border",      t.border);
  root.style.setProperty("--vc-accent",      t.accent);
  root.style.setProperty("--vc-accent-hover",t.accentHover);
  root.setAttribute("data-theme", themeId);
}

/** Convert a USD price to the selected currency */
export function convertPrice(usdPrice: number, currencyId: CurrencyId): string {
  const c = CURRENCIES.find((x) => x.id === currencyId) ?? CURRENCIES[0];
  const converted = usdPrice * c.rate;
  return `${c.symbol}${converted.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
