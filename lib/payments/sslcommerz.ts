import "server-only";

import SSLCommerzPayment from "sslcommerz-lts";

type SslCommerzConfig = {
  storeId: string;
  storePassword: string;
  isLive: boolean;
};

export type SslCommerzPaymentInput = {
  transactionId: string;
  amount: string;
  purpose: "FULL_ORDER" | "COD_ADVANCE";
  orderNumber: string;
  productName: string;
  itemCount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export class SslCommerzError extends Error {
  readonly cause?: unknown;

  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "SslCommerzError";
    this.cause = options?.cause;
  }
}

export type SslCommerzValidation = {
  status: string;
  transactionId: string;
  validationId: string;
  amount: string;
  currency: string;
  storeId: string;
  riskLevel: string;
  bankTransactionId: string | null;
  sessionKey: string | null;
};

function getSslCommerzConfig(): SslCommerzConfig {
  const storeId = process.env.SSLCOMMERZ_STORE_ID?.trim();
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD?.trim();
  const sandboxValue = process.env.SSLCOMMERZ_IS_SANDBOX;
  if (!storeId || !storePassword) {
    throw new SslCommerzError("SSLCommerz is not configured. Add the merchant credentials to the server environment.");
  }
  if (sandboxValue !== "true" && sandboxValue !== "false") {
    throw new SslCommerzError("Set SSLCOMMERZ_IS_SANDBOX to true or false.");
  }

  return {
    storeId,
    storePassword,
    isLive: sandboxValue === "false",
  };
}

export function getSslCommerzCallbackBaseUrl() {
  const siteUrlValue =
    process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || process.env.AUTH_URL?.trim()
    || process.env.NEXTAUTH_URL?.trim();
  if (!siteUrlValue) {
    throw new SslCommerzError("Set NEXT_PUBLIC_SITE_URL to the public site URL.");
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(siteUrlValue);
  } catch {
    throw new SslCommerzError("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
  }
  if (
    !["http:", "https:"].includes(siteUrl.protocol)
    || (process.env.NODE_ENV === "production" && siteUrl.protocol !== "https:")
  ) {
    throw new SslCommerzError("The payment callback site URL must use HTTPS in production.");
  }

  return siteUrl.origin;
}

export function isSslCommerzConfigured() {
  if (
    !process.env.SSLCOMMERZ_STORE_ID?.trim()
    || !process.env.SSLCOMMERZ_STORE_PASSWORD?.trim()
    || !["true", "false"].includes(process.env.SSLCOMMERZ_IS_SANDBOX ?? "")
  ) {
    return false;
  }

  try {
    getSslCommerzCallbackBaseUrl();
    return true;
  } catch (error) {
    if (error instanceof SslCommerzError) {
      return false;
    }
    throw error;
  }
}

function getSdk() {
  const config = getSslCommerzConfig();
  return {
    sdk: new SSLCommerzPayment(
      config.storeId,
      config.storePassword,
      config.isLive,
    ),
    config,
  };
}

function asErrorRecord(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (record) return record;
  if (value instanceof Error) {
    return value as Error & Record<string, unknown>;
  }
  return null;
}

function safeDiagnosticText(value: unknown, sensitiveValues: string[] = []) {
  if (typeof value !== "string") return undefined;
  let text = value;
  for (const secret of [
    process.env.SSLCOMMERZ_STORE_PASSWORD,
    process.env.SSLCOMMERZ_STORE_ID,
    ...sensitiveValues,
  ]) {
    if (secret) text = text.replaceAll(secret, "[redacted]");
  }
  return text
    .replace(
      /(["']?(?:store_passwd|store_password|store_id|val_id|tran_id|bank_tran_id|sessionkey|card_no|card_number)["']?\s*[:=]\s*["']?)[^"'&\s,}]+/gi,
      "$1[redacted]",
    )
    .replace(
      /(["']?(?:amount|store_amount|total_amount)["']?\s*[:=]\s*["']?)[^"'&\s,}]+/gi,
      "$1[redacted]",
    )
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[redacted number]")
    .replace(/\b(?:\+?88)?01[3-9]\d{8}\b/g, "[redacted phone]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted email]");
}

function getGatewayDiagnostic(value: unknown, sensitiveValues: string[] = []) {
  let record = asErrorRecord(value);
  if (typeof value === "string") {
    try {
      record = asRecord(JSON.parse(value));
    } catch {
      record = null;
    }
  }

  const allowedFields = [
    "status",
    "code",
    "error_code",
    "errorCode",
    "failedreason",
    "failed_reason",
    "error_message",
    "err_msg",
    "message",
    "reason",
    "APIConnect",
    "api_connect",
  ];
  const summary: Record<string, string> = {};
  for (const key of allowedFields) {
    const field = record?.[key];
    if (typeof field === "string" || typeof field === "number") {
      const safeValue = safeDiagnosticText(String(field), sensitiveValues);
      if (safeValue) summary[key] = safeValue.slice(0, 500);
    }
  }
  return Object.keys(summary).length > 0 ? summary : undefined;
}

function logSslCommerzFailure(
  operation: string,
  error: unknown,
  response?: unknown,
  sensitiveValues: string[] = [],
) {
  const record = asErrorRecord(error);
  const responseRecord = asErrorRecord(record?.response);
  const statusValue = responseRecord?.status ?? record?.statusCode ?? record?.status;
  const httpStatus = typeof statusValue === "number"
    ? statusValue
    : typeof statusValue === "string" && /^\d{3}$/.test(statusValue)
      ? Number(statusValue)
      : undefined;
  const code = typeof record?.code === "string" ? record.code : undefined;
  const message = safeDiagnosticText(
    error instanceof Error ? error.message : String(error),
    sensitiveValues,
  );
  const gatewayResponse = getGatewayDiagnostic(
    response ?? responseRecord?.data ?? responseRecord?.body,
    sensitiveValues,
  );
  const lowerMessage = [
    message,
    ...Object.values(gatewayResponse ?? {}),
  ].join(" ").toLowerCase();
  let category = "unknown";
  if (lowerMessage.includes("timeout") || code === "ETIMEDOUT") {
    category = "timeout";
  } else if (
    httpStatus === 401
    || httpStatus === 403
    || /invalid (store|credential)|unauthori[sz]ed|authentication/.test(lowerMessage)
  ) {
    category = "authentication";
  } else if (/invalid|missing|required|validation/.test(lowerMessage)) {
    category = "validation";
  } else if (httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
    category = "request_rejected";
  } else if (httpStatus !== undefined && httpStatus >= 500) {
    category = "gateway";
  } else if (gatewayResponse?.status && gatewayResponse.status !== "SUCCESS") {
    category = "gateway_rejection";
  } else if (code || error instanceof TypeError) {
    category = "network";
  }

  console.error(JSON.stringify({
    event: "sslcommerz.request_failed",
    operation,
    category,
    environment: process.env.SSLCOMMERZ_IS_SANDBOX === "true"
      ? "sandbox"
      : process.env.SSLCOMMERZ_IS_SANDBOX === "false"
        ? "live"
        : "unset",
    httpStatus,
    code,
    errorName: error instanceof Error ? error.name : undefined,
    message,
    gatewayResponse,
  }));
}

export function logSslCommerzResponse(operation: string, response: unknown) {
  const gatewayResponse = getGatewayDiagnostic(response);
  console.info(JSON.stringify({
    event: "sslcommerz.response",
    operation,
    environment: process.env.SSLCOMMERZ_IS_SANDBOX === "true"
      ? "sandbox"
      : process.env.SSLCOMMERZ_IS_SANDBOX === "false"
        ? "live"
        : "unset",
    gatewayResponse,
  }));
}

async function callSdk<T>(
  operationName: string,
  operation: () => Promise<T>,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new SslCommerzError("SSLCommerz request timed out.")),
          15_000,
        );
      }),
    ]);
    // sslcommerz-lts@1.2.0 catches fetch errors and resolves with the Error.
    if (result instanceof Error) {
      throw new SslCommerzError("SSLCommerz SDK request failed.", { cause: result });
    }
    return result;
  } catch (error) {
    const diagnosticCause = error instanceof SslCommerzError && error.cause
      ? error.cause
      : error;
    logSslCommerzFailure(operationName, diagnosticCause);
    if (error instanceof SslCommerzError) throw error;
    throw new SslCommerzError("SSLCommerz request failed. Please try again.", {
      cause: error,
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function stringField(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function assertSdkResponse(value: unknown) {
  if (value instanceof Error) {
    throw new SslCommerzError("SSLCommerz SDK request failed.", { cause: value });
  }
  const record = asRecord(value);
  if (!record) {
    throw new SslCommerzError("SSLCommerz returned an invalid response.");
  }
  return record;
}

export async function initializeSslCommerzPayment(
  input: SslCommerzPaymentInput,
) {
  const { sdk, config } = getSdk();
  const siteUrl = getSslCommerzCallbackBaseUrl();
  const productCategory = "Electronics";
  const result = assertSdkResponse(await callSdk("initialize", () => sdk.init({
    total_amount: input.amount,
    currency: "BDT",
    tran_id: input.transactionId,
    success_url: `${siteUrl}/api/payment/sslcommerz/success`,
    fail_url: `${siteUrl}/api/payment/sslcommerz/fail`,
    cancel_url: `${siteUrl}/api/payment/sslcommerz/cancel`,
    ipn_url: `${siteUrl}/api/payment/sslcommerz/ipn`,
    shipping_method: "Courier",
    num_of_item: input.itemCount,
    cus_name: input.customer.name.slice(0, 50),
    cus_email: input.customer.email.slice(0, 50),
    cus_phone: input.customer.phone.slice(0, 20),
    cus_add1: input.customer.address.slice(0, 50),
    cus_city: input.customer.city.slice(0, 50),
    cus_state: input.customer.state.slice(0, 50),
    cus_postcode: input.customer.postalCode.slice(0, 30) || "0000",
    cus_country: input.customer.country.slice(0, 50),
    ship_name: input.customer.name.slice(0, 50),
    ship_add1: input.customer.address.slice(0, 50),
    ship_city: input.customer.city.slice(0, 50),
    ship_state: input.customer.state.slice(0, 50),
    ship_postcode: input.customer.postalCode.slice(0, 30) || "0000",
    ship_country: input.customer.country.slice(0, 50),
    product_name: input.productName.slice(0, 250),
    productcategory: productCategory,
    product_category: productCategory,
    product_profile: "general",
    ...(input.purpose === "COD_ADVANCE"
      ? { multi_card_name: "mobilebank" }
      : {}),
  })));

  if (stringField(result, "status") !== "SUCCESS") {
    logSslCommerzFailure(
      "initialize_response",
      new SslCommerzError("SSLCommerz rejected payment initialization."),
      result,
      Object.values(input.customer),
    );
    throw new SslCommerzError("SSLCommerz could not start this payment. Please retry.");
  }

  const gatewayUrl = stringField(result, "GatewayPageURL");
  let parsedGatewayUrl: URL;
  try {
    parsedGatewayUrl = new URL(gatewayUrl);
  } catch {
    logSslCommerzFailure(
      "initialize_response",
      new SslCommerzError("SSLCommerz returned an invalid payment URL."),
      result,
      Object.values(input.customer),
    );
    throw new SslCommerzError("SSLCommerz did not return a valid payment URL.");
  }
  const expectedHost = config.isLive
    ? "securepay.sslcommerz.com"
    : "sandbox.sslcommerz.com";
  if (
    parsedGatewayUrl.protocol !== "https:"
    || parsedGatewayUrl.hostname !== expectedHost
  ) {
    logSslCommerzFailure(
      "initialize_response",
      new SslCommerzError("SSLCommerz returned an unexpected payment URL."),
      result,
      Object.values(input.customer),
    );
    throw new SslCommerzError("SSLCommerz could not start this payment. Please retry.");
  }

  return {
    gatewayUrl: parsedGatewayUrl.toString(),
    sessionKey: stringField(result, "sessionkey") || null,
  };
}

export async function validateSslCommerzTransaction(validationId: string) {
  const { sdk } = getSdk();
  const result = assertSdkResponse(await callSdk("validate", () =>
    sdk.validate({ val_id: encodeURIComponent(validationId) }),
  ));
  logSslCommerzResponse("validate", result);

  return {
    status: stringField(result, "status"),
    transactionId: stringField(result, "tran_id"),
    validationId: stringField(result, "val_id"),
    amount: stringField(result, "amount"),
    currency: stringField(result, "currency"),
    storeId: stringField(result, "store_id"),
    riskLevel: stringField(result, "risk_level"),
    bankTransactionId: stringField(result, "bank_tran_id") || null,
    sessionKey: stringField(result, "sessionkey") || null,
  } satisfies SslCommerzValidation;
}

export async function querySslCommerzTransactionById(transactionId: string) {
  const { sdk } = getSdk();
  return callSdk("transaction_query_by_id", () =>
    sdk.transactionQueryByTransactionId({ tran_id: encodeURIComponent(transactionId) }),
  );
}

export async function querySslCommerzTransactionBySessionId(sessionKey: string) {
  const { sdk } = getSdk();
  return callSdk("transaction_query_by_session_id", () =>
    sdk.transactionQueryBySessionId({ sessionkey: encodeURIComponent(sessionKey) }),
  );
}

export async function initiateSslCommerzRefund(input: {
  amount: string;
  remarks: string;
  bankTransactionId: string;
  referenceId: string;
}) {
  const { sdk } = getSdk();
  return callSdk("initiate_refund", () => sdk.initiateRefund({
    refund_amount: input.amount,
    refund_remarks: encodeURIComponent(input.remarks),
    bank_tran_id: encodeURIComponent(input.bankTransactionId),
    refe_id: input.referenceId,
  }));
}

export async function querySslCommerzRefund(referenceId: string) {
  const { sdk } = getSdk();
  return callSdk("refund_query", () =>
    sdk.refundQuery({ refund_ref_id: encodeURIComponent(referenceId) }),
  );
}

export function readSslCommerzResponse(value: unknown) {
  if (value instanceof Error) {
    throw new SslCommerzError("SSLCommerz could not process the request.");
  }

  const pending: unknown[] = [value];
  const seen = new Set<object>();
  let statusRecord: Record<string, unknown> | null = null;
  while (pending.length > 0) {
    const current = pending.shift();
    const record = asRecord(current);
    if (record) {
      if (seen.has(record)) continue;
      seen.add(record);
      if (["tran_id", "val_id", "refund_ref_id", "GatewayPageURL"]
        .some((key) => key in record)) {
        return record;
      }
      if (!statusRecord && "status" in record) {
        statusRecord = record;
      }
      pending.push(...Object.values(record));
    } else if (Array.isArray(current)) {
      pending.push(...current);
    }
  }
  if (statusRecord) return statusRecord;
  throw new SslCommerzError("SSLCommerz returned an invalid response.");
}

export function getSslCommerzString(
  record: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = stringField(record, key);
    if (value) return value;
  }
  return "";
}
