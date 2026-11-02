import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      name: "Multi-Plugs",
      slug: "multi-plugs",
      description: "Smart power strips and multi-plugs for homes and offices.",
    },
    {
      name: "USB Cables",
      slug: "usb-cables",
      description: "Fast-charging cables for phones, tablets, and laptops.",
    },
    {
      name: "Chargers & Adapters",
      slug: "chargers-adapters",
      description: "Reliable power adapters for everyday and travel use.",
    },
    {
      name: "Power Banks",
      slug: "power-banks",
      description: "Portable battery packs for all-day productivity.",
    },
    {
      name: "Audio",
      slug: "audio",
      description: "Earphones and accessories designed for everyday listening.",
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const power = await prisma.category.findUnique({ where: { slug: "multi-plugs" } });

  if (power) {
    await prisma.product.upsert({
      where: { slug: "vision-smart-strip-pro" },
      update: {},
      create: {
        name: "Vision Smart Strip Pro",
        slug: "vision-smart-strip-pro",
        sku: "VIS-STRIP-001",
        shortDescription: "8-port power strip with surge protection",
        description: "Premium home and office power strip with multiple universal outlets, 2-meter cable, and surge protection.",
        price: 2490,
        discountPrice: 1890,
        stockQuantity: 120,
        isFeatured: true,
        isNewArrival: true,
        rating: 4.9,
        reviewCount: 43,
        categoryId: power.id,
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
