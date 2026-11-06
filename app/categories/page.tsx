import Link from "next/link";
import { ArrowRight, Cable, Headphones, Package2, Plug, ShieldCheck, Zap } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "@/lib/i18n";
import { getCategories } from "@/lib/services/products";

const categoryIcons: Record<string, typeof Plug> = {
  "multi-plugs": Plug,
  "usb-cables": Cable,
  "chargers-adapters": Zap,
  "power-banks": Package2,
  audio: Headphones,
};

export default async function CategoriesPage() {
  const { locale, t } = await getTranslations();
  const categories = await getCategories(locale);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 text-center">
          <Badge variant="accent" className="mb-3 inline-flex items-center gap-2 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("categories.badge")}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-[-0.06em] text-slate-950 lg:text-5xl">{t("categories.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {t("categories.description")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] ?? Plug;

            return (
              <Link
                key={category.id}
                href={`/shop?category=${category.slug}`}
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition group-hover:bg-slate-950 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-semibold text-slate-950">{category.name}</h2>
                  <span className="text-sm text-slate-500">{category.productCount} {t("categories.items")}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{category.description || t("categories.fallbackDescription")}</p>
                <span className="mt-5 inline-flex h-9 items-center gap-2 text-sm font-medium text-slate-900 transition group-hover:text-cyan-700">
                  {t("categories.browse")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
