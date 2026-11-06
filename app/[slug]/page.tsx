import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductGrid } from "@/components/products/product-grid";
import { getTranslations } from "@/lib/i18n";
import { getProducts } from "@/lib/services/products";

type InfoSection = {
  title: string;
  body: string;
};

function ActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
    >
      {children}
    </Link>
  );
}

export default async function PublicInfoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, { locale, t }, query] = await Promise.all([
    params,
    getTranslations(),
    searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}),
  ]);

  if (slug === "new-arrivals" || slug === "deals") {
    const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
    const parsedPage = Number(rawPage ?? "1");
    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const isDeals = slug === "deals";
    const catalog = await getProducts(
      {
        isNewArrival: isDeals ? undefined : true,
        discountedOnly: isDeals,
        sort: isDeals ? "popular" : "newest",
        page,
        limit: 12,
      },
      locale,
    );
    const title = isDeals ? t("footer.promotions") : t("footer.newArrivals");

    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
          <header className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">
              {t("shop.catalog")}
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-950">{title}</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              {isDeals
                ? "Browse currently discounted products. Prices and availability are shown on each product."
                : "Explore the latest products added to the Visionia catalog."}
            </p>
            <Link href="/shop" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-950">
              {t("footer.allProducts")}
            </Link>
          </header>

          <ProductGrid products={catalog.products} locale={locale} />

          {catalog.pages > 1 && (
            <nav aria-label="Catalog pages" className="mt-8 flex justify-center gap-3">
              {Array.from({ length: catalog.pages }, (_, index) => index + 1).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={`/${slug}?page=${pageNumber}`}
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
            </nav>
          )}
        </main>
        <SiteFooter />
      </>
    );
  }

  const infoPages: Record<string, { title: string; intro: string; sections: InfoSection[] }> = {
    about: {
      title: t("footer.about"),
      intro: "Visionia helps customers find useful electronics accessories for everyday work, home, and travel.",
      sections: [
        { title: "A focused catalog", body: "Browse chargers, cables, audio accessories, power products, and other everyday essentials in one place." },
        { title: "Here to help", body: "Our support team can help with product questions, orders, delivery, and returns." },
      ],
    },
    contact: {
      title: t("footer.contact"),
      intro: "Contact our team for product questions, order assistance, or help choosing an accessory.",
      sections: [
        { title: "Email", body: "Send your question to hello@visionia.tech. Include your order number for order-related requests." },
        { title: "Phone", body: "Call +880 1700-000000 for assistance." },
      ],
    },
    support: {
      title: t("navigation.support"),
      intro: "Find help with orders, payment, delivery, returns, and product questions.",
      sections: [
        { title: "Quick answers", body: "Visit the FAQ for answers to common questions about ordering, payment, shipping, and returns." },
        { title: "Contact our team", body: "Email hello@visionia.tech and include your order number if you need help with an existing order." },
      ],
    },
    shipping: {
      title: t("footer.shipping"),
      intro: "Delivery options and applicable charges are presented during checkout before you place an order.",
      sections: [
        { title: "Order updates", body: "For help with an existing order, contact support with your order number." },
        { title: "Delivery questions", body: "Our support team can help clarify delivery information for your location and order." },
      ],
    },
    privacy: {
      title: t("footer.privacy"),
      intro: "Visionia uses account and order information to provide storefront features and fulfill purchases.",
      sections: [
        { title: "Your information", body: "Information submitted through account, checkout, and newsletter forms is used to provide the related service." },
        { title: "Questions or requests", body: "Contact hello@visionia.tech if you have a question about information associated with your account." },
      ],
    },
    terms: {
      title: t("footer.terms"),
      intro: "These terms describe the basic use of the Visionia storefront and ordering service.",
      sections: [
        { title: "Orders and availability", body: "Product availability, prices, and delivery details are shown on the site and during checkout and may change as stock changes." },
        { title: "Need help?", body: "Contact support if you have a question about an order or the information shown on this site." },
      ],
    },
    returns: {
      title: t("footer.returns"),
      intro: "Eligible purchases have 30-day return support. Contact our team before sending an item back.",
      sections: [
        { title: "Requesting help", body: "Email hello@visionia.tech with your order number and the reason for your request so our team can guide you through the next steps." },
        { title: "Order questions", body: "For more answers about orders and returns, visit the FAQ." },
      ],
    },
  };
  const content = infoPages[slug];
  if (!content) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-6 lg:py-16">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">Visionia</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950">{content.title}</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">{content.intro}</p>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {content.sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <nav aria-label="Helpful pages" className="mt-8 flex flex-wrap gap-3">
          {slug === "contact" || slug === "support" ? (
            <>
              <ActionLink href="mailto:hello@visionia.tech">{t("faq.contactSupport")}</ActionLink>
              <ActionLink href="/faq">{t("footer.faqs")}</ActionLink>
            </>
          ) : (
            <>
              <ActionLink href="/shop">{t("footer.allProducts")}</ActionLink>
              <ActionLink href="/contact">{t("footer.contact")}</ActionLink>
            </>
          )}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
