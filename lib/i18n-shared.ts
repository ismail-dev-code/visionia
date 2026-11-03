import arabic from "@/messages/ar.json";
import bengali from "@/messages/bn.json";
import english from "@/messages/en.json";
import hindi from "@/messages/hi.json";

export const locales = ["en", "bn", "ar", "hi"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localeCookieName = "visionia_locale";

const dictionaries = {
  en: english,
  bn: bengali,
  ar: arabic,
  hi: hindi,
};

function lookup(dictionary: unknown, key: string): string | undefined {
  const result = key.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, dictionary);

  return typeof result === "string" ? result : undefined;
}

export function translate(locale: Locale, key: string): string {
  return lookup(dictionaries[locale], key) ?? lookup(english, key) ?? key;
}

export function translateActionError(error: unknown, locale: Locale): string {
  const message = error instanceof Error ? error.message : "";
  const stockCount = message.match(/^Only (\d+) item(?:s)? available\.$/);

  if (stockCount) {
    return translate(locale, "common.stockLimited").replace("{count}", stockCount[1]);
  }

  const messageKeys: Array<[string, string]> = [
    ["SSLCommerz is not configured.", "checkout.paymentConfiguration"],
    ["Set SSLCOMMERZ_IS_SANDBOX", "checkout.paymentConfiguration"],
    ["Set NEXT_PUBLIC_SITE_URL", "checkout.paymentConfiguration"],
    ["SSLCommerz requires an online payment", "checkout.paymentMinimum"],
    ["Product not found.", "common.productNotFound"],
    ["This product is unavailable.", "common.productUnavailable"],
    ["This product is out of stock.", "common.outOfStockError"],
    ["The selected product option is unavailable.", "common.variantUnavailable"],
    ["Choose a product option before continuing.", "common.chooseVariant"],
    ["The requested quantity exceeds the available stock.", "common.quantityUnavailable"],
    ["no longer has enough stock.", "common.quantityUnavailable"],
    ["Remove the existing product option", "common.variantConflict"],
    ["This Buy Now checkout has expired", "common.checkoutUnavailable"],
    ["Your cart is empty.", "common.cartEmpty"],
    ["The selected product no longer has enough stock.", "common.quantityUnavailable"],
  ];

  const key = messageKeys.find(([text]) => message.includes(text))?.[1];
  return key ? translate(locale, key) : translate(locale, "common.error");
}

export function getLocalizedText(
  translations: unknown,
  locale: Locale,
  key: string,
  fallback: string | null | undefined,
): string {
  if (typeof translations === "object" && translations !== null) {
    const localizedContent = (translations as Record<string, unknown>)[locale];

    if (typeof localizedContent === "object" && localizedContent !== null) {
      const value = (localizedContent as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return fallback ?? "";
}
