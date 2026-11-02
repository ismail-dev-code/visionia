import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag } from "lucide-react";

import { CartLineControls } from "@/components/cart/cart-line-controls";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import { formatBDT } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";
import { getCartSummary } from "@/lib/services/cart";

export default async function CartPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { locale, t } = await getTranslations();
  const cart = await getCartSummary(locale);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">{t("cart.yourCart")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-950">{t("cart.ready")}</h1>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {cart.count} {t(cart.count === 1 ? "cart.item" : "cart.items")}
          </div>
        </div>

        {cart.items.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <ShoppingBag className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">{t("cart.emptyTitle")}</h2>
            <p className="mt-2 text-slate-600">{t("cart.emptyDescription")}</p>
            <Link href="/shop" className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              {t("cart.explore")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                  <div className="flex h-26 w-full max-w-[170px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(34,211,238,0.12),_rgba(15,118,110,0.08),_rgba(15,23,42,0.04))] p-3 sm:w-[170px]">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-full w-full rounded-[1rem] object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-lg font-semibold text-slate-900">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <Link href={`/product/${item.slug}`} className="text-xl font-semibold text-slate-950 hover:text-cyan-700">
                      {item.name}
                    </Link>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatBDT(item.unitPrice, locale)} {t("cart.each")}
                    </p>
                    {item.variantName && item.variantValue && (
                      <p className="mt-1 text-sm text-slate-600">{item.variantName}: {item.variantValue}</p>
                    )}
                    <CartLineControls
                      cartItemId={item.id}
                      productName={item.name}
                      quantity={item.quantity}
                      stockQuantity={item.stockQuantity}
                      locale={locale}
                    />
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-semibold text-slate-950">{formatBDT(item.total, locale)}</div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">{t("cart.summary")}</h2>

              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatBDT(cart.subtotal, locale)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("cart.shipping")}</span>
                  <span>{cart.shippingFee === 0 ? t("cart.free") : formatBDT(cart.shippingFee, locale)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                  <span>{t("cart.total")}</span>
                  <span>{formatBDT(cart.total, locale)}</span>
                </div>
              </div>

              <Link href="/checkout" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
                {t("cart.proceed")}
              </Link>
            </aside>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
