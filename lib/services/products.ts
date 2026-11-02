import { prisma } from "@/lib/db";
import { getLocalizedText, type Locale } from "@/lib/i18n";

export type ProductSort = "newest" | "price_asc" | "price_desc" | "popular";

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  discountPrice: number | null;
  stockQuantity: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  categoryId: string;
  rating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  primaryImage: string | null;
  hasVariants: boolean;
  variantStartingPrice: number | null;
};

export type CatalogFilters = {
  categorySlug?: string;
  search?: string;
  sort?: ProductSort;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  page?: number;
  limit?: number;
};

function normalizeProduct(product: {
  id: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  price: { toNumber: () => number };
  discountPrice: { toNumber: () => number } | null;
  stockQuantity: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  categoryId: string;
  rating: number;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    translations?: unknown;
  };
  images: Array<{ url: string; isPrimary: boolean }>;
  translations?: unknown;
  variants?: Array<{ id: string; stock: number; price: { toNumber: () => number } | null }>;
}): ProductListItem {
  return {
    id: product.id,
    name: getLocalizedText(product.translations, "en", "name", product.name),
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription,
    description: product.description,
    price: Number(product.price),
    discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
    stockQuantity: product.variants?.length
      ? product.variants.reduce((total, variant) => total + variant.stock, 0)
      : product.stockQuantity,
    isFeatured: product.isFeatured,
    isNewArrival: product.isNewArrival,
    categoryId: product.categoryId,
    rating: product.rating,
    reviewCount: product.reviewCount,
    category: product.category,
    primaryImage: product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? null,
    hasVariants: Boolean(product.variants?.length),
    variantStartingPrice: product.variants?.length
      ? Math.min(...product.variants.map((variant) => Number(
          variant.price ?? product.discountPrice ?? product.price,
        )))
      : null,
  };
}

export async function getCategories(locale: Locale = "en") {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return categories.map((category) => ({
      ...category,
      name: getLocalizedText(category.translations, locale, "name", category.name),
      description: getLocalizedText(category.translations, locale, "description", category.description) || null,
      productCount: category._count.products,
    }));
  } catch {
    return [];
  }
}

export async function getProducts(filters: CatalogFilters = {}, locale: Locale = "en") {
  if (!process.env.DATABASE_URL) {
    return {
      products: [],
      total: 0,
      page: filters.page ?? 1,
      limit: filters.limit ?? 12,
      pages: 1,
    };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 12;
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};

    if (filters.categorySlug) {
      where.category = {
        slug: filters.categorySlug,
      };
    }

    if (filters.search) {
      const term = filters.search.trim();
      if (term) {
        where.OR = [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { shortDescription: { contains: term, mode: "insensitive" } },
          { category: { name: { contains: term, mode: "insensitive" } } },
        ];
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {
        gte: Number(filters.minPrice ?? 0),
        lte: Number(filters.maxPrice ?? Number.MAX_SAFE_INTEGER),
      };
    }

    if (filters.inStockOnly) {
      where.stockQuantity = { gt: 0 };
    }

    const orderBy: Record<string, string | { _count?: "desc" }> = {};
    switch (filters.sort ?? "newest") {
      case "price_asc":
        orderBy.price = "asc";
        break;
      case "price_desc":
        orderBy.price = "desc";
        break;
      case "popular":
        orderBy.reviewCount = "desc";
        break;
      case "newest":
      default:
        orderBy.createdAt = "desc";
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true, description: true, translations: true },
          },
          variants: { select: { id: true, stock: true, price: true } },
          images: {
            orderBy: { createdAt: "asc" },
            select: { url: true, isPrimary: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: products.map((product) => {
        const normalized = normalizeProduct(product);
        normalized.name = getLocalizedText(product.translations, locale, "name", product.name);
        normalized.shortDescription = getLocalizedText(
          product.translations,
          locale,
          "shortDescription",
          product.shortDescription,
        ) || null;
        normalized.description = getLocalizedText(
          product.translations,
          locale,
          "description",
          product.description,
        ) || null;
        normalized.category.name = getLocalizedText(
          product.category.translations,
          locale,
          "name",
          product.category.name,
        );
        return normalized;
      }),
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  } catch {
    return {
      products: [],
      total: 0,
      page,
      limit,
      pages: 1,
    };
  }
}

export async function getProductBySlug(slug: string, locale: Locale = "en") {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: { id: true, name: true, slug: true, description: true, translations: true },
        },
        variants: true,
        images: {
          orderBy: { createdAt: "asc" },
          select: { url: true, altText: true, isPrimary: true },
        },
        reviews: {
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      ...product,
      name: getLocalizedText(product.translations, locale, "name", product.name),
      shortDescription: getLocalizedText(
        product.translations,
        locale,
        "shortDescription",
        product.shortDescription,
      ) || null,
      description: getLocalizedText(
        product.translations,
        locale,
        "description",
        product.description,
      ) || null,
      category: {
        ...product.category,
        name: getLocalizedText(
          product.category.translations,
          locale,
          "name",
          product.category.name,
        ),
        description: getLocalizedText(
          product.category.translations,
          locale,
          "description",
          product.category.description,
        ) || null,
      },
      price: Number(product.price),
      discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
      specifications: product.specifications as Record<string, string> | null,
      reviews: product.reviews.map((review) => ({
        ...review,
        user: review.user,
      })),
    };
  } catch {
    return null;
  }
}

export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit = 4,
  locale: Locale = "en",
) {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        id: { not: productId },
      },
      take: limit,
      orderBy: { rating: "desc" },
      include: {
        category: {
          select: { id: true, name: true, slug: true, translations: true },
        },
        variants: { select: { id: true, stock: true, price: true } },
        images: {
          orderBy: { createdAt: "asc" },
          select: { url: true, isPrimary: true },
        },
      },
    });

    return products.map((product) => {
      const normalized = normalizeProduct(product);
      normalized.name = getLocalizedText(product.translations, locale, "name", product.name);
      normalized.category.name = getLocalizedText(
        product.category.translations,
        locale,
        "name",
        product.category.name,
      );
      return normalized;
    });
  } catch {
    return [];
  }
}
