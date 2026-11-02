"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { removeCartItem, updateCartItem } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import {
  translate,
  translateActionError,
  type Locale,
} from "@/lib/i18n-shared";

export function CartLineControls({
  cartItemId,
  productName,
  quantity,
  stockQuantity,
  locale,
}: {
  cartItemId: string;
  productName: string;
  quantity: number;
  stockQuantity: number;
  locale: Locale;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function update(nextQuantity: number) {
    setIsPending(true);
    try {
      const result = await updateCartItem(cartItemId, nextQuantity);
      window.dispatchEvent(
        new CustomEvent("visionia:cart-count", { detail: result.count }),
      );
    } catch (error) {
      toast.error(translateActionError(error, locale));
    } finally {
      setIsPending(false);
    }
  }

  async function remove() {
    setIsPending(true);
    try {
      const result = await removeCartItem(cartItemId);
      window.dispatchEvent(
        new CustomEvent("visionia:cart-count", {
          detail: result.count,
        }),
      );
      router.refresh();
    } catch (error) {
      toast.error(translateActionError(error, locale));
      setIsPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => void update(Math.max(1, quantity - 1))}
          disabled={isPending || quantity <= 1}
          aria-label={`Reduce quantity for ${productName}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-white disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-8 text-center text-sm font-medium text-slate-900">{quantity}</span>
        <button
          type="button"
          onClick={() => void update(quantity + 1)}
          disabled={isPending || quantity >= stockQuantity}
          aria-label={`Increase quantity for ${productName}`}
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button
        type="button"
        variant="ghost"
        disabled={isPending}
        onClick={() => void remove()}
        className="rounded-full text-slate-600 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" />
        {translate(locale, "cart.remove")}
      </Button>
    </div>
  );
}
