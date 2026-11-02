import Link from "next/link";
import { ArrowRight, Search, SlidersHorizontal, Sparkles, Star } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductGrid } from "@/components/products/product-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n";
import { getCategories, getProducts } from "@/lib/services/products";

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
}) {
  const { locale, t } = await getTranslations();
  const params = (await searchParams) ?? {};
  const search = readParam(params.search) ?? "";
  const categorySlug = readParam(params.category) ?? readParam(params.categorySlug) ?? undefined;
  const sort = (readParam(params.sort) as "newest" | "price_asc" | "price_desc" | "popular") ?? "newest";
  const page = Number(readParam(params.page) ?? "1") || 1;

  const [categories, catalog] = await Promise.all([
    getCategories(locale),
    getProducts({
      categorySlug,
      search,
      sort,
      page,
      limit: 12,
    }, locale),
  ]);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Badge variant="accent" className="mb-4 inline-flex items-center gap-2 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {t("shop.badge")}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-[-0.06em] text-slate-950 lg:text-5xl">{t("shop.title")}</h1>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {t("shop.rating")}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
          <form method="get" action="/shop" className="grid gap-4 lg:grid-cols-[1.2fr_0.7fr_0.3fr]">
            <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder={t("shop.searchPlaceholder")}
                className="w-full border-0 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <select
                name="sort"
                defaultValue={sort}
                className="w-full border-0 bg-transparent text-slate-900 focus:outline-none"
              >
                <option value="newest">{t("shop.newest")}</option>
                <option value="popular">{t("shop.popular")}</option>
                <option value="price_asc">{t("shop.priceLow")}</option>
                <option value="price_desc">{t("shop.priceHigh")}</option>
              </select>
            </label>

            <Button type="submit" className="rounded-full px-5">{t("shop.apply")}</Button>
          </form>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              !categorySlug ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {t("shop.allProducts")}
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={{ pathname: "/shop", query: { ...params, category: category.slug, page: "1" } }}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                categorySlug === category.slug
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between gap-4 pb-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">{t("shop.catalog")}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">
              {catalog.total} {t("shop.available")}
            </h2>
          </div>
          {categorySlug && (
            <Link href="/shop" className="text-sm font-medium text-slate-600 hover:text-slate-950">
              {t("shop.clearFilters")}
            </Link>
          )}
        </div>

        <ProductGrid products={catalog.products.map((product) => ({
          ...product,
          category: product.category
            ? { name: product.category.name, slug: product.category.slug }
            : undefined,
        }))} locale={locale} />

        {catalog.pages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {Array.from({ length: Math.min(catalog.pages, 5) }, (_, index) => {
              const pageNumber = index + 1;
              const href = {
                pathname: "/shop",
                query: { ...params, page: String(pageNumber) },
              };

              return (
                <Link
                  key={pageNumber}
                  href={href}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium ${
                    pageNumber === page ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {pageNumber}
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-14 rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-lg">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-cyan-300">{t("shop.help")}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{t("shop.expert")}</h3>
            </div>
            <Button variant="secondary" className="rounded-full bg-white text-slate-950 hover:bg-slate-200">
              {t("shop.talkToTeam")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
