import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";

import { RetryPaymentButton } from "@/components/checkout/retry-payment-button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBDT } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }> | { orderId: string };
  searchParams?: Promise<{ payment?: string }> | { payment?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { orderId } = await params;
  const [order, { locale, t }, query] = await Promise.all([
    prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: {
        items: true,
        shippingAddress: true,
        payments: {
          select: { method: true, purpose: true, status: true },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getTranslations(),
    searchParams ?? {},
  ]);
  if (!order) {
    notFound();
  }

  const advancePayment = order.payments.find((payment) => payment.purpose === "COD_ADVANCE");
  const remainderPayment = order.payments.find((payment) => payment.purpose === "COD_REMAINDER");
  const fullPayment = order.payments.find((payment) => payment.purpose === "FULL_ORDER");
  const paymentStatus = order.paymentMethod === "COD"
    ? order.advanceAmount.gt(0)
      ? advancePayment?.status === "PAID"
        ? remainderPayment?.status === "PAID" ? "paid" : "advanceReceived"
        : "advancePending"
      : remainderPayment?.status === "PAID" ? "paid" : "codDue"
    : fullPayment?.status === "PAID"
      ? "paid"
      : fullPayment?.status === "FAILED" ? "failed" : "pending";
  const canRetryPayment =
    order.status === "PENDING"
    && (order.paymentMethod === "SSL_COMMERZ" || order.advanceAmount.gt(0))
    && paymentStatus !== "paid";

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-6 lg:py-16">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="text-center">
            {order.status === "PENDING"
              ? <Clock3 className="mx-auto h-14 w-14 text-amber-500" />
              : <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />}
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
              {order.status === "PENDING" ? t("order.paymentPending") : t("order.confirmed")}
            </h1>
            <p className="mt-2 text-slate-600">{t("order.thankYou")}</p>
            <p className="mt-4 text-sm text-slate-600">
              {t("order.number")}: <span className="font-semibold text-slate-900">{order.orderNumber}</span>
            </p>
            {query?.payment === "success" && (
              <p role="status" className="mt-3 text-sm font-medium text-emerald-700">
                {t("order.paymentSuccess")}
              </p>
            )}
            {query?.payment === "failed" && (
              <p role="alert" className="mt-3 text-sm font-medium text-rose-700">
                {t("order.paymentFailed")}
              </p>
            )}
            {query?.payment === "cancelled" && (
              <p role="status" className="mt-3 text-sm font-medium text-amber-700">
                {t("order.paymentCancelled")}
              </p>
            )}
            {query?.payment === "pending" && (
              <p role="status" className="mt-3 text-sm font-medium text-amber-700">
                {t("order.paymentChecking")}
              </p>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-slate-950">{t("order.details")}</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="font-medium text-slate-900">{item.productName}</p>
                    {item.variantName && item.variantValue && (
                      <p className="text-sm text-slate-600">{item.variantName}: {item.variantValue}</p>
                    )}
                    <p className="text-sm text-slate-600">
                      {t("products.quantity")}: {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium text-slate-900">
                    {formatBDT(Number(item.total), locale)}
                  </p>
                </div>
              ))}
            </div>

            {order.shippingAddress && (
              <div className="mt-6">
                <h3 className="font-semibold text-slate-950">{t("order.shippingTo")}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {order.shippingAddress.fullName}<br />
                  {order.shippingAddress.addressLine}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.country}<br />
                  {order.shippingAddress.phone}
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-between border-t border-slate-200 pt-4 text-lg font-semibold text-slate-950">
              <span>{t("cart.total")}</span>
              <span>{formatBDT(Number(order.totalAmount), locale)}</span>
            </div>

            <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">{t("order.paymentMethod")}</span>
                <span className="font-medium text-slate-900">
                  {order.paymentMethod === "COD" ? t("checkout.cashOnDelivery") : t("checkout.onlinePayment")}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">{t("order.paymentStatus")}</span>
                <span className="font-medium text-slate-900">{t(`order.status.${paymentStatus}`)}</span>
              </div>
              {order.paymentMethod === "COD" && (
                <>
                  {order.advanceAmount.gt(0) && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-600">{t("checkout.codAdvance")}</span>
                      <span className="font-medium text-slate-900">{formatBDT(Number(order.advanceAmount), locale)}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 font-semibold text-slate-900">
                    <span>{t("checkout.remainingAtDelivery")}</span>
                    <span>{formatBDT(Number(order.remainingCodAmount), locale)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {canRetryPayment && (
            <div className="mt-8">
              <RetryPaymentButton orderId={order.id} locale={locale} />
            </div>
          )}

          <Link
            href="/shop"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white sm:w-auto"
          >
            {t("products.backToShop")}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
