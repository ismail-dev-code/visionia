"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  localeCookieName,
  locales,
  translate,
  type Locale,
} from "@/lib/i18n-shared";

const navItems = [
  { key: "home", href: "/" },
  { key: "shop", href: "/shop" },
  { key: "categories", href: "/categories" },
  { key: "wishlist", href: "/wishlist" },
  { key: "support", href: "/support" },
];

const languageNames: Record<Locale, string> = {
  en: "English",
  bn: "বাংলা",
  ar: "العربية",
  hi: "हिन्दी",
};

type SiteHeaderUser = {
  name: string | null;
  email: string;
  role: "ADMIN" | "CUSTOMER";
};

export function SiteHeaderClient({
  isAdmin,
  user,
  locale,
  initialCartCount,
}: {
  isAdmin: boolean;
  user: SiteHeaderUser | null;
  locale: Locale;
  initialCartCount: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const visibleNavItems = isAdmin
    ? [...navItems, { key: "admin", href: "/admin" }]
    : navItems;

  useEffect(() => {
    const updateCartCount = (event: Event) => {
      const count = (event as CustomEvent<unknown>).detail;
      if (typeof count === "number" && Number.isInteger(count) && count >= 0) {
        setCartCount(count);
      }
    };

    window.addEventListener("visionia:cart-count", updateCartCount);
    return () =>
      window.removeEventListener("visionia:cart-count", updateCartCount);
  }, []);

  useEffect(() => {
    setCartCount(initialCartCount);
  }, [initialCartCount]);

  function changeLanguage(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  function languageSelector(className: string) {
    return (
      <label className={className}>
        <span className="sr-only">{translate(locale, "common.language")}</span>
        <select
          aria-label={translate(locale, "common.language")}
          value={locale}
          onChange={(event) => {
            const nextLocale = locales.find(
              (item) => item === event.target.value,
            );
            if (nextLocale) {
              changeLanguage(nextLocale);
            }
          }}
          className="max-w-28 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 sm:max-w-none sm:px-3 sm:text-sm"
        >
          {locales.map((item) => (
            <option key={item} value={item}>
              {languageNames[item]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="border-b border-slate-200 bg-slate-950 px-3 py-2 text-center text-[11px] font-medium text-slate-100 sm:text-sm">
        {translate(locale, "common.freeShippingBanner")}
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={translate(
              locale,
              isOpen ? "navigation.closeMenu" : "navigation.openMenu",
            )}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label={translate(locale, "navigation.home")}
          >
            <Image
              src="/visionia-logo.svg"
              alt="Visionia Logo"
              width={220}
              height={80}
              priority
              className="block h-auto w-[130px] object-contain sm:w-[160px] lg:w-[190px]"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex lg:gap-7">
          {visibleNavItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="transition hover:text-slate-900"
            >
              {translate(locale, `navigation.${item.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {languageSelector("hidden lg:block")}

          <Link
            href="/wishlist"
            aria-label={translate(locale, "navigation.wishlist")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:h-10 sm:w-10"
          >
            <Heart className="h-4 w-4" />
          </Link>
          {user ? (
            <div className="relative">
              <button
                type="button"
                aria-label={translate(locale, "navigation.account")}
                aria-haspopup="menu"
                aria-expanded={isAccountOpen}
                onClick={() => setIsAccountOpen((value) => !value)}
                className="flex h-9 items-center justify-center gap-1 rounded-full px-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:h-10 sm:px-3"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                  {user.name || user.email}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
              </button>
              {isAccountOpen && (
                <div
                  role="menu"
                  aria-label={translate(locale, "navigation.account")}
                  className="absolute end-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                >
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.name || translate(locale, "navigation.welcome")}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {user.email}
                    </p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {translate(
                        locale,
                        user.role === "ADMIN"
                          ? "navigation.administrator"
                          : "navigation.customer",
                      )}
                    </p>
                  </div>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setIsAccountOpen(false)}
                      className="mt-1 block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      {translate(locale, "navigation.admin")}
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void signOut({ callbackUrl: "/login" })}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {translate(locale, "navigation.logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              aria-label={translate(locale, "navigation.account")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 sm:h-10 sm:w-10"
            >
              <UserRound className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/cart"
            aria-label={`${translate(locale, "navigation.cart")}: ${cartCount}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-[11px] font-medium text-white transition hover:bg-slate-800 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <span className="relative inline-flex">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -end-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[9px] font-bold leading-none text-slate-950">
                  {cartCount}
                </span>
              )}
            </span>
            <span className="hidden sm:inline">
              {translate(locale, "navigation.cart")}
            </span>
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {visibleNavItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {translate(locale, `navigation.${item.key}`)}
              </Link>
            ))}
            {languageSelector("px-3 py-2.5")}
          </nav>
        </div>
      )}
    </header>
  );
}
