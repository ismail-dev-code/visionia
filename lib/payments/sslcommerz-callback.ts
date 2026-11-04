import { Prisma } from "@prisma/client";

import { CURRENCY_CODE } from "@/lib/constants/commerce";
import { prisma } from "@/lib/db";
import { validateSslCommerzTransaction } from "@/lib/payments/sslcommerz";

function getField(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function amountMatches(amount: string, expected: Prisma.Decimal) {
  if (!amount) return false;
  try {
    return new Prisma.Decimal(amount).equals(expected);
  } catch {
    return false;
  }
}

export async function processSslCommerzSuccess(form: FormData) {
  const transactionId = getField(form, "tran_id");
  const validationId = getField(form, "val_id");
  if (!transactionId || !validationId) {
    return { orderId: null, verified: false };
  }

  return processSslCommerzTransaction(transactionId, validationId);
}

export async function processSslCommerzTransaction(
  transactionId: string,
  validationId: string,
) {
  const matchingPayment = await prisma.payment.findFirst({
    where: { transactionId, method: "SSL_COMMERZ" },
    select: {
      id: true,
      orderId: true,
      amount: true,
      currency: true,
      status: true,
    },
  });

  if (!matchingPayment) {
    return { orderId: null, verified: false };
  }

  const validation = await validateSslCommerzTransaction(validationId);
  const gatewayStatus = validation.status.toUpperCase();
  const gatewayConfirmed = ["VALID", "VALIDATED"].includes(gatewayStatus);
  const validationFailures = [
    validation.transactionId === transactionId ? null : "transaction_id_mismatch",
    validation.validationId === validationId ? null : "validation_id_mismatch",
    validation.storeId === process.env.SSLCOMMERZ_STORE_ID?.trim()
      ? null
      : "store_id_mismatch",
    validation.currency === CURRENCY_CODE
      && matchingPayment.currency === CURRENCY_CODE
      ? null
      : "currency_mismatch",
    validation.riskLevel === "0" ? null : "risk_check_failed",
    amountMatches(validation.amount, matchingPayment.amount)
      ? null
      : "amount_mismatch",
  ].filter((reason): reason is string => reason !== null);
  const validationMatches = validationFailures.length === 0;
  const isValid = gatewayConfirmed && validationMatches;

  if (!isValid) {
    console.warn(JSON.stringify({
      event: "sslcommerz.validation_rejected",
      status: gatewayStatus || "MISSING",
      reasons: gatewayConfirmed ? validationFailures : ["gateway_not_confirmed"],
      environment: process.env.SSLCOMMERZ_IS_SANDBOX === "true"
        ? "sandbox"
        : process.env.SSLCOMMERZ_IS_SANDBOX === "false"
          ? "live"
          : "unset",
    }));
    const terminalFailure = [
      "FAILED",
      "INVALID",
      "INVALID_TRANSACTION",
      "CANCELLED",
      "CANCELED",
    ].includes(gatewayStatus);
    const rejectedConfirmedTransaction = gatewayConfirmed && !validationMatches;
    const nextStatus = terminalFailure || rejectedConfirmedTransaction
      ? "FAILED"
      : "PENDING";
    await prisma.payment.updateMany({
      where: { id: matchingPayment.id, status: "PENDING" },
      data: {
        status: nextStatus,
        providerStatus: gatewayStatus || "VALIDATION_UNCONFIRMED",
      },
    });
    return { orderId: matchingPayment.orderId, verified: false };
  }

  await prisma.$transaction(async (tx) => {
    const currentPayment = await tx.payment.findUnique({
      where: { id: matchingPayment.id },
      select: { status: true, orderId: true },
    });
    if (
      !currentPayment
      || currentPayment.status === "PAID"
      || currentPayment.status === "REFUNDED"
    ) {
      return;
    }

    await tx.payment.update({
      where: { id: matchingPayment.id },
      data: {
        status: "PAID",
        provider: "SSLCOMMERZ",
        providerReference: validationId,
        validationId,
        ...(validation.bankTransactionId
          ? { bankTransactionId: validation.bankTransactionId }
          : {}),
        ...(validation.sessionKey ? { sessionKey: validation.sessionKey } : {}),
        providerStatus: validation.status,
        verifiedAt: new Date(),
      },
    });
    await tx.order.updateMany({
      where: {
        id: currentPayment.orderId,
        status: "PENDING",
      },
      data: { status: "PROCESSING" },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 15_000,
  });

  return { orderId: matchingPayment.orderId, verified: true };
}

export async function processSslCommerzFailure(form: FormData, status: "FAILED" | "CANCELLED") {
  const transactionId = getField(form, "tran_id");
  if (!transactionId) {
    return null;
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionId, method: "SSL_COMMERZ" },
    select: { id: true, orderId: true },
  });
  if (!payment) {
    return null;
  }

  await prisma.payment.updateMany({
    where: { id: payment.id, status: "PENDING" },
    data: { status: "FAILED", providerStatus: status },
  });
  return payment.orderId;
}
