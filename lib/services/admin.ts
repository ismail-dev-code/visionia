import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

function toNumber(value: number | string | Prisma.Decimal | null | undefined) {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getDashboardStats() {
  const [orderCount, customerCount, productCount, revenueResult, pendingCount, completedCount, lowStockCount, recentOrders, recentCustomers, topProducts] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.product.count({ where: { stockQuantity: { lt: 10 } } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { reviewCount: "desc" },
      select: {
        id: true,
        name: true,
        reviewCount: true,
        stockQuantity: true,
      },
    }),
  ]);

  return {
    totals: {
      revenue: toNumber(revenueResult._sum.totalAmount),
      orders: orderCount,
      products: productCount,
      customers: customerCount,
      pendingOrders: pendingCount,
      completedOrders: completedCount,
      lowStockProducts: lowStockCount,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      totalAmount: toNumber(order.totalAmount),
      status: order.status,
      customer: order.user.name ?? order.user.email,
      createdAt: order.createdAt,
    })),
    recentCustomers: recentCustomers.map((customer) => ({
      id: customer.id,
      name: customer.name ?? "Customer",
      email: customer.email,
      createdAt: customer.createdAt,
    })),
    topProducts: topProducts.map((product) => ({
      id: product.id,
      name: product.name,
      reviewCount: product.reviewCount,
      stockQuantity: product.stockQuantity,
    })),
  };
}

export async function getAdminProducts({
  search,
  categoryId,
  published,
  stock,
}: {
  search?: string;
  categoryId?: string;
  published?: boolean;
  stock?: "low" | "in-stock" | "out";
} = {}) {
  const products = await prisma.product.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(published !== undefined ? { isPublished: published } : {}),
      ...(stock === "low" ? { stockQuantity: { lt: 10 } } : {}),
      ...(stock === "in-stock" ? { stockQuantity: { gt: 0 } } : {}),
      ...(stock === "out" ? { stockQuantity: { lte: 0 } } : {}),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, url: true, isPrimary: true, sortOrder: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    slug: product.slug,
    categoryId: product.categoryId,
    category: product.category.name,
    price: toNumber(product.price),
    discountPrice: product.discountPrice ? toNumber(product.discountPrice) : null,
    stockQuantity: product.stockQuantity,
    isPublished: product.isPublished,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    images: product.images,
    image: product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? null,
    translations: product.translations,
  }));
}

export async function getAdminCategories({ search }: { search?: string } = {}) {
  const categories = await prisma.category.findMany({
    where: search
      ? {
          OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }],
        }
      : undefined,
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    translations: category.translations,
    image: category.image,
    productCount: category._count.products,
  }));
}

export async function getAdminOrders({
  search,
  status,
}: {
  search?: string;
  status?: string;
} = {}) {
  const orders = await prisma.order.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      payments: { select: { status: true, method: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customer: order.user.name ?? order.user.email,
    email: order.user.email,
    status: order.status,
    totalAmount: toNumber(order.totalAmount),
    createdAt: order.createdAt,
    paymentStatus: order.payments[0]?.status ?? "PENDING",
  }));
}

export async function getAdminCustomers({ search }: { search?: string } = {}) {
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name ?? "Customer",
    email: user.email,
    createdAt: user.createdAt,
    orderCount: user._count.orders,
  }));
}

export async function getAdminCoupons({ search }: { search?: string } = {}) {
  const coupons = await prisma.coupon.findMany({
    where: search
      ? {
          OR: [{ code: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    isActive: coupon.isActive,
    value: toNumber(coupon.value),
    minOrder: coupon.minOrder ? toNumber(coupon.minOrder) : null,
  }));
}

export async function getAdminBanners({ search }: { search?: string } = {}) {
  const banners = await prisma.banner.findMany({
    where: search
      ? {
          OR: [{ title: { contains: search, mode: "insensitive" } }, { subtitle: { contains: search, mode: "insensitive" } }],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    isActive: banner.isActive,
  }));
}

export async function getAdminReviews({ search, rating }: { search?: string; rating?: number } = {}) {
  const reviews = await prisma.review.findMany({
    where: {
      ...(rating ? { rating } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { comment: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { name: true, email: true } },
      product: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isApproved: review.isApproved,
    reviewer: review.user.name ?? review.user.email,
    product: review.product.name,
    createdAt: review.createdAt,
  }));
}

export async function getNewsletterSubscribers({ search }: { search?: string } = {}) {
  return prisma.newsletterSubscriber.findMany({
    where: search
      ? {
          email: { contains: search, mode: "insensitive" },
        }
      : undefined,
    orderBy: { subscribedAt: "desc" },
  });
}

export async function getStoreSettings() {
  return {
    storeName: "Visionia",
    storeSubtitle: "Premium electronics essentials",
    contactEmail: "support@visionia.example",
    contactPhone: "+880 1700-000000",
    currency: "BDT",
    address: "Dhaka, Bangladesh",
  };
}
