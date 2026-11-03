"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isOfficialCategorySlug,
  OFFICIAL_CATEGORY_SLUGS,
} from "@/lib/constants/categories";
import {
  CURRENCY_CODE,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from "@/lib/constants/commerce";
import { getLocale, getLocalizedText } from "@/lib/i18n";
import {
  initializeSslCommerzPayment,
  isSslCommerzConfigured,
  SslCommerzError,
} from "@/lib/payments/sslcommerz";

const purchaseSchema = z.object({
  productId: z.string().trim().min(1).max(191),
  quantity: z.coerce.number().int().min(1).max(99),
  variantId: z.string().trim().min(1).max(191).optional(),
});

const shippingSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  addressLine: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().max(120),
  postalCode: z.string().trim().max(24),
  country: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(1000),
});

const cartLineSchema = z.object({
  cartItemId: z.string().trim().min(1).max(191),
  quantity: z.coerce.number().int().min(1).max(99),
});

const checkoutPaymentMethodSchema = z.enum(["COD", "SSL_COMMERZ"]);

function createTransactionId() {
  return `VIS${randomBytes(12).toString("hex")}`;
}

function getCodAdvance(shippingFee: Prisma.Decimal) {
  const zero = new Prisma.Decimal(0);
  const fixedAdvance = new Prisma.Decimal(50);
  const advanceAmount = shippingFee.isZero() ? zero : fixedAdvance;
  const advanceAppliedToShipping = Prisma.Decimal.min(fixedAdvance, shippingFee);

  return { advanceAmount, advanceAppliedToShipping };
}

async function createSslPaymentAttempt(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, userId, status: "PENDING" },
      include: {
        payments: {
          where: { method: "SSL_COMMERZ" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    if (!order) {
      throw new Error("This order is no longer available for payment.");
    }

    const latestPayment = order.payments[0];
    if (latestPayment?.status === "PENDING") {
      return latestPayment;
    }

    const amount = order.paymentMethod === "SSL_COMMERZ"
      ? order.totalAmount
      : order.advanceAmount;
    if (amount.lte(0)) {
      throw new Error("No online payment is required for this order.");
    }

    return tx.payment.create({
      data: {
        orderId: order.id,
        method: "SSL_COMMERZ",
        purpose: order.paymentMethod === "COD" ? "COD_ADVANCE" : "FULL_ORDER",
        status: "PENDING",
        amount,
        currency: CURRENCY_CODE,
        transactionId: createTransactionId(),
        provider: "SSLCOMMERZ",
      },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 15_000,
  });
}

async function startSslPayment(paymentId: string, userId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      order: { is: { userId } },
    },
    include: {
      order: {
        include: {
          items: { select: { productName: true, quantity: true } },
          shippingAddress: true,
        },
      },
    },
  });
  if (!payment || !payment.order.shippingAddress || !payment.transactionId) {
    throw new Error("This payment could not be found.");
  }
  if (payment.status !== "PENDING") {
    throw new Error("This payment is no longer pending.");
  }
  if (payment.gatewayUrl) {
    return payment.gatewayUrl;
  }

  const staleInitializationBefore = new Date(Date.now() - 60_000);
  const claimed = await prisma.payment.updateMany({
    where: {
      id: payment.id,
      status: "PENDING",
      gatewayUrl: null,
      OR: [
        { providerStatus: null },
        {
          providerStatus: "SESSION_INITIATING",
          updatedAt: { lt: staleInitializationBefore },
        },
      ],
    },
    data: { providerStatus: "SESSION_INITIATING" },
  });
  if (claimed.count !== 1) {
    const currentPayment = await prisma.payment.findUnique({
      where: { id: payment.id },
      select: { status: true, gatewayUrl: true },
    });
    if (currentPayment?.status === "PENDING" && currentPayment.gatewayUrl) {
      return currentPayment.gatewayUrl;
    }
    throw new Error("Payment setup is already in progress. Please wait and try again.");
  }

  const address = payment.order.shippingAddress;
  try {
    const gatewaySession = await initializeSslCommerzPayment({
      transactionId: payment.transactionId,
      amount: payment.amount.toFixed(2),
      purpose: payment.purpose === "COD_ADVANCE" ? "COD_ADVANCE" : "FULL_ORDER",
      orderNumber: payment.order.orderNumber,
      productName: payment.order.items.map((item) => item.productName).join(", "),
      itemCount: payment.order.items.reduce((sum, item) => sum + item.quantity, 0),
      customer: {
        name: address.fullName,
        email: (await prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        }))?.email ?? "",
        phone: address.phone,
        address: address.addressLine,
        city: address.city,
        state: address.state ?? "",
        postalCode: address.postalCode ?? "",
        country: address.country,
      },
    });

    const savedSession = await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
        providerStatus: "SESSION_INITIATING",
        gatewayUrl: null,
      },
      data: {
        gatewayUrl: gatewaySession.gatewayUrl,
        sessionKey: gatewaySession.sessionKey,
        providerStatus: "SESSION_CREATED",
      },
    });
    if (savedSession.count !== 1) {
      throw new Error("Could not save the SSLCommerz session.");
    }

    return gatewaySession.gatewayUrl;
  } catch (error) {
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
        providerStatus: "SESSION_INITIATING",
        gatewayUrl: null,
      },
      data: { status: "FAILED", providerStatus: "INIT_FAILED" },
    });
    throw error;
  }
}

export type AddToCartErrorCode =
  | "auth_required"
  | "invalid_request"
  | "invalid_quantity"
  | "product_not_found"
  | "product_unavailable"
  | "variant_unavailable"
  | "variant_required"
  | "out_of_stock"
  | "insufficient_stock"
  | "internal_error";

export type AddToCartResult =
  | { success: true; count: number }
  | { success: false; error: AddToCartErrorCode };

class CartActionError extends Error {
  constructor(
    readonly code: AddToCartErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "CartActionError";
  }
}

async function getCartQuantity(tx: Prisma.TransactionClient, userId: string) {
  const result = await tx.cartItem.aggregate({
    where: {
      cart: { is: { userId } },
      product: {
        is: {
          isPublished: true,
          category: {
            is: {
              isActive: true,
              slug: { in: OFFICIAL_CATEGORY_SLUGS },
            },
          },
        },
      },
    },
    _sum: { quantity: true },
  });

  return result._sum.quantity ?? 0;
}

async function validatePurchase(
  tx: Prisma.TransactionClient,
  input: z.infer<typeof purchaseSchema>,
) {
  const product = await tx.product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      isPublished: true,
      stockQuantity: true,
      category: { select: { isActive: true, slug: true } },
      variants: { select: { id: true, stock: true } },
    },
  });

  if (!product) {
    throw new CartActionError("product_not_found", "Product not found.");
  }
  if (!product.isPublished || !product.category.isActive || !isOfficialCategorySlug(product.category.slug)) {
    throw new CartActionError("product_unavailable", "This product is unavailable.");
  }

  const variant = input.variantId
    ? product.variants.find((candidate) => candidate.id === input.variantId)
    : undefined;

  if (input.variantId && !variant) {
    throw new CartActionError("variant_unavailable", "The selected product option is unavailable.");
  }

  if (product.variants.length > 0 && !variant) {
    throw new CartActionError("variant_required", "Choose a product option before continuing.");
  }

  const available = variant?.stock ?? product.stockQuantity;
  if (available < input.quantity) {
    throw new CartActionError(
      available === 0 ? "out_of_stock" : "insufficient_stock",
      available === 0
        ? "This product is out of stock."
        : `Only ${available} item${available === 1 ? "" : "s"} available.`,
    );
  }

  return { product, variant };
}

async function addToCartTransaction(
  userId: string,
  input: z.infer<typeof purchaseSchema>,
) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const { product, variant } = await validatePurchase(tx, input);
        const cart = await tx.cart.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });
        const variantKey = variant?.id ?? "";
        const existing = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: product.id,
            variantId: variant?.id ?? null,
            variantKey,
          },
        });

        if (existing && existing.quantity + input.quantity > (variant?.stock ?? product.stockQuantity)) {
          throw new CartActionError(
            "insufficient_stock",
            "The requested quantity exceeds the available stock.",
          );
        }

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: { increment: input.quantity } },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              variantId: variant?.id ?? null,
              variantKey,
              quantity: input.quantity,
            },
          });
        }

        return getCartQuantity(tx, userId);
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 15_000,
      });
    } catch (error) {
      const isRetryableConflict =
        error instanceof Prisma.PrismaClientKnownRequestError
        && (error.code === "P2002" || error.code === "P2034");
      if (!isRetryableConflict || attempt >= 2) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1)));
    }
  }
}

export async function addToCart(
  productId: string,
  quantity = 1,
  variantId?: string,
): Promise<AddToCartResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, error: "auth_required" };
  }

  const parsed = purchaseSchema.safeParse({ productId, quantity, variantId });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.some((issue) => issue.path[0] === "quantity")
        ? "invalid_quantity"
        : "invalid_request",
    };
  }

  const userId = session.user.id;
  let count: number;
  try {
    count = await addToCartTransaction(userId, parsed.data);
  } catch (error) {
    if (error instanceof CartActionError) {
      return { success: false, error: error.code };
    }

    console.error("Failed to add product to cart.", error);
    return { success: false, error: "internal_error" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/cart");
  return { success: true, count };
}

export async function createBuyNowIntent(
  productId: string,
  quantity = 1,
  variantId?: string,
) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = purchaseSchema.safeParse({ productId, quantity, variantId });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid purchase request.");
  }

  const { product, variant } = await prisma.$transaction(async (tx) =>
    validatePurchase(tx, parsed.data),
  );
  const intent = await prisma.checkoutIntent.create({
    data: {
      userId: session.user.id,
      productId: product.id,
      variantId: variant?.id ?? null,
      quantity: parsed.data.quantity,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return { success: true, intentId: intent.id };
}

export async function updateCartItem(cartItemId: string, quantity: number) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = cartLineSchema.safeParse({ cartItemId, quantity });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid cart quantity.");
  }

  const userId = session.user.id;
  const count = await prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new Error("Your cart is empty.");
    }

    const item = await tx.cartItem.findFirst({
      where: { id: parsed.data.cartItemId, cartId: cart.id },
      include: { product: { include: { category: true } }, variant: true },
    });
    if (!item) {
      throw new Error("This product is no longer in your cart.");
    }

    const stock = item.variant?.stock ?? item.product.stockQuantity;
    if (
      !item.product.isPublished
      || !item.product.category.isActive
      || !isOfficialCategorySlug(item.product.category.slug)
      || parsed.data.quantity > stock
    ) {
      throw new Error("The requested quantity exceeds the available stock.");
    }

    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity: parsed.data.quantity },
    });

    return getCartQuantity(tx, userId);
  });

  revalidatePath("/", "layout");
  revalidatePath("/cart");
  return { success: true, count };
}

export async function removeCartItem(cartItemId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedId = z.string().trim().min(1).max(191).safeParse(cartItemId);
  if (!parsedId.success) {
    throw new Error("Invalid cart item.");
  }

  const userId = session.user.id;
  const cart = await prisma.cart.findUnique({ where: { userId } });

  if (!cart) {
    return { success: false };
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, id: parsedId.data },
  });
  const count = await prisma.$transaction((tx) => getCartQuantity(tx, userId));

  revalidatePath("/", "layout");
  revalidatePath("/cart");
  return { success: true, count };
}

export async function toggleWishlist(productId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedProductId = z.string().trim().min(1).max(191).safeParse(productId);
  if (!parsedProductId.success) {
    throw new Error("Invalid product.");
  }

  const userId = session.user.id;
  const wishlist = await prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId: parsedProductId.data,
      },
    },
  });

  if (existing) {
    await prisma.wishlistItem.delete({
      where: {
        id: existing.id,
      },
    });
  } else {
    const product = await prisma.product.findFirst({
      where: {
        id: parsedProductId.data,
        isPublished: true,
        category: {
          isActive: true,
          slug: { in: [...OFFICIAL_CATEGORY_SLUGS] },
        },
      },
      select: { id: true },
    });
    if (!product) {
      throw new Error("This product is unavailable.");
    }

    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: parsedProductId.data,
      },
    });
  }

  revalidatePath("/wishlist");
  return { success: true };
}

export async function createOrderFromCart(input: {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
}, intentId?: string, requestedPaymentMethod = "COD") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsedAddress = shippingSchema.safeParse({
    ...input,
    country: input.country || "Bangladesh",
    notes: input.notes ?? "",
  });
  if (!parsedAddress.success) {
    throw new Error(parsedAddress.error.issues[0]?.message ?? "Invalid shipping details.");
  }
  const parsedPaymentMethod = checkoutPaymentMethodSchema.safeParse(requestedPaymentMethod);
  if (!parsedPaymentMethod.success) {
    throw new Error("Choose a valid payment method.");
  }

  const userId = session.user.id;
  const locale = await getLocale();
  const addressInput = parsedAddress.data;
  const paymentMethod = parsedPaymentMethod.data;
  const order = await prisma.$transaction(async (tx) => {
    if (intentId) {
      const existingOrder = await tx.order.findFirst({
        where: { checkoutIntentId: intentId, userId },
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" } },
          shippingAddress: true,
        },
      });
      if (existingOrder) {
        return existingOrder;
      }
    }

    let orderItems: Array<{
      productId: string;
      variantId: string | null;
      variantName: string | null;
      variantValue: string | null;
      productName: string;
      productSlug: string;
      unitPrice: Prisma.Decimal;
      quantity: number;
      total: Prisma.Decimal;
    }>;
    let cartId: string | undefined;

    if (intentId) {
      const intent = await tx.checkoutIntent.findFirst({
        where: {
          id: intentId,
          userId,
          expiresAt: { gt: new Date() },
          order: null,
        },
        include: { product: { include: { category: true } }, variant: true },
      });
      if (
        !intent
        || !intent.product.isPublished
        || !intent.product.category.isActive
        || !isOfficialCategorySlug(intent.product.category.slug)
      ) {
        throw new Error("This Buy Now checkout has expired or is no longer available.");
      }

      const stock = intent.variant?.stock ?? intent.product.stockQuantity;
      if (stock < intent.quantity) {
        throw new Error("The selected product no longer has enough stock.");
      }

      orderItems = [{
        productId: intent.productId,
        variantId: intent.variantId,
        variantName: intent.variant?.name ?? null,
        variantValue: intent.variant?.value ?? null,
        productName: getLocalizedText(
          intent.product.translations,
          locale,
          "name",
          intent.product.name,
        ),
        productSlug: intent.product.slug,
        unitPrice: new Prisma.Decimal(
          intent.variant?.price ?? intent.product.discountPrice ?? intent.product.price,
        ),
        quantity: intent.quantity,
        total: new Prisma.Decimal(
          intent.variant?.price ?? intent.product.discountPrice ?? intent.product.price,
        ).mul(intent.quantity),
      }];
    } else {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: { include: { variants: { select: { id: true } }, category: true } },
              variant: true,
            },
          },
        },
      });
      const availableCartItems = cart?.items.filter((item) =>
        item.product.isPublished
        && item.product.category.isActive
        && isOfficialCategorySlug(item.product.category.slug),
      ) ?? [];
      if (!cart || availableCartItems.length === 0) {
        throw new Error("Your cart is empty.");
      }
      cartId = cart.id;
      orderItems = availableCartItems.map((item) => {
        if (item.product.variants.length > 0 && !item.variant) {
          throw new Error(`Choose an option for ${item.product.name} before checking out.`);
        }
        const unitPrice = new Prisma.Decimal(
          item.variant?.price ?? item.product.discountPrice ?? item.product.price,
        );
        return {
          productId: item.productId,
          variantId: item.variantId,
          variantName: item.variant?.name ?? null,
          variantValue: item.variant?.value ?? null,
          productName: getLocalizedText(
            item.product.translations,
            locale,
            "name",
            item.product.name,
          ),
          productSlug: item.product.slug,
          unitPrice,
          quantity: item.quantity,
          total: unitPrice.mul(item.quantity),
        };
      });
    }

    for (const item of orderItems) {
      const updated = item.variantId
        ? await tx.productVariant.updateMany({
            where: {
              id: item.variantId,
              productId: item.productId,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          })
        : await tx.product.updateMany({
            where: {
              id: item.productId,
              isPublished: true,
              stockQuantity: { gte: item.quantity },
            },
            data: { stockQuantity: { decrement: item.quantity } },
          });
      if (updated.count !== 1) {
        throw new Error(`${item.productName} no longer has enough stock.`);
      }
    }

    const subtotal = orderItems.reduce(
      (sum, item) => sum.plus(item.total),
      new Prisma.Decimal(0),
    );
    const shippingFee = subtotal.gte(FREE_SHIPPING_THRESHOLD)
      ? new Prisma.Decimal(0)
      : new Prisma.Decimal(STANDARD_SHIPPING_FEE);
    const totalAmount = subtotal.plus(shippingFee);
    if (paymentMethod === "SSL_COMMERZ" && totalAmount.lessThan(10)) {
      throw new Error("SSLCommerz requires an online payment of at least ৳10.");
    }

    const { advanceAmount, advanceAppliedToShipping } = getCodAdvance(shippingFee);
    const onlineAmount = paymentMethod === "SSL_COMMERZ"
      ? totalAmount
      : advanceAmount;
    if (onlineAmount.gt(0) && !isSslCommerzConfigured()) {
      throw new SslCommerzError(
        "SSLCommerz is not configured. Add the merchant credentials and public site URL to your server environment.",
      );
    }

    const address = await tx.address.create({
      data: {
        userId,
        fullName: addressInput.fullName,
        phone: addressInput.phone,
        addressLine: addressInput.addressLine,
        city: addressInput.city,
        state: addressInput.state || null,
        postalCode: addressInput.postalCode || null,
        country: addressInput.country,
        isDefault: true,
      },
    });

    const createdOrder = await tx.order.create({
      data: {
        userId,
        addressId: address.id,
        checkoutIntentId: intentId ?? null,
        orderNumber: `VIS-${Date.now()}-${randomUUID().slice(0, 8)}`,
        paymentMethod,
        subtotal,
        shippingFee,
        currency: CURRENCY_CODE,
        totalAmount,
        advanceAmount,
        advanceAppliedToShipping,
        remainingCodAmount: paymentMethod === "COD"
          ? totalAmount.minus(advanceAmount)
          : new Prisma.Decimal(0),
        notes: addressInput.notes || null,
        status: paymentMethod === "COD" && advanceAmount.isZero()
          ? "PROCESSING"
          : "PENDING",
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            variantName: item.variantName,
            variantValue: item.variantValue,
            productName: item.productName,
            productSlug: item.productSlug,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.total,
          })),
        },
        payments: {
          create: [
            {
              method: onlineAmount.gt(0) ? "SSL_COMMERZ" : "COD",
              purpose: paymentMethod === "SSL_COMMERZ"
                ? "FULL_ORDER"
                : advanceAmount.gt(0)
                  ? "COD_ADVANCE"
                  : "COD_REMAINDER",
              status: "PENDING",
              amount: onlineAmount.gt(0) ? onlineAmount : totalAmount,
              currency: CURRENCY_CODE,
              ...(onlineAmount.gt(0)
                ? {
                    transactionId: createTransactionId(),
                    provider: "SSLCOMMERZ",
                  }
                : {}),
            },
            ...(paymentMethod === "COD" && advanceAmount.gt(0)
              ? [{
                  method: "COD" as const,
                  purpose: "COD_REMAINDER" as const,
                  status: "PENDING" as const,
                  amount: totalAmount.minus(advanceAmount),
                  currency: CURRENCY_CODE,
                }]
              : []),
          ],
        },
      },
      include: {
        items: true,
        payments: { orderBy: { createdAt: "desc" } },
        shippingAddress: true,
      },
    });

    if (cartId) {
      await tx.cartItem.deleteMany({ where: { cartId } });
    }

    return createdOrder;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10_000,
    timeout: 15_000,
  });

  let paymentUrl: string | undefined;
  let paymentError: string | undefined;
  const latestPayment = order.payments.find((payment) => payment.method === "SSL_COMMERZ");
  if (
    order.status === "PENDING"
    && latestPayment?.method === "SSL_COMMERZ"
    && latestPayment.status === "PENDING"
  ) {
    try {
      paymentUrl = await startSslPayment(latestPayment.id, userId);
    } catch (error) {
      console.error("Failed to initialize SSLCommerz payment.", {
        orderId: order.id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      if (error instanceof SslCommerzError) {
        paymentError = error.message;
      } else {
        paymentError = "Could not start the payment. Please retry from your order page.";
      }

    }
  }

  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout");

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalAmount: Number(order.totalAmount),
    paymentUrl,
    paymentError,
  };
}

export async function retrySslCommerzPayment(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
    include: {
      payments: {
        where: { method: "SSL_COMMERZ" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) {
    return { success: false as const, error: "order_not_found" as const };
  }
  if (order.status !== "PENDING" || order.paymentMethod === "COD" && order.advanceAmount.isZero()) {
    return { success: false as const, error: "payment_not_pending" as const };
  }

  try {
    const latestPayment = order.payments.find((payment) => payment.method === "SSL_COMMERZ");
    const payment = latestPayment?.status === "PENDING"
      ? latestPayment
      : await createSslPaymentAttempt(order.id, session.user.id);
    const paymentUrl = await startSslPayment(payment.id, session.user.id);
    revalidatePath(`/orders/${order.id}`);
    return { success: true as const, paymentUrl };
  } catch (error) {
    console.error("Failed to retry SSLCommerz payment.", {
      orderId: order.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return {
      success: false as const,
      error: error instanceof SslCommerzError ? "gateway_unavailable" as const : "payment_error" as const,
    };
  }
}
