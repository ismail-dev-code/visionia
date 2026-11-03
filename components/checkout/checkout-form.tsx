"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Truck } from "lucide-react";

import { createOrderFromCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";
import {
  translate,
  translateActionError,
  type Locale,
} from "@/lib/i18n-shared";

export function CheckoutForm({
  initialName,
  intentId,
  locale,
  subtotal,
  totalAmount,
  shippingFee,
  codAdvanceAmount,
  advanceAppliedToShipping,
  remainingCodAmount,
}: {
  initialName: string;
  intentId?: string;
  locale: Locale;
  subtotal: string;
  totalAmount: string;
  shippingFee: string;
  codAdvanceAmount: string;
  advanceAppliedToShipping: string;
  remainingCodAmount: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "SSL_COMMERZ">("COD");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const result = await createOrderFromCart({
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        addressLine: String(formData.get("addressLine") ?? ""),
        city: String(formData.get("city") ?? ""),
        state: String(formData.get("state") ?? ""),
        postalCode: String(formData.get("postalCode") ?? ""),
        country: String(formData.get("country") ?? "Bangladesh"),
        notes: String(formData.get("notes") ?? ""),
      }, intentId, paymentMethod);
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      if (result.paymentError) {
        toast.error(translate(locale, "checkout.paymentStartFailed"));
      }
      router.push(`/orders/${result.orderId}`);
    } catch (error) {
      if (error instanceof Error && error.name === "UnrecognizedActionError") {
        toast.error(translate(locale, "checkout.sessionOutdated"));
        window.setTimeout(() => window.location.reload(), 1200);
        return;
      }

      toast.error(translateActionError(error, locale));
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      aria-busy={isSubmitting}
      className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-950">
        {translate(locale, "checkout.shippingDetails")}
      </h2>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>{translate(locale, "checkout.fullName")}</span>
          <input
            name="fullName"
            defaultValue={initialName}
            autoComplete="name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            required
            minLength={2}
            maxLength={120}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>{translate(locale, "checkout.phone")}</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+880 1XXXXXXXXX"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            required
            minLength={5}
            maxLength={40}
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>{translate(locale, "checkout.address")}</span>
        <input
          name="addressLine"
          autoComplete="street-address"
          placeholder="House / Road / Block"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
          required
          minLength={5}
          maxLength={500}
        />
      </label>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>{translate(locale, "checkout.city")}</span>
          <input
            name="city"
            autoComplete="address-level2"
            placeholder="Dhaka"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            required
            minLength={2}
            maxLength={120}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>{translate(locale, "checkout.state")}</span>
          <input
            name="state"
            autoComplete="address-level1"
            placeholder="Dhaka"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            maxLength={120}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>{translate(locale, "checkout.postalCode")}</span>
          <input
            name="postalCode"
            autoComplete="postal-code"
            placeholder="1212"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            maxLength={24}
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>{translate(locale, "checkout.country")}</span>
        <input
          name="country"
          autoComplete="country-name"
          defaultValue="Bangladesh"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
          required
          minLength={2}
          maxLength={100}
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-slate-900">
          {translate(locale, "checkout.paymentMethod")}
        </legend>
        <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 has-[:checked]:border-cyan-700 has-[:checked]:bg-cyan-50">
          <input
            type="radio"
            name="paymentMethod"
            value="SSL_COMMERZ"
            checked={paymentMethod === "SSL_COMMERZ"}
            onChange={() => setPaymentMethod("SSL_COMMERZ")}
            className="mt-1 accent-cyan-700"
          />
          <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-cyan-800" />
          <span className="space-y-1">
            <span className="block font-medium text-slate-900">
              {translate(locale, "checkout.onlinePayment")}
            </span>
            <span className="block text-sm text-slate-600">
              {translate(locale, "checkout.onlinePaymentDescription")}
            </span>
            <span className="block text-sm font-semibold text-slate-800">
              {translate(locale, "checkout.payNow")}: {formatBDT(totalAmount, locale)}
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 has-[:checked]:border-cyan-700 has-[:checked]:bg-cyan-50">
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
            className="mt-1 accent-cyan-700"
          />
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-800" />
          <span className="min-w-0 flex-1 space-y-1">
            <span className="block font-medium text-slate-900">
              {translate(locale, "checkout.cashOnDelivery")}
            </span>
            <span className="block text-sm text-slate-600">
              {Number(codAdvanceAmount) > 0
                ? translate(locale, "checkout.codAdvanceDescription")
                : translate(locale, "checkout.codNoAdvanceDescription")}
            </span>
          </span>
        </label>

        {paymentMethod === "COD" && (
          <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4 text-slate-600">
              <span>{translate(locale, "cart.subtotal")}</span>
              <span>{formatBDT(subtotal, locale)}</span>
            </div>
            <div className="flex justify-between gap-4 text-slate-600">
              <span>{translate(locale, "cart.shipping")}</span>
              <span>{formatBDT(shippingFee, locale)}</span>
            </div>
            {Number(codAdvanceAmount) > 0 && (
              <>
                <div className="flex justify-between gap-4 text-slate-600">
                  <span>{translate(locale, "checkout.codAdvance")}</span>
                  <span>{formatBDT(codAdvanceAmount, locale)}</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-600">
                  <span>{translate(locale, "checkout.advanceApplied")}</span>
                  <span>-{formatBDT(advanceAppliedToShipping, locale)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between gap-4 border-t border-slate-200 pt-2 font-semibold text-slate-900">
              <span>{translate(locale, "checkout.remainingAtDelivery")}</span>
              <span>{formatBDT(remainingCodAmount, locale)}</span>
            </div>
            {Number(codAdvanceAmount) > 0 && (
              <p className="pt-1 text-xs leading-5 text-slate-500">
                {translate(locale, "checkout.codAdvanceNotice")}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        <span>{translate(locale, "checkout.notes")}</span>
        <textarea
          name="notes"
          rows={4}
          maxLength={1000}
          placeholder={translate(locale, "checkout.notesPlaceholder")}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
        />
      </label>

      <Button type="submit" disabled={isSubmitting} className="w-full rounded-full">
        {isSubmitting
          ? translate(locale, "common.loading")
          : translate(
              locale,
              paymentMethod === "COD" ? "checkout.placeCodOrder" : "checkout.payOnline",
            )}
      </Button>
    </form>
  );
}
