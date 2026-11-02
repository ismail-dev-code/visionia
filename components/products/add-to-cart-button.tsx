"use client";

import { useState } from "react";
import { toast } from "sonner";

import { addToCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { translate, translateActionError, type Locale } from "@/lib/i18n-shared";

export function AddToCartButton({
  productId,
  quantity = 1,
  variantId,
  locale,
  disabled = false,
  className,
}: {
  productId: string;
  quantity?: number;
  variantId?: string;
  locale: Locale;
  disabled?: boolean;
  className?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  async function handleAdd() {
    setIsPending(true);
    try {
      const result = await addToCart(productId, quantity, variantId);
      window.dispatchEvent(
        new CustomEvent("visionia:cart-count", { detail: result.count }),
      );
      toast.success(translate(locale, "products.addedToCart"));
    } catch (error) {
      toast.error(translateActionError(error, locale));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      className={className}
      disabled={disabled || isPending}
      onClick={() => void handleAdd()}
    >
      {isPending
        ? translate(locale, "common.loading")
        : translate(locale, "products.addToCart")}
    </Button>
  );
}
