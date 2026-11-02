import { ProductCard } from "@/components/products/product-card";
import { translate, type Locale } from "@/lib/i18n-shared";

export type ProductGridItem = {
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

type ProductGridProps = {
  products: ProductGridItem[];
  locale?: Locale;
};

export function ProductGrid({ products, locale = "en" }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <h3 className="text-xl font-semibold text-slate-900">{translate(locale, "shop.noProducts")}</h3>
        <p className="mt-2 text-slate-600">{translate(locale, "shop.adjustFilters")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} locale={locale} />
      ))}
    </div>
  );
}
