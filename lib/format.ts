import type { Locale } from "@/lib/i18n";

const numberLocales: Record<Locale, string> = {
  en: "en-BD",
  bn: "bn-BD",
  ar: "ar-BD",
  hi: "hi-IN",
};

export function formatBDT(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(numberLocales[locale], {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  }).format(amount);
}
