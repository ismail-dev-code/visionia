"use client";

import { useState } from "react";
import { toast } from "sonner";

import { markCodRemainderPaid } from "@/actions/admin";
import { Button } from "@/components/ui/button";

export function OrderPaymentControl({
  orderId,
  paymentMethod,
  codRemainderStatus,
  advanceAmount,
  advancePaymentStatus,
}: {
  orderId: string;
  paymentMethod: string;
  codRemainderStatus: string;
  advanceAmount: number;
  advancePaymentStatus: string;
}) {
  const [isPending, setIsPending] = useState(false);

  if (
    paymentMethod !== "COD"
    || codRemainderStatus !== "PENDING"
    || (advanceAmount > 0 && advancePaymentStatus !== "PAID")
  ) {
    return null;
  }

  async function markAsPaid() {
    if (!window.confirm("Confirm that the COD balance was collected from the customer?")) {
      return;
    }

    setIsPending(true);
    try {
      await markCodRemainderPaid(orderId);
      toast.success("COD balance marked as collected.");
    } catch {
      toast.error("Could not update the COD balance.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() => void markAsPaid()}
    >
      {isPending ? "Saving..." : "Mark COD collected"}
    </Button>
  );
}
