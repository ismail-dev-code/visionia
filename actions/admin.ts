"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { isValidProductImageUrl } from "@/lib/validations/product";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  image: z.string().trim().max(500).optional().or(z.literal("")),
});

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
  error?: "invalidProduct" | "invalidImageUrl" | "missingPrimaryImage" | "duplicate";
};

const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().toLowerCase().max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sku: z.string().trim().min(1).max(100),
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
    sku: formData.get("sku"),
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

  const primaryImageIndex = Number(formData.get("primaryImageIndex"));
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

  try {
    const { data, images } = input;
    await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        sku: data.sku,
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
  } catch (error) {
    return getPrismaActionError(error);
  }

  revalidateCatalogPaths(input.data.slug);
  return { status: "success" };
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
        sku: data.sku,
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

export async function createCategory(input: FormData | Record<string, unknown>) {
  await requireAdmin();

  const data = typeof input === "object" && input !== null && "get" in input
    ? {
        name: String((input as FormData).get("name") ?? ""),
        slug: String((input as FormData).get("slug") ?? ""),
        description: String((input as FormData).get("description") ?? ""),
        image: String((input as FormData).get("image") ?? ""),
        translations: String((input as FormData).get("translations") ?? ""),
      }
    : (input as Record<string, unknown> | undefined) ?? {};

  const parsed = categorySchema.safeParse(data);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid category input.");
  }

  const { name, slug, description, image } = parsed.data;

  const normalizedSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name: { equals: name.trim(), mode: "insensitive" } }, { slug: { equals: normalizedSlug, mode: "insensitive" } }],
    },
  });

  if (existing) {
    throw new Error("A category with this name or slug already exists.");
  }

  await prisma.category.create({
    data: {
      name: name.trim(),
      slug: normalizedSlug,
      description: description?.trim() || null,
      image: image?.trim() || null,
      translations: parseTranslations(data.translations),
    },
  });

  revalidatePath("/admin/categories");
  return { success: true };
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

  await prisma.category.update({
    where: { id: categoryId },
    data: { translations: parseTranslations(raw) },
  });

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

export async function deleteCategory(categoryId: string) {
  await requireAdmin();

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
