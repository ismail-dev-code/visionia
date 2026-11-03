import { PrismaClient } from "@prisma/client";

import {
  OFFICIAL_CATEGORIES,
  OFFICIAL_CATEGORY_SLUGS,
} from "../lib/constants/categories";

const prisma = new PrismaClient();

async function main() {
  await prisma.productSkuCounter.upsert({
    where: { id: "product" },
    update: {},
    create: { id: "product", lastValue: 14999 },
  });

  await prisma.category.updateMany({
    where: { slug: { notIn: [...OFFICIAL_CATEGORY_SLUGS] } },
    data: { isActive: false },
  });

  for (const category of OFFICIAL_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        translations: category.translations,
        isActive: true,
      },
      create: {
        ...category,
        isActive: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
