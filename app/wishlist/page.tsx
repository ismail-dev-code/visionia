import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

import { toggleWishlist } from "@/actions/cart";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { formatBDT } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";
import { getWishlistSummary } from "@/lib/services/cart";

async function removeFromWishlist(formData: FormData) {
  "use server";

  const productId = String(formData.get("productId") ?? "");

  if (!productId) {
    return;
  }

  await toggleWishlist(productId);
}

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { locale, t } = await getTranslations();
  const wishlist = await getWishlistSummary(locale);

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">{t("wishlist.saved")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-950">{t("wishlist.title")}</h1>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {wishlist.length} {t(wishlist.length === 1 ? "cart.item" : "cart.items")}
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <Heart className="mx-auto h-12 w-12 text-slate-400" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">{t("wishlist.emptyTitle")}</h2>
            <p className="mt-2 text-slate-600">{t("wishlist.emptyDescription")}</p>
            <Link href="/shop" className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white">
              {t("wishlist.browse")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {wishlist.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex h-56 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(34,211,238,0.12),_rgba(15,118,110,0.08),_rgba(15,23,42,0.04))] p-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-full w-full rounded-[1rem] object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-[1rem] border border-slate-200 bg-white text-2xl font-semibold text-slate-900">
                      {item.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <Link href={`/product/${item.slug}`} className="text-xl font-semibold text-slate-950 hover:text-cyan-700">
                    {item.name}
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <span className="text-2xl font-semibold text-slate-950">{formatBDT(item.price, locale)}</span>
                    <span className="text-xs text-slate-500">
                      {t(item.stockQuantity > 0 ? "common.inStock" : "common.soldOut")}
                    </span>
                    <form action={removeFromWishlist}>
                      <input type="hidden" name="productId" value={item.productId} />
                      <Button type="submit" variant="outline" className="rounded-full text-slate-900">
                        {t("cart.remove")}
                      </Button>
                    </form>
                  </div>

                  {item.hasVariants ? (
                    <Button asChild className="mt-4 w-full rounded-full">
                      <Link href={`/product/${item.slug}`}>{t("products.selectOptions")}</Link>
                    </Button>
                  ) : (
                    <AddToCartButton
                      productId={item.productId}
                      locale={locale}
                      disabled={item.stockQuantity <= 0}
                      className="mt-4 w-full rounded-full"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
