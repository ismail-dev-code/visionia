import { cookies } from "next/headers";

import {
  defaultLocale,
  localeCookieName,
  locales,
  translate,
  type Locale,
} from "@/lib/i18n-shared";

export * from "@/lib/i18n-shared";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(localeCookieName)?.value;
  return locales.find((locale) => locale === value) ?? defaultLocale;
}

export async function getTranslations() {
  const locale = await getLocale();
  return {
    locale,
    t: (key: string) => translate(locale, key),
  };
}
