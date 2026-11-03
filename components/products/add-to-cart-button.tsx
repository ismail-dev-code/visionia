"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { addToCart, type AddToCartErrorCode } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { translate, translateActionError, type Locale } from "@/lib/i18n-shared";

const errorMessageKeys: Record<AddToCartErrorCode, string> = {
  auth_required: "common.loginRequired",
  invalid_request: "common.invalidCartRequest",
  invalid_quantity: "common.invalidQuantity",
  product_not_found: "common.productNotFound",
  product_unavailable: "common.productUnavailable",
  variant_unavailable: "common.variantUnavailable",
  variant_required: "common.chooseVariant",
  out_of_stock: "common.outOfStockError",
  insufficient_stock: "common.quantityUnavailable",
  internal_error: "common.error",
};

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
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleAdd() {
    setIsPending(true);
    try {
      const result = await addToCart(productId, quantity, variantId);
      if (!result.success) {
        if (result.error === "auth_required") {
          router.push("/login?reason=cart");
          return;
        }

        toast.error(translate(locale, errorMessageKeys[result.error]));
        return;
      }

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
