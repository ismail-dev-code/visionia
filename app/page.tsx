import type { ComponentProps } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BatteryCharging,
  Cable,
  Headphones,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HeroVisual } from "@/components/home/hero-visual";
import { ProductCard } from "@/components/products/product-card";
import { getTranslations } from "@/lib/i18n";
import { getProducts } from "@/lib/services/products";

const categories = [
  { name: "categoryMultiName", icon: PlugIcon, description: "categoryMultiDescription", slug: "multi-plugs" },
  { name: "categoryCableName", icon: Cable, description: "categoryCableDescription", slug: "usb-cables" },
  { name: "categoryChargersName", icon: Zap, description: "categoryChargersDescription", slug: "chargers-adapters" },
  { name: "categoryBanksName", icon: BatteryCharging, description: "categoryBanksDescription", slug: "power-banks" },
  { name: "categoryAudioName", icon: Headphones, description: "categoryAudioDescription", slug: "audio" },
  { name: "categoryAccessoryName", icon: Sparkles, description: "categoryAccessoryDescription", slug: "accessories" },
];

const trustedReasons = [
  { title: "reasonAuthentic", description: "reasonAuthenticDescription", icon: BadgeCheck },
  { title: "reasonDelivery", description: "reasonDeliveryDescription", icon: Truck },
  { title: "reasonSecure", description: "reasonSecureDescription", icon: ShieldCheck },
];

const testimonials = [
  {
    quote: "testimonialOne",
    name: "Farhan M.",
    role: "roleDesigner",
  },
  {
    quote: "testimonialTwo",
    name: "Nusrat A.",
    role: "roleConsultant",
  },
  {
    quote: "testimonialThree",
    name: "Shafin K.",
    role: "roleFounder",
  },
];

function PlugIcon(props: ComponentProps<typeof Cable>) {
  return <Cable {...props} />;
}

export default async function Home() {
  const { locale, t } = await getTranslations();
  const { products } = await getProducts({ sort: "popular", limit: 4 }, locale);

  return (
    <>
      <SiteHeader />

      <main className="bg-white">
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-10 lg:px-6 lg:pb-24 lg:pt-14">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <Badge variant="accent" className="mb-5 inline-flex items-center gap-2 px-3 py-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {t("home.badge")}
              </Badge>

              <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                {t("home.title")}
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                {t("home.description")}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" className="gap-2 rounded-full px-6">
                  {t("home.shopNow")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-6">
                  {t("home.exploreCategories")}
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-8 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {t("home.averageRating")}
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-cyan-600" />
                  {t("home.delivered")}
                </div>
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
            {[
              { value: "15k+", label: "home.statsProducts" },
              { value: "2.4k", label: "home.statsCustomers" },
              { value: "24h", label: "home.statsDispatch" },
              { value: "99.9%", label: "home.statsSupport" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                <div className="text-2xl font-semibold text-slate-950">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-600">{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-18 lg:px-6 lg:py-24">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">{t("home.categoryHeading")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{t("home.categoryTitle")}</h2>
            </div>
            <Button asChild variant="ghost" className="hidden gap-2 rounded-full md:inline-flex">
              <Link href="/categories">
              {t("home.viewAll")}
              <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {categories.map(({ name, icon: Icon, description, slug }) => (
              <Link key={name} href={`/shop?category=${slug}`}>
              <Card className="group overflow-hidden border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition group-hover:bg-slate-950 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-semibold text-slate-950">{t(`home.${name}`)}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(`home.${description}`)}</p>
                </CardContent>
              </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-18 lg:px-6 lg:py-24">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">{t("home.bestSellers")}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{t("home.popularPicks")}</h2>
              </div>
              <Button asChild variant="secondary" className="rounded-full bg-white text-slate-900 hover:bg-slate-200">
                <Link href="/shop">{t("home.browseCollection")}</Link>
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-18 lg:px-6 lg:py-24">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">{t("home.featured")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{t("home.reliable")}</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {trustedReasons.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-slate-200 bg-white">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{t(`home.${title}`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-7 text-slate-600">{t(`home.${description}`)}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-18 lg:px-6 lg:py-24">
            <div className="mb-10 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-700">{t("home.testimonials")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{t("home.customerSay")}</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {testimonials.map((item) => (
                <Card key={item.name} className="border-slate-200 bg-white">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={`${item.name}-${index}`} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-base leading-7 text-slate-700">“{t(`home.${item.quote}`)}”</p>
                    <div className="mt-6 border-t border-slate-200 pt-4">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      <div className="text-sm text-slate-500">{t(`home.${item.role}`)}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-18 lg:px-6 lg:py-24">
          <div className="flex flex-col items-center justify-between gap-8 rounded-[2rem] bg-slate-950 px-6 py-10 text-center text-white md:flex-row md:text-left lg:px-10">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">{t("home.stayInLoop")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{t("home.exclusiveOffers")}</h2>
            </div>

            <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input
                aria-label={t("auth.email")}
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                className="h-12 flex-1 rounded-full border border-slate-700 bg-slate-900 px-4 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
              />
              <Button className="h-12 rounded-full bg-cyan-400 px-6 text-slate-950 hover:bg-cyan-300">
                {t("home.subscribe")}
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
