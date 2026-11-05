import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductGrid } from "@/components/products/product-grid";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";
import { getCategories, getProducts, type ProductSort } from "@/lib/services/products";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readPrice(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : undefined;
}

function isChecked(value: string | undefined) {
  return value === "true" || value === "on";
}

function getSort(value: string | undefined): ProductSort {
  switch (value) {
    case "price_asc":
    case "price_desc":
    case "popular":
    case "newest":
      return value;
    default:
      return "newest";
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const { locale, t } = await getTranslations();
  const params = (await searchParams) ?? {};
  const query = readParam(params.q)?.trim() ?? "";
  const categorySlug = readParam(params.category) || undefined;
  const sort = getSort(readParam(params.sort));
  const pageValue = Number(readParam(params.page) ?? "1");
  const page = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;
  const minPrice = readPrice(readParam(params.minPrice));
  const maxPrice = readPrice(readParam(params.maxPrice));
  const inStockOnly = isChecked(readParam(params.inStockOnly));
  const isFeatured = isChecked(readParam(params.isFeatured));
  const isNewArrival = isChecked(readParam(params.isNewArrival));

  const [categories, catalog] = await Promise.all([
    getCategories(locale),
    getProducts(
      {
        search: query,
        categorySlug,
        sort,
        minPrice,
        maxPrice,
        inStockOnly,
        isFeatured: isFeatured || undefined,
        isNewArrival: isNewArrival || undefined,
        page,
        limit: 12,
      },
      locale,
    ),
  ]);

  function pageHref(pageNumber: number) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (categorySlug) search.set("category", categorySlug);
    if (sort !== "newest") search.set("sort", sort);
    if (minPrice !== undefined) search.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) search.set("maxPrice", String(maxPrice));
    if (inStockOnly) search.set("inStockOnly", "true");
    if (isFeatured) search.set("isFeatured", "true");
    if (isNewArrival) search.set("isNewArrival", "true");
    search.set("page", String(pageNumber));
    return `/search?${search.toString()}`;
  }

  const firstPage = Math.max(1, Math.min(page - 2, catalog.pages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(catalog.pages, 5) },
    (_, index) => firstPage + index,
  );

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-12">
        <div className="mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">
            {t("productSearch.title")}
          </p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-[-0.05em] text-slate-950">
            {query
              ? t("productSearch.resultsFor").replace("{query}", query)
              : t("productSearch.allProducts")}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {catalog.total} {t("shop.available")}
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-950">
              <SlidersHorizontal className="h-4 w-4" />
              {t("productSearch.filters")}
            </div>
            <form action="/search" method="get" className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                {t("productSearch.query")}
                <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    className="h-10 min-w-0 flex-1 border-0 bg-transparent text-slate-900 outline-none"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                {t("productSearch.category")}
                <select
                  name="category"
                  defaultValue={categorySlug ?? ""}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900"
                >
                  <option value="">{t("productSearch.allCategories")}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  {t("productSearch.priceRange")}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-slate-500">
                    {t("productSearch.minimum")}
                    <input
                      name="minPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={minPrice}
                      placeholder={formatBDT(0, locale)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900"
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    {t("productSearch.maximum")}
                    <input
                      name="maxPrice"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={maxPrice}
                      placeholder={t("productSearch.noLimit")}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-900"
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="space-y-3">
                <legend className="mb-2 text-sm font-medium text-slate-700">
                  {t("productSearch.productFlags")}
                </legend>
                {[
                  { name: "inStockOnly", label: t("productSearch.inStock"), checked: inStockOnly },
                  { name: "isFeatured", label: t("productSearch.featured"), checked: isFeatured },
                  { name: "isNewArrival", label: t("productSearch.newArrival"), checked: isNewArrival },
                ].map(({ name, label, checked }) => (
                  <label key={name} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name={name}
                      value="true"
                      defaultChecked={checked}
                      className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              <label className="block text-sm font-medium text-slate-700">
                {t("productSearch.sort")}
                <select
                  name="sort"
                  defaultValue={sort}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-slate-900"
                >
                  <option value="newest">{t("shop.newest")}</option>
                  <option value="popular">{t("shop.popular")}</option>
                  <option value="price_asc">{t("shop.priceLow")}</option>
                  <option value="price_desc">{t("shop.priceHigh")}</option>
                </select>
              </label>

              <Button type="submit" className="w-full rounded-lg">
                {t("productSearch.applyFilters")}
              </Button>
              <Link
                href="/search"
                className="block text-center text-sm font-medium text-slate-600 hover:text-slate-950"
              >
                {t("shop.clearFilters")}
              </Link>
            </form>
          </aside>

          <section aria-label={t("productSearch.results")} className="min-w-0">
            <ProductGrid products={catalog.products} locale={locale} />

            {catalog.pages > 1 && (
              <nav
                aria-label={t("productSearch.pagination")}
                className="mt-8 flex flex-wrap items-center justify-center gap-2"
              >
                {page > 1 && (
                  <Link
                    href={pageHref(page - 1)}
                    rel="prev"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t("productSearch.previous")}
                  </Link>
                )}
                {pageNumbers.map((pageNumber) => (
                  <Link
                    key={pageNumber}
                    href={pageHref(pageNumber)}
                    aria-current={pageNumber === page ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium ${
                      pageNumber === page
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pageNumber}
                  </Link>
                ))}
                {page < catalog.pages && (
                  <Link
                    href={pageHref(page + 1)}
                    rel="next"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {t("productSearch.next")}
                  </Link>
                )}
              </nav>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
