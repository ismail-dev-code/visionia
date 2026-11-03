CREATE TABLE "ProductSkuCounter" (
    "id" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL,
    CONSTRAINT "ProductSkuCounter_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProductSkuCounter" ("id", "lastValue")
SELECT
    'product',
    GREATEST(
        14999,
        COALESCE(
            MAX(substring("sku" FROM '^VIS-772-([0-9]+)$')::INTEGER),
            14999
        )
    )
FROM "Product"
WHERE "sku" ~ '^VIS-772-[0-9]+$';

INSERT INTO "ProductSkuCounter" ("id", "lastValue")
SELECT 'product', 14999
WHERE NOT EXISTS (
    SELECT 1
    FROM "ProductSkuCounter"
    WHERE "id" = 'product'
);
