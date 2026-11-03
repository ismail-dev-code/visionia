import { redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";

import { CheckoutForm } from "@/components/checkout/checkout-form";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/lib/constants/commerce";
import { formatBDT } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";
import { getBuyNowSummary, getCartSummary } from "@/lib/services/cart";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ intent?: string }> | { intent?: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { locale, t } = await getTranslations();
  const params = await searchParams;
  const intentId = typeof params?.intent === "string" ? params.intent : undefined;
  const buyNow = intentId ? await getBuyNowSummary(intentId, locale) : null;
  const cart = intentId ? null : await getCartSummary(locale);
  const subtotal = new Prisma.Decimal(buyNow?.total ?? cart?.subtotal ?? 0);
  const shippingFee = buyNow
    ? subtotal.gte(FREE_SHIPPING_THRESHOLD)
      ? new Prisma.Decimal(0)
      : new Prisma.Decimal(STANDARD_SHIPPING_FEE)
    : new Prisma.Decimal(cart?.shippingFee ?? 0);

  if (!intentId && (!cart || cart.items.length === 0)) {
    redirect("/cart");
  }

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">{t("checkout.secure")}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-950">{t("checkout.complete")}</h1>
        </div>

        {intentId && !buyNow ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-700">{t("checkout.expired")}</p>
            <Link href="/shop" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              {t("products.backToShop")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <CheckoutForm
              initialName={session.user?.name ?? ""}
              intentId={buyNow?.id}
              locale={locale}
            />

            <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">{t("cart.summary")}</h2>
              <div className="mt-5 space-y-4">
                {(buyNow ? [buyNow] : cart?.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{item.name}</div>
                        {("variantName" in item && item.variantName && item.variantValue) && (
                          <div className="text-xs text-slate-600">{item.variantName}: {item.variantValue}</div>
                        )}
                        <div className="text-sm text-slate-600">
                          {t("products.quantity")}: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 font-medium text-slate-900">{formatBDT(item.total, locale)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatBDT(subtotal, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("cart.shipping")}</span>
                  <span>
                    {shippingFee.isZero() ? t("cart.free") : formatBDT(shippingFee, locale)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>{t("cart.total")}</span>
                  <span>{formatBDT(subtotal.plus(shippingFee), locale)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
