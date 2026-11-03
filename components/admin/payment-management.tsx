"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  initiatePaymentRefund,
  queryPaymentRefund,
  querySslCommerzPayment,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/format";

type PaymentRecord = {
  id: string;
  method: string;
  purpose: string;
  status: string;
  amount: number;
  currency: string | null;
  transactionId: string | null;
  sessionKey: string | null;
  validationId: string | null;
  bankTransactionId: string | null;
  providerReference: string | null;
  providerStatus: string | null;
  createdAt: string;
  refunds: Array<{
    id: string;
    referenceId: string;
    providerReference: string | null;
    amount: number;
    currency: string;
    status: string;
    providerStatus: string | null;
    createdAt: string;
  }>;
};

function displayDate(value: string) {
  return new Date(value).toISOString();
}

export function PaymentManagement({ payments }: { payments: PaymentRecord[] }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [refundAmounts, setRefundAmounts] = useState<Record<string, string>>({});
  const [refundRemarks, setRefundRemarks] = useState<Record<string, string>>({});

  async function checkPayment(paymentId: string, type: "transaction" | "session") {
    const key = `${paymentId}:${type}`;
    setPendingAction(key);
    try {
      const result = await querySslCommerzPayment(paymentId, type);
      toast.success(
        result.verified
          ? "Gateway verified this payment."
          : `Gateway status: ${result.status}`,
      );
      router.refresh();
    } catch {
      toast.error("Could not check the payment. Verify the gateway configuration and try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function startRefund(paymentId: string) {
    const amount = refundAmounts[paymentId] ?? "";
    const remarks = refundRemarks[paymentId] ?? "";
    setPendingAction(`${paymentId}:refund`);
    try {
      await initiatePaymentRefund(paymentId, amount, remarks);
      toast.success("Refund submitted and recorded as pending gateway confirmation.");
      setRefundAmounts((current) => ({ ...current, [paymentId]: "" }));
      setRefundRemarks((current) => ({ ...current, [paymentId]: "" }));
      router.refresh();
    } catch {
      toast.error("Could not initiate the refund. Check the amount and payment eligibility.");
    } finally {
      setPendingAction(null);
    }
  }

  async function checkRefund(refundId: string) {
    setPendingAction(`${refundId}:refund-query`);
    try {
      const result = await queryPaymentRefund(refundId);
      toast.success(`Refund status: ${result.status}`);
      router.refresh();
    } catch {
      toast.error("Could not check the refund status.");
    } finally {
      setPendingAction(null);
    }
  }

  if (payments.length === 0) {
    return <span className="text-slate-400">No payment record</span>;
  }

  return (
    <details className="min-w-64">
      <summary className="cursor-pointer font-medium text-cyan-800">
        View {payments.length} payment{payments.length === 1 ? "" : "s"}
      </summary>
      <div className="mt-3 space-y-3">
        {payments.map((payment) => (
          <section key={payment.id} className="space-y-2 rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-slate-900">
                {payment.purpose.replaceAll("_", " ")} · {payment.status}
              </span>
              <span>{formatBDT(payment.amount)} {payment.currency ?? "BDT"}</span>
            </div>
            <dl className="space-y-1 break-all text-xs text-slate-600">
              {payment.transactionId && (
                <div><dt className="inline font-medium">Transaction: </dt><dd className="inline">{payment.transactionId}</dd></div>
              )}
              {payment.sessionKey && (
                <div><dt className="inline font-medium">Session: </dt><dd className="inline">{payment.sessionKey}</dd></div>
              )}
              {payment.validationId && (
                <div><dt className="inline font-medium">Validation: </dt><dd className="inline">{payment.validationId}</dd></div>
              )}
              {payment.bankTransactionId && (
                <div><dt className="inline font-medium">Bank transaction: </dt><dd className="inline">{payment.bankTransactionId}</dd></div>
              )}
              {payment.providerReference && (
                <div><dt className="inline font-medium">Gateway reference: </dt><dd className="inline">{payment.providerReference}</dd></div>
              )}
              <div><dt className="inline font-medium">Gateway status: </dt><dd className="inline">{payment.providerStatus ?? "—"}</dd></div>
              <div><dt className="inline font-medium">Created: </dt><dd className="inline">{displayDate(payment.createdAt)}</dd></div>
            </dl>

            {payment.method === "SSL_COMMERZ" && (
              <div className="flex flex-wrap gap-2">
                {payment.transactionId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingAction !== null}
                    onClick={() => void checkPayment(payment.id, "transaction")}
                  >
                    {pendingAction === `${payment.id}:transaction` ? "Checking..." : "Check transaction"}
                  </Button>
                )}
                {payment.sessionKey && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pendingAction !== null}
                    onClick={() => void checkPayment(payment.id, "session")}
                  >
                    {pendingAction === `${payment.id}:session` ? "Checking..." : "Check session"}
                  </Button>
                )}
              </div>
            )}

            {payment.refunds.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-2">
                {payment.refunds.map((refund) => (
                  <div key={refund.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span>
                      Refund {formatBDT(refund.amount)} {refund.currency} · {refund.status}
                      {refund.providerStatus ? ` (${refund.providerStatus})` : ""}
                      <span className="block break-all text-slate-500">{refund.providerReference ?? refund.referenceId}</span>
                    </span>
                    {refund.status === "PENDING" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pendingAction !== null}
                        onClick={() => void checkRefund(refund.id)}
                      >
                        {pendingAction === `${refund.id}:refund-query` ? "Checking..." : "Check refund"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {payment.method === "SSL_COMMERZ"
              && payment.status === "PAID"
              && payment.bankTransactionId && (
                <div className="grid gap-2 border-t border-slate-100 pt-2">
                  <input
                    aria-label="Refund amount"
                    type="number"
                    min="0.01"
                    max={payment.amount}
                    step="0.01"
                    placeholder="Refund amount"
                    value={refundAmounts[payment.id] ?? ""}
                    onChange={(event) => setRefundAmounts((current) => ({
                      ...current,
                      [payment.id]: event.target.value,
                    }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    aria-label="Refund reason"
                    type="text"
                    minLength={3}
                    maxLength={100}
                    placeholder="Refund reason"
                    value={refundRemarks[payment.id] ?? ""}
                    onChange={(event) => setRefundRemarks((current) => ({
                      ...current,
                      [payment.id]: event.target.value,
                    }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={
                      pendingAction !== null
                      || !refundAmounts[payment.id]
                      || (refundRemarks[payment.id] ?? "").trim().length < 3
                    }
                    onClick={() => void startRefund(payment.id)}
                  >
                    {pendingAction === `${payment.id}:refund` ? "Submitting..." : "Initiate refund"}
                  </Button>
                </div>
              )}
          </section>
        ))}
      </div>
    </details>
  );
}
