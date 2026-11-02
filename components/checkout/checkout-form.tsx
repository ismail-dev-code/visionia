"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createOrderFromCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import {
  translate,
  translateActionError,
  type Locale,
} from "@/lib/i18n-shared";

export function CheckoutForm({
  initialName,
  intentId,
  locale,
}: {
  initialName: string;
  intentId?: string;
  locale: Locale;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }, intentId);
      router.push(`/orders/${result.orderId}`);
    } catch (error) {
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
          : translate(locale, "checkout.placeOrder")}
      </Button>
    </form>
  );
}
