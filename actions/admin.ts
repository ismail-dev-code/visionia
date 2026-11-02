"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

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

  await prisma.product.update({
    where: { id: productId },
    data: { isPublished: published },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductFeatured(productId: string, featured: boolean) {
  await requireAdmin();

  await prisma.product.update({
    where: { id: productId },
    data: { isFeatured: featured },
  });

  revalidatePath("/admin/products");
  return { success: true };
}

export async function toggleProductArrival(productId: string, isNew: boolean) {
  await requireAdmin();

  await prisma.product.update({
    where: { id: productId },
    data: { isNewArrival: isNew },
  });

  revalidatePath("/admin/products");
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

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
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
