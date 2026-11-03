"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
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

async function getCartQuantity(tx: Prisma.TransactionClient, userId: string) {
  const cart = await tx.cart.findUnique({
    where: { userId },
    include: {
      items: {
        select: {
          quantity: true,
          product: {
            select: {
              isPublished: true,
              category: { select: { isActive: true, slug: true } },
            },
          },
        },
      },
    },
  });

  return cart?.items.reduce((count, item) =>
    item.product.isPublished
      && item.product.category.isActive
      && isOfficialCategorySlug(item.product.category.slug)
      ? count + item.quantity
      : count,
  0) ?? 0;
}

async function validatePurchase(
  tx: Prisma.TransactionClient,
  input: z.infer<typeof purchaseSchema>,
) {
  const product = await tx.product.findUnique({
    where: { id: input.productId },
    include: { variants: true, category: true },
  });

  if (!product || !product.isPublished || !product.category.isActive || !isOfficialCategorySlug(product.category.slug)) {
    throw new Error("This product is unavailable.");
  }

  const variant = input.variantId
    ? product.variants.find((candidate) => candidate.id === input.variantId)
    : undefined;

  if (input.variantId && !variant) {
    throw new Error("The selected product option is unavailable.");
  }

  if (product.variants.length > 0 && !variant) {
    throw new Error("Choose a product option before continuing.");
  }

  const available = variant?.stock ?? product.stockQuantity;
  if (available < input.quantity) {
    throw new Error(
      available === 0
        ? "This product is out of stock."
        : `Only ${available} item${available === 1 ? "" : "s"} available.`,
    );
  }

  return { product, variant };
}

export async function addToCart(productId: string, quantity = 1, variantId?: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = purchaseSchema.safeParse({ productId, quantity, variantId });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid cart request.");
  }

  const userId = session.user.id;
  const count = await prisma.$transaction(async (tx) => {
    const { product, variant } = await validatePurchase(tx, parsed.data);
    const cart = await tx.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    const existing = await tx.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant?.id ?? null,
        variantKey: variant?.id ?? "",
      },
    });

    if (existing && existing.quantity + parsed.data.quantity > (variant?.stock ?? product.stockQuantity)) {
      throw new Error("The requested quantity exceeds the available stock.");
    }

    if (existing) {
      await tx.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: parsed.data.quantity } },
      });
    } else {
      await tx.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity: parsed.data.quantity,
        },
      });
    }

    return getCartQuantity(tx, userId);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

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
}, intentId?: string) {
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

  const userId = session.user.id;
  const locale = await getLocale();
  const addressInput = parsedAddress.data;
  const order = await prisma.$transaction(async (tx) => {
    if (intentId) {
      const existingOrder = await tx.order.findFirst({
        where: { checkoutIntentId: intentId, userId },
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
        subtotal,
        shippingFee,
        currency: CURRENCY_CODE,
        totalAmount,
        notes: addressInput.notes || null,
        status: "PENDING",
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
          create: {
            method: "COD",
            status: "PENDING",
            amount: totalAmount,
            currency: CURRENCY_CODE,
          },
        },
      },
    });

    if (cartId) {
      await tx.cartItem.deleteMany({ where: { cartId } });
    }

    return createdOrder;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  revalidatePath("/checkout");
  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout");

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalAmount: Number(order.totalAmount),
  };
}
