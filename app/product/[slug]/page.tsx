import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";

import { toggleWishlist } from "@/actions/cart";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { ProductPurchaseActions } from "@/components/products/product-purchase-actions";
import { Button } from "@/components/ui/button";
import { getTranslations } from "@/lib/i18n";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/products";

async function saveProductForLater(formData: FormData) {
  "use server";

  const productId = String(formData.get("productId") ?? "");

  if (!productId) {
    return;
  }

  await toggleWishlist(productId);
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { locale, t } = await getTranslations();
  const { slug } = await params;
  const product = await getProductBySlug(slug, locale);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 4, locale);
  const availableStock = product.variants.length > 0
    ? product.variants.some((variant) => variant.stock > 0)
    : product.stockQuantity > 0;

  return (
    <>
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/shop" className="inline-flex items-center gap-1 hover:text-orange-700">
            <ArrowLeft className="h-4 w-4" />
            {t("products.backToShop")}
          </Link>
          <span>/</span>
          <Link href={`/shop?category=${product.category.slug}`} className="hover:text-orange-700">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="line-clamp-1 text-slate-700">{product.name}</span>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ProductImageGallery images={product.images} productName={product.name} />

          <section className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 sm:p-7">
            <div>
              <p className="text-sm font-medium text-orange-700">{product.category.name}</p>
              <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 sm:text-3xl">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {product.rating.toFixed(1)}
                </span>
                <span>{product.reviewCount} {t("common.customerReviews")}</span>
                <span className="text-slate-300">|</span>
                <span>{availableStock ? t("common.inStock") : t("common.soldOut")}</span>
              </div>
            </div>

            {product.shortDescription && (
              <p className="border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">
                {product.shortDescription}
              </p>
            )}

            <div className="border-t border-slate-100 pt-5">
              <ProductPurchaseActions
                productId={product.id}
                stockQuantity={product.stockQuantity}
                variants={product.variants.map((variant) => ({
                  id: variant.id,
                  name: variant.name,
                  value: variant.value,
                  stock: variant.stock,
                  price: variant.price === null ? null : Number(variant.price),
                }))}
                locale={locale}
                price={product.price}
                discountPrice={product.discountPrice}
              />
              <form action={saveProductForLater} className="mt-3">
                <input type="hidden" name="productId" value={product.id} />
                <Button type="submit" variant="outline" className="w-full rounded-md">
                  <Heart className="h-4 w-4" />
                  {t("products.saveForLater")}
                </Button>
              </form>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>{t("products.freeShipping")}</span>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>{t("products.securePayments")}</span>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                <span>{t("products.returns")}</span>
              </div>
              <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                SKU: {product.sku}
              </p>
            </div>
          </section>
        </div>

        <section className="mt-8 space-y-8 rounded-lg border border-slate-200 bg-white p-5 sm:p-7">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-slate-950">{t("products.description")}</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
              {product.description ?? t("products.defaultDescription")}
            </p>
          </div>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-xl font-semibold text-slate-950">{t("products.specifications")}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{key}</div>
                    <div className="mt-2 text-sm text-slate-800">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="mt-16">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-700">{t("products.youMayLike")}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-slate-950">{t("products.related")}</h2>
            </div>
          </div>
          <ProductGrid products={relatedProducts.map((item) => ({
            ...item,
            category: item.category
              ? { name: item.category.name, slug: item.category.slug }
              : undefined,
          }))} locale={locale} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
