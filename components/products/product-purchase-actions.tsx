"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createBuyNowIntent } from "@/actions/cart";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import {
  translate,
  translateActionError,
  type Locale,
} from "@/lib/i18n-shared";

type PurchaseVariant = {
  id: string;
  name: string;
  value: string;
  stock: number;
  price: number | null;
};

export function ProductPurchaseActions({
  productId,
  stockQuantity,
  variants,
  locale,
  price,
  discountPrice,
}: {
  productId: string;
  stockQuantity: number;
  variants: PurchaseVariant[];
  locale: Locale;
  price: number;
  discountPrice: number | null;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const hasVariants = variants.length > 0;
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const available = selectedVariant?.stock ?? stockQuantity;
  const selectedPrice = selectedVariant?.price ?? discountPrice ?? price;
  const originalPrice =
    selectedVariant || discountPrice === null || discountPrice >= price ? null : price;
  const discountPercent =
    originalPrice === null
      ? 0
      : Math.round(((originalPrice - selectedPrice) / originalPrice) * 100);
  const canPurchase = available > 0 && (!hasVariants || Boolean(selectedVariant));

  async function handleBuyNow() {
    if (!canPurchase) {
      toast.error(
        translate(
          locale,
          hasVariants ? "products.selectVariant" : "common.outOfStock",
        ),
      );
      return;
    }

    setIsBuying(true);
    try {
      const result = await createBuyNowIntent(productId, quantity, variantId || undefined);
      router.push(`/checkout?intent=${encodeURIComponent(result.intentId)}`);
    } catch (error) {
      toast.error(translateActionError(error, locale));
      setIsBuying(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-3xl font-semibold tracking-[-0.04em] text-orange-600 sm:text-4xl">
          {formatBDT(selectedPrice, locale)}
        </span>
        {originalPrice !== null && (
          <span className="text-base text-slate-400 line-through">
            {formatBDT(originalPrice, locale)}
          </span>
        )}
        {discountPercent > 0 && (
          <span className="rounded-sm bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700">
            -{discountPercent}%
          </span>
        )}
      </div>
      {hasVariants && (
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>{translate(locale, "products.selectVariant")}</span>
          <select
            value={variantId}
            onChange={(event) => {
              setVariantId(event.target.value);
              setQuantity(1);
            }}
            className="h-12 w-full rounded-md border border-slate-300 bg-white px-4 text-slate-900 focus:border-orange-500 focus:outline-none"
            required
          >
            <option value="">{translate(locale, "products.selectVariant")}</option>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id} disabled={variant.stock <= 0}>
                {variant.name}: {variant.value}
                {variant.stock <= 0 ? ` — ${translate(locale, "common.outOfStock")}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        <span>{translate(locale, "products.quantity")}</span>
        <input
          type="number"
          min={1}
          max={Math.min(available || 1, 99)}
          value={quantity}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isInteger(next) && next > 0) {
              setQuantity(Math.min(next, Math.min(available || 1, 99)));
            }
          }}
          className="h-10 w-20 rounded-md border border-slate-300 bg-white px-3 text-center text-slate-900 focus:border-orange-500 focus:outline-none"
          aria-label={translate(locale, "products.quantity")}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <AddToCartButton
          productId={productId}
          quantity={quantity}
          variantId={variantId || undefined}
          locale={locale}
          disabled={!canPurchase}
          className="w-full rounded-md bg-amber-400 text-slate-950 hover:bg-amber-300"
        />
        <Button
          type="button"
          className="w-full rounded-md bg-orange-600 text-white hover:bg-orange-700"
          disabled={!canPurchase || isBuying}
          onClick={() => void handleBuyNow()}
        >
          {isBuying
            ? translate(locale, "common.loading")
            : translate(locale, "products.buyNow")}
        </Button>
      </div>
    </div>
  );
}
