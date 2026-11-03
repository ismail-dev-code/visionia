import type { Locale } from "@/lib/i18n";
import { CURRENCY_LOCALE, CURRENCY_SYMBOL } from "@/lib/constants/commerce";

export function formatBDT(
  amount: number | string | { toString(): string },
  locale?: Locale,
): string {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    throw new TypeError("Currency amount must be a finite number.");
  }

  const formattedAmount = new Intl.NumberFormat(locale ?? CURRENCY_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return `${CURRENCY_SYMBOL}${formattedAmount}`;
}
