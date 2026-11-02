import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLocalizedText, type Locale } from "@/lib/i18n";

export async function getCartSummary(locale: Locale = "en") {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      items: [],
      count: 0,
      subtotal: 0,
      shippingFee: 0,
      total: 0,
    };
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          variant: true,
          product: {
            include: {
              variants: { select: { id: true, stock: true, price: true } },
              images: {
                where: { isPrimary: true },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      count: 0,
      subtotal: 0,
      shippingFee: 0,
      total: 0,
    };
  }

  const items = cart.items.map((line) => {
    const unitPrice = Number(line.variant?.price ?? line.product.discountPrice ?? line.product.price);
    const stockQuantity = line.variant?.stock ?? line.product.stockQuantity;
    return {
      id: line.id,
      productId: line.productId,
      name: getLocalizedText(line.product.translations, locale, "name", line.product.name),
      slug: line.product.slug,
      variantName: line.variant?.name ?? null,
      variantValue: line.variant?.value ?? null,
      quantity: line.quantity,
      stockQuantity,
      unitPrice,
      total: unitPrice * line.quantity,
      image: line.product.images[0]?.url ?? null,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shippingFee = subtotal >= 3000 ? 0 : 120;

  return {
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
}

export async function getBuyNowSummary(intentId: string, locale: Locale) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const intent = await prisma.checkoutIntent.findFirst({
    where: {
      id: intentId,
      userId: session.user.id,
      expiresAt: { gt: new Date() },
      order: null,
    },
    include: {
      product: {
        include: {
          variants: { select: { id: true } },
          images: {
            where: { isPrimary: true },
            orderBy: { createdAt: "asc" },
            take: 1,
          },
        },
      },
      variant: true,
    },
  });

  if (!intent || !intent.product.isPublished) {
    return null;
  }

  const availableStock = intent.variant?.stock ?? intent.product.stockQuantity;
  if (intent.quantity > availableStock) {
    return null;
  }

  const unitPrice = Number(
    intent.variant?.price ?? intent.product.discountPrice ?? intent.product.price,
  );
  const name = getLocalizedText(
    intent.product.translations,
    locale,
    "name",
    intent.product.name,
  );

  return {
    id: intent.id,
    productId: intent.productId,
    name,
    slug: intent.product.slug,
    variantName: intent.variant?.name ?? null,
    variantValue: intent.variant?.value ?? null,
    quantity: intent.quantity,
    unitPrice,
    total: unitPrice * intent.quantity,
    image: intent.product.images[0]?.url ?? null,
  };
}

export async function getWishlistSummary(locale: Locale = "en") {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: { select: { id: true, stock: true, price: true } },
              images: {
                where: { isPrimary: true },
                orderBy: { createdAt: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!wishlist) {
    return [];
  }

  return wishlist.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: getLocalizedText(item.product.translations, locale, "name", item.product.name),
    slug: item.product.slug,
    price: item.product.variants.length
      ? Math.min(...item.product.variants.map((variant) => Number(
          variant.price ?? item.product.discountPrice ?? item.product.price,
        )))
      : Number(item.product.discountPrice ?? item.product.price),
    image: item.product.images[0]?.url ?? null,
    hasVariants: item.product.variants.length > 0,
    stockQuantity: item.product.variants.length
      ? item.product.variants.reduce((total, variant) => total + variant.stock, 0)
      : item.product.stockQuantity,
  }));
}
