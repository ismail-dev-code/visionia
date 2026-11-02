import Link from "next/link";
import { Star } from "lucide-react";

import { formatBDT } from "@/lib/format";
import { translate, type Locale } from "@/lib/i18n-shared";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountPrice: number | null;
    stockQuantity: number;
    rating: number;
    reviewCount: number;
    primaryImage: string | null;
    hasVariants: boolean;
    variantStartingPrice: number | null;
    category?: {
      name: string;
      slug: string;
    };
  };
};

export function ProductCard({
  product,
  locale = "en",
}: ProductCardProps & { locale?: Locale }) {
  const salePrice = product.variantStartingPrice ?? product.discountPrice ?? product.price;
  const discountPercent =
    !product.hasVariants && product.discountPrice !== null && product.discountPrice < product.price
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  return (
    <article className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-lg">
      <Link
        href={`/product/${product.slug}`}
        className="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
        aria-label={`${product.name} - ${formatBDT(salePrice, locale)}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 p-3 sm:p-4">
          {product.primaryImage ? (
            <img
              src={product.primaryImage}
              alt={product.name}
              className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-white text-2xl font-semibold text-slate-500">
              {product.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          {discountPercent > 0 && (
            <span className="absolute left-3 top-3 rounded-sm bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
              -{discountPercent}%
            </span>
          )}
          {product.stockQuantity <= 0 && (
            <span className="absolute bottom-3 left-3 rounded-sm bg-slate-900/80 px-2 py-1 text-xs font-medium text-white">
              {translate(locale, "common.soldOut")}
            </span>
          )}
        </div>

        <div className="space-y-2.5 p-3 sm:p-4">
          <h3 className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-800 group-hover:text-orange-700 sm:text-[15px]">
            {product.name}
          </h3>

          <div className="flex min-h-7 flex-wrap items-baseline gap-x-2 gap-y-1">
            {product.hasVariants && (
              <span className="text-xs text-slate-500">{translate(locale, "products.fromPrice")}</span>
            )}
            <span className="text-xl font-medium leading-6 text-orange-600">
              {formatBDT(salePrice, locale)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-slate-400 line-through">
                {formatBDT(product.price, locale)}
              </span>
            )}
          </div>

          <div className="flex min-h-5 items-center justify-between gap-2 text-xs text-slate-500">
            <span className="inline-flex min-w-0 items-center gap-1">
              <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-700">{product.rating.toFixed(1)}</span>
              <span className="truncate">({product.reviewCount} {translate(locale, "common.reviews")})</span>
            </span>
            {product.stockQuantity > 0 && (
              <span className="shrink-0">{translate(locale, "common.inStock")}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
