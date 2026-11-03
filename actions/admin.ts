"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import {
  isOfficialCategorySlug,
  OFFICIAL_CATEGORY_SLUGS,
} from "@/lib/constants/categories";
import { isValidProductImageUrl } from "@/lib/validations/product";
import {
  getSslCommerzString,
  initiateSslCommerzRefund,
  querySslCommerzRefund,
  querySslCommerzTransactionById,
  querySslCommerzTransactionBySessionId,
  readSslCommerzResponse,
} from "@/lib/payments/sslcommerz";
import { processSslCommerzTransaction } from "@/lib/payments/sslcommerz-callback";
import { CURRENCY_CODE } from "@/lib/constants/commerce";

const localizedFieldsSchema = z.object({
  name: z.string().trim().max(200).optional(),
  shortDescription: z.string().trim().max(500).optional(),
  description: z.string().trim().max(5000).optional(),
}).strict();

const translationsSchema = z.object({
  bn: localizedFieldsSchema.optional(),
  ar: localizedFieldsSchema.optional(),
  hi: localizedFieldsSchema.optional(),
}).strict();

const orderStatusSchema = z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]);
const paymentIdSchema = z.string().trim().min(1).max(191);
const paymentQueryTypeSchema = z.enum(["transaction", "session"]);
const refundInputSchema = z.object({
  paymentId: paymentIdSchema,
  amount: z.string().trim().max(11).regex(/^\d+(?:\.\d{1,2})?$/),
  remarks: z.string().trim().min(3).max(100),
});

function parseTranslations(raw: unknown) {
  const text = typeof raw === "string" ? raw.trim() : "";
  let value: unknown = {};

  if (text) {
    try {
      value = JSON.parse(text);
    } catch {
      throw new Error("Translations must be valid JSON.");
    }
  }

  const parsed = translationsSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation content.");
  }

  return parsed.data;
}

export type ProductActionState = {
  status: "idle" | "success" | "error";
  sku?: string;
  error?: "invalidProduct" | "invalidCategory" | "invalidImageUrl" | "missingPrimaryImage" | "duplicate";
};

const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryId: z.string().trim().min(1),
  price: z.coerce.number().finite().positive(),
  discountPrice: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.number().finite().positive().nullable(),
  ),
  stockQuantity: z.coerce.number().int().nonnegative(),
  shortDescription: z.string().trim().max(500),
  description: z.string().trim().max(5000),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  isNewArrival: z.boolean(),
}).refine(
  (product) => product.discountPrice === null || product.discountPrice < product.price,
  { path: ["discountPrice"] },
);

type ProductImageInput = Array<{
  url: string;
  sortOrder: number;
  isPrimary: boolean;
}>;

function revalidateCatalogPaths(...slugs: string[]) {
  revalidatePath("/", "layout");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/admin/products");
  for (const slug of new Set(slugs.filter(Boolean))) {
    revalidatePath(`/product/${slug}`);
  }
}

function getProductFormInput(formData: FormData):
  | { error: NonNullable<ProductActionState["error"]> }
  | { data: z.infer<typeof productSchema>; images: ProductImageInput } {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId"),
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice"),
    stockQuantity: formData.get("stockQuantity"),
    shortDescription: formData.get("shortDescription") ?? "",
    description: formData.get("description") ?? "",
    isPublished: formData.get("isPublished") === "true",
    isFeatured: formData.get("isFeatured") === "true",
    isNewArrival: formData.get("isNewArrival") === "true",
  });

  if (!parsed.success) {
    return { error: "invalidProduct" };
  }

  const rawImageUrls = formData.getAll("imageUrl").map((value) =>
    typeof value === "string" ? value.trim() : "",
  );
  if (!rawImageUrls[0]) {
    return { error: "invalidImageUrl" };
  }

  const imageEntries = rawImageUrls
    .map((url, originalIndex) => ({ url, originalIndex }))
    .filter(({ url }) => url.length > 0);
  if (imageEntries.some(({ url }) => !isValidProductImageUrl(url))) {
    return { error: "invalidImageUrl" };
  }

  const rawPrimaryImageIndex = formData.get("primaryImageIndex");
  if (typeof rawPrimaryImageIndex !== "string" || rawPrimaryImageIndex === "") {
    return { error: "missingPrimaryImage" };
  }
  const primaryImageIndex = Number(rawPrimaryImageIndex);
  if (!imageEntries.some(({ originalIndex }) => originalIndex === primaryImageIndex)) {
    return { error: "missingPrimaryImage" };
  }

  return {
    data: parsed.data,
    images: imageEntries.map(({ url, originalIndex }, sortOrder) => ({
      url,
      sortOrder,
      isPrimary: originalIndex === primaryImageIndex,
    })),
  };
}

function toProductImageCreateData(images: ProductImageInput) {
  return images.map(({ url, sortOrder, isPrimary }) => ({ url, sortOrder, isPrimary }));
}

function getPrismaActionError(error: unknown): ProductActionState {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { status: "error", error: "duplicate" };
  }

  throw error;
}

export async function createProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const input = getProductFormInput(formData);
  if ("error" in input) {
    return { status: "error", error: input.error };
  }

  const category = await prisma.category.findFirst({
    where: {
      id: input.data.categoryId,
      isActive: true,
      slug: { in: [...OFFICIAL_CATEGORY_SLUGS] },
    },
    select: { id: true },
  });
  if (!category) {
    return { status: "error", error: "invalidCategory" };
  }

  let sku: string;
  try {
    const { data, images } = input;
    sku = await prisma.$transaction(async (tx) => {
      const counter = await tx.productSkuCounter.update({
        where: { id: "product" },
        data: { lastValue: { increment: 1 } },
      });
      const generatedSku = `VIS-772-${counter.lastValue}`;

      await tx.product.create({
        data: {
          name: data.name,
          slug: data.slug,
          sku: generatedSku,
          categoryId: data.categoryId,
          price: data.price,
          discountPrice: data.discountPrice,
          stockQuantity: data.stockQuantity,
          shortDescription: data.shortDescription || null,
          description: data.description || null,
          isPublished: data.isPublished,
          isFeatured: data.isFeatured,
          isNewArrival: data.isNewArrival,
          images: { create: toProductImageCreateData(images) },
        },
      });

      return generatedSku;
    });
  } catch (error) {
    return getPrismaActionError(error);
  }

  revalidateCatalogPaths(input.data.slug);
  return { status: "success", sku };
}

export async function updateProduct(
  _previousState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { status: "error", error: "invalidProduct" };
  }

  const input = getProductFormInput(formData);
  if ("error" in input) {
    return { status: "error", error: input.error };
  }

  const category = await prisma.category.findFirst({
    where: {
      id: input.data.categoryId,
      isActive: true,
      slug: { in: [...OFFICIAL_CATEGORY_SLUGS] },
    },
    select: { id: true },
  });
  if (!category) {
    return { status: "error", error: "invalidCategory" };
  }

  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!existing) {
    return { status: "error", error: "invalidProduct" };
  }

  try {
    const { data, images } = input;
    await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        slug: data.slug,
        categoryId: data.categoryId,
        price: data.price,
        discountPrice: data.discountPrice,
        stockQuantity: data.stockQuantity,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        isNewArrival: data.isNewArrival,
        images: {
          deleteMany: {},
          create: toProductImageCreateData(images),
        },
      },
    });
  } catch (error) {
    return getPrismaActionError(error);
  }

  revalidateCatalogPaths(existing.slug, input.data.slug);
  return { status: "success" };
}

export async function updateProductTranslations(productId: string, raw: string) {
  await requireAdmin();

  if (!productId.trim()) {
    throw new Error("Product ID is required.");
  }

  await prisma.product.update({
    where: { id: productId },
    data: { translations: parseTranslations(raw) },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function updateCategoryTranslations(categoryId: string, raw: string) {
  await requireAdmin();

  if (!categoryId.trim()) {
    throw new Error("Category ID is required.");
  }

  const updated = await prisma.category.updateMany({
    where: {
      id: categoryId,
      isActive: true,
      slug: { in: [...OFFICIAL_CATEGORY_SLUGS] },
    },
    data: { translations: parseTranslations(raw) },
  });
  if (updated.count !== 1) {
    throw new Error("Official category not found.");
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/categories");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function promoteUserToAdmin(formData: FormData) {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  revalidatePath("/admin/customers");
  return { success: true };
}

export async function toggleProductPublished(productId: string, published: boolean) {
  await requireAdmin();

  if (published) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        category: {
          isActive: true,
          slug: { in: [...OFFICIAL_CATEGORY_SLUGS] },
        },
      },
      select: { id: true },
    });
    if (!product) {
      throw new Error("Assign this product to an official category before publishing.");
    }
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isPublished: published },
    select: { slug: true },
  });

  revalidateCatalogPaths(product.slug);
  return { success: true };
}

export async function toggleProductFeatured(productId: string, featured: boolean) {
  await requireAdmin();

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isFeatured: featured },
    select: { slug: true },
  });

  revalidateCatalogPaths(product.slug);
  return { success: true };
}

export async function toggleProductArrival(productId: string, isNew: boolean) {
  await requireAdmin();

  const product = await prisma.product.update({
    where: { id: productId },
    data: { isNewArrival: isNew },
    select: { slug: true },
  });

  revalidateCatalogPaths(product.slug);
  return { success: true };
}

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();

  const parsed = orderStatusSchema.safeParse(status);

  if (!parsed.success) {
    throw new Error("Invalid order status.");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: parsed.data },
  });

  revalidatePath("/admin/orders");
  return { success: true };
}

export async function markCodRemainderPaid(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: {
        select: { purpose: true, method: true, status: true },
      },
    },
  });
  if (!order || order.paymentMethod !== "COD") {
    throw new Error("COD order not found.");
  }

  if (
    order.advanceAmount.gt(0)
    && !order.payments.some((payment) =>
      payment.purpose === "COD_ADVANCE"
      && payment.method === "SSL_COMMERZ"
      && payment.status === "PAID",
    )
  ) {
    throw new Error("The COD advance must be verified before closing the remaining balance.");
  }

  const result = await prisma.payment.updateMany({
    where: {
      orderId,
      method: "COD",
      purpose: "COD_REMAINDER",
      status: "PENDING",
    },
    data: {
      status: "PAID",
      providerStatus: "COLLECTED_ON_DELIVERY",
      verifiedAt: new Date(),
    },
  });
  if (result.count !== 1) {
    throw new Error("The COD balance is already paid or unavailable.");
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function querySslCommerzPayment(
  paymentId: string,
  queryType: "transaction" | "session",
) {
  await requireAdmin();
  const parsedId = paymentIdSchema.safeParse(paymentId);
  const parsedQueryType = paymentQueryTypeSchema.safeParse(queryType);
  if (!parsedId.success || !parsedQueryType.success) {
    throw new Error("Payment not found.");
  }

  const payment = await prisma.payment.findFirst({
    where: { id: parsedId.data, method: "SSL_COMMERZ" },
    select: { id: true, transactionId: true, sessionKey: true },
  });
  if (!payment) {
    throw new Error("SSLCommerz payment not found.");
  }

  const raw = parsedQueryType.data === "transaction"
    ? payment.transactionId
      ? await querySslCommerzTransactionById(payment.transactionId)
      : null
    : payment.sessionKey
      ? await querySslCommerzTransactionBySessionId(payment.sessionKey)
      : null;
  if (!raw) {
    throw new Error(parsedQueryType.data === "session"
      ? "No SSLCommerz session is recorded for this payment."
      : "No SSLCommerz transaction ID is recorded for this payment.");
  }

  const response = readSslCommerzResponse(raw);
  const gatewayTransactionId = getSslCommerzString(response, "tran_id");
  if (gatewayTransactionId && gatewayTransactionId !== payment.transactionId) {
    throw new Error("SSLCommerz returned a transaction that does not match this payment.");
  }

  const validationId = getSslCommerzString(response, "val_id");
  const gatewayStatus = getSslCommerzString(response, "status", "APIConnect") || "UNKNOWN";
  let verified = false;
  if (validationId && payment.transactionId) {
    const result = await processSslCommerzTransaction(payment.transactionId, validationId);
    verified = result.verified;
  }
  if (!verified) {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: { in: ["PENDING", "FAILED"] } },
      data: { providerStatus: gatewayStatus },
    });
  }

  revalidatePath("/admin/orders");
  return {
    success: true,
    verified,
    status: gatewayStatus,
  };
}

export async function initiatePaymentRefund(
  paymentId: string,
  amount: string,
  remarks: string,
) {
  await requireAdmin();
  const parsed = refundInputSchema.safeParse({ paymentId, amount, remarks });
  if (!parsed.success) {
    throw new Error("Enter a valid refund amount and reason.");
  }

  const refundAmount = new Prisma.Decimal(parsed.data.amount);
  if (refundAmount.lte(0)) {
    throw new Error("Refund amount must be greater than zero.");
  }

  const refund = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: parsed.data.paymentId,
        method: "SSL_COMMERZ",
        status: "PAID",
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        bankTransactionId: true,
      },
    });
    if (!payment?.bankTransactionId || payment.currency !== CURRENCY_CODE) {
      throw new Error("This payment is not eligible for an SSLCommerz refund.");
    }

    const previousRefunds = await tx.paymentRefund.aggregate({
      where: {
        paymentId: payment.id,
        status: { in: ["PENDING", "SUCCESS"] },
      },
      _sum: { amount: true },
    });
    const alreadyReserved = previousRefunds._sum.amount ?? new Prisma.Decimal(0);
    if (alreadyReserved.plus(refundAmount).gt(payment.amount)) {
      throw new Error("Refund amount exceeds the remaining refundable balance.");
    }

    return tx.paymentRefund.create({
      data: {
        paymentId: payment.id,
        referenceId: `VRF${randomBytes(12).toString("hex")}`,
        amount: refundAmount,
        currency: payment.currency,
        remarks: parsed.data.remarks,
      },
      select: {
        id: true,
        referenceId: true,
        amount: true,
        currency: true,
        remarks: true,
        payment: { select: { bankTransactionId: true } },
      },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 15_000,
  });

  const bankTransactionId = refund.payment.bankTransactionId;
  if (!bankTransactionId) {
    throw new Error("This payment does not have a confirmed bank transaction ID.");
  }

  try {
    const raw = await initiateSslCommerzRefund({
      amount: refund.amount.toFixed(2),
      remarks: refund.remarks,
      bankTransactionId,
      referenceId: refund.referenceId,
    });
    const response = readSslCommerzResponse(raw);
    const providerStatus = getSslCommerzString(response, "status", "APIConnect") || "PENDING";
    const gatewayReference =
      getSslCommerzString(response, "refund_ref_id", "ref_id")
      || refund.referenceId;
    await prisma.paymentRefund.update({
      where: { id: refund.id },
      data: {
        providerReference: gatewayReference,
        providerStatus,
        status: ["FAILED", "FAIL", "REJECTED"].includes(providerStatus.toUpperCase())
          ? "FAILED"
          : "PENDING",
      },
    });
  } catch {
    await prisma.paymentRefund.update({
      where: { id: refund.id },
      data: { providerStatus: "INITIATION_UNCONFIRMED" },
    });
    revalidatePath("/admin/orders");
    throw new Error("The refund request could not be confirmed. Check its status before trying again.");
  }

  revalidatePath("/admin/orders");
  return { success: true, refundId: refund.id };
}

export async function queryPaymentRefund(refundId: string) {
  await requireAdmin();
  const parsedId = paymentIdSchema.safeParse(refundId);
  if (!parsedId.success) {
    throw new Error("Refund not found.");
  }

  const refund = await prisma.paymentRefund.findUnique({
    where: { id: parsedId.data },
    select: { id: true, referenceId: true, providerReference: true, paymentId: true },
  });
  if (!refund) {
    throw new Error("Refund not found.");
  }

  const raw = await querySslCommerzRefund(refund.providerReference ?? refund.referenceId);
  const response = readSslCommerzResponse(raw);
  const gatewayReference = getSslCommerzString(response, "refund_ref_id", "ref_id");
  const status = getSslCommerzString(response, "status", "APIConnect");
  if (
    gatewayReference
    && refund.providerReference
    && refund.providerReference !== refund.referenceId
    && gatewayReference !== refund.providerReference
  ) {
    throw new Error("SSLCommerz returned a different refund reference.");
  }
  const normalizedStatus = status.toUpperCase();
  const refundStatus = ["SUCCESS", "SUCCESSFUL", "REFUNDED"].includes(normalizedStatus)
    ? "SUCCESS"
    : ["FAILED", "FAIL", "REJECTED", "CANCELLED"].includes(normalizedStatus)
      ? "FAILED"
      : "PENDING";

  await prisma.$transaction(async (tx) => {
    const existing = await tx.paymentRefund.findUnique({
      where: { id: refund.id },
      select: { status: true },
    });
    if (!existing) {
      throw new Error("Refund not found.");
    }
    const finalStatus = existing.status === "SUCCESS"
      || (existing.status === "FAILED" && refundStatus === "PENDING")
      ? existing.status
      : refundStatus;

    await tx.paymentRefund.update({
      where: { id: refund.id },
      data: {
        providerReference: gatewayReference || refund.providerReference,
        providerStatus: status || "UNKNOWN",
        status: finalStatus,
        checkedAt: new Date(),
      },
    });

    if (finalStatus === "SUCCESS") {
      const payment = await tx.payment.findUnique({
        where: { id: refund.paymentId },
        select: { amount: true },
      });
      if (!payment) {
        throw new Error("Refund payment not found.");
      }

      const completedRefunds = await tx.paymentRefund.aggregate({
        where: { paymentId: refund.paymentId, status: "SUCCESS" },
        _sum: { amount: true },
      });
      if ((completedRefunds._sum.amount ?? new Prisma.Decimal(0)).gte(payment.amount)) {
        await tx.payment.update({
          where: { id: refund.paymentId },
          data: { status: "REFUNDED" },
        });
      }
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 15_000,
  });

  revalidatePath("/admin/orders");
  return { success: true, status: refundStatus };
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { slug: true, isActive: true },
  });
  if (!category) {
    throw new Error("Category not found.");
  }
  if (category.isActive || isOfficialCategorySlug(category.slug)) {
    throw new Error("Official categories cannot be deleted.");
  }

  const productCount = await prisma.product.count({ where: { categoryId } });

  if (productCount > 0) {
    throw new Error("This category still has products attached. Reassign or remove them before deleting the category.");
  }

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin/categories");
  return { success: true };
}

export async function deleteProduct(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!product) {
    throw new Error("Product not found.");
  }

  await prisma.product.delete({ where: { id: productId } });

  revalidateCatalogPaths(product.slug);
  return { success: true };
}

export async function updateCouponStatus(couponId: string, isActive: boolean) {
  await requireAdmin();

  await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive },
  });

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(couponId: string) {
  await requireAdmin();

  await prisma.coupon.delete({ where: { id: couponId } });

  revalidatePath("/admin/coupons");
  return { success: true };
}
