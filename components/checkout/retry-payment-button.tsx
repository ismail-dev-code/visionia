"use client";

import { useState } from "react";
import { toast } from "sonner";

import { retrySslCommerzPayment } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { translate, type Locale } from "@/lib/i18n-shared";

export function RetryPaymentButton({
  orderId,
  locale,
}: {
  orderId: string;
  locale: Locale;
}) {
  const [isPending, setIsPending] = useState(false);

  async function retryPayment() {
    if (isPending) return;
    setIsPending(true);
    try {
      const result = await retrySslCommerzPayment(orderId);
      if (!result.success) {
        toast.error(translate(locale, "order.retryFailed"));
        return;
      }

      window.location.assign(result.paymentUrl);
    } catch {
      toast.error(translate(locale, "order.retryFailed"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      disabled={isPending}
      onClick={() => void retryPayment()}
    >
      {isPending
        ? translate(locale, "common.loading")
        : translate(locale, "order.retryPayment")}
    </Button>
  );
}
