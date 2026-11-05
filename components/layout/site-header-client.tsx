"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
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

type SearchSuggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  variantStartingPrice: number | null;
  primaryImage: string | null;
};

function isSearchSuggestion(value: unknown): value is SearchSuggestion {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.slug === "string" &&
    typeof product.price === "number" &&
    (typeof product.discountPrice === "number" || product.discountPrice === null) &&
    (typeof product.variantStartingPrice === "number" || product.variantStartingPrice === null) &&
    (typeof product.primaryImage === "string" || product.primaryImage === null)
  );
}

export function SiteHeaderClient({
  isAdmin,
  user,
  locale,
  initialCartCount,
  categories,
}: {
  isAdmin: boolean;
  user: SiteHeaderUser | null;
  locale: Locale;
  initialCartCount: number;
  categories: Array<{ name: string; slug: string }>;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const visibleNavItems = isAdmin
    ? [...navItems, { key: "admin", href: "/admin" }]
    : navItems;
  const searchTerm = searchQuery.trim();
  const showSearchDropdown = isSearchOpen && searchTerm.length >= 2;

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

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setIsSearchLoading(false);
      setSearchFailed(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearchLoading(true);
      setSearchFailed(false);

      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(searchTerm)}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Product suggestions request failed: ${response.status}`);
        }

        const payload: unknown = await response.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("products" in payload) ||
          !Array.isArray(payload.products) ||
          !payload.products.every(isSearchSuggestion)
        ) {
          throw new Error("Product suggestions response was invalid.");
        }

        setSuggestions(payload.products);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setSuggestions([]);
        setSearchFailed(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [searchTerm]);

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
    <>
      <header>
      <div className="border-b border-slate-200 bg-slate-950 px-3 py-2 text-center text-[11px] font-medium text-slate-100 sm:text-sm">
        {translate(locale, "common.freeShippingBanner")}
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-4 sm:px-4 lg:px-6">
          <Link
            href="/"
            className="col-start-1 row-start-1 flex shrink-0 items-center"
            aria-label={translate(locale, "navigation.home")}
          >
            <Image
              src="/visionia-logo.svg"
              alt="Visionia Logo"
              width={220}
              height={80}
              priority
              className="block h-auto w-[112px] object-contain sm:w-[150px] lg:w-[180px]"
            />
          </Link>

          <form
            action="/search"
            role="search"
            className="relative col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsSearchOpen(false);
              }
            }}
          >
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-500 transition focus-within:border-slate-400 focus-within:bg-white">
              <input
                type="search"
                name="q"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={translate(locale, "navigation.search")}
                aria-label={translate(locale, "navigation.search")}
                aria-autocomplete="list"
                aria-expanded={showSearchDropdown}
                aria-controls={showSearchDropdown ? "product-search-results" : undefined}
                autoComplete="off"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                aria-label={translate(locale, "productSearch.submit")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              >
                <Search className="h-5 w-5" />
              </button>
            </label>

            {showSearchDropdown && (
              <div
                id="product-search-results"
                role="listbox"
                aria-label={translate(locale, "productSearch.suggestions")}
                className="absolute inset-x-0 top-full z-[120] mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
              >
                {isSearchLoading ? (
                  <p role="status" className="flex items-center gap-2 px-4 py-4 text-sm text-slate-600">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {translate(locale, "productSearch.loading")}
                  </p>
                ) : searchFailed ? (
                  <p role="alert" className="px-4 py-4 text-sm text-rose-700">
                    {translate(locale, "productSearch.error")}
                  </p>
                ) : suggestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {suggestions.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        role="option"
                        aria-selected="false"
                        onClick={() => setIsSearchOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                          {product.primaryImage ? (
                            <img
                              src={product.primaryImage}
                              alt=""
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Search className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-900">
                            {product.name}
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-orange-700">
                            {translate(locale, "common.currency")}
                            {new Intl.NumberFormat(locale).format(
                              product.variantStartingPrice ??
                                product.discountPrice ??
                                product.price,
                            )}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p role="status" className="px-4 py-4 text-sm text-slate-600">
                    {translate(locale, "productSearch.noSuggestions")}
                  </p>
                )}
                <Link
                  href={`/search?q=${encodeURIComponent(searchTerm)}`}
                  onClick={() => setIsSearchOpen(false)}
                  className="block border-t border-slate-100 px-4 py-3 text-sm font-semibold text-cyan-800 transition hover:bg-slate-50"
                >
                  {translate(locale, "productSearch.viewAll")} “{searchTerm}”
                </Link>
              </div>
            )}
          </form>

          <div className="col-start-2 row-start-1 flex items-center justify-end gap-0.5 sm:col-start-3 sm:row-start-1 sm:gap-1">
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
                    className="absolute end-0 top-full z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-start shadow-xl"
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
              className="inline-flex h-9 items-center gap-1 rounded-full bg-slate-950 px-2.5 text-[11px] font-medium text-white transition hover:bg-slate-800 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm"
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
      </div>

      </header>

      <div className="sticky top-0 z-[100] bg-slate-950 text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center px-3 sm:px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="me-2 text-white hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={translate(
              locale,
              isOpen ? "navigation.closeMenu" : "navigation.openMenu",
            )}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <nav className="hidden min-h-14 items-center gap-5 text-sm font-medium text-white lg:flex lg:gap-7">
            {visibleNavItems.map((item) => (
              <div key={item.key} className="group relative">
                <Link href={item.href} className="transition hover:text-cyan-300">
                  {translate(locale, `navigation.${item.key}`)}
                </Link>
                {item.key === "categories" && categories.length > 0 && (
                  <div className="invisible absolute start-0 top-full z-50 min-w-56 translate-y-1 rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {categories.map((category) => (
                      <Link
                        key={category.slug}
                        href={`/shop?category=${category.slug}`}
                        className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {isOpen && (
          <div className="border-t border-white/10 bg-slate-950 lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {visibleNavItems.map((item) => (
                <div key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block rounded-xl px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                  >
                    {translate(locale, `navigation.${item.key}`)}
                  </Link>
                  {item.key === "categories" && categories.length > 0 && (
                    <div className="ms-3 border-s-2 border-white/10 py-1 ps-2">
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={`/shop?category=${category.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="block rounded-xl px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {languageSelector("px-3 py-2.5")}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
