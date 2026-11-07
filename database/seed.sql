-- Visionia demo catalog seed.
-- Safe to re-run: categories/products are upserted by their stable slugs.
-- No users, credentials, orders, or payment records are created.
-- Prices are expressed in BDT by the storefront's configured currency.

INSERT INTO "Category" (
    "id",
    "name",
    "slug",
    "description",
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        'visionia-demo-cat-multi-plugs',
        'Multi-Plugs',
        'multi-plugs',
        'Smart power strips and multi-plugs for homes and offices.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-cat-usb-cables',
        'USB Cables',
        'usb-cables',
        'Fast-charging cables for phones, tablets, and laptops.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-cat-chargers',
        'Chargers & Adapters',
        'chargers-adapters',
        'Reliable power adapters for everyday and travel use.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-cat-power-banks',
        'Power Banks',
        'power-banks',
        'Portable battery packs for all-day productivity.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-cat-audio',
        'Audio',
        'audio',
        'Earphones, headphones, speakers, and other audio accessories.',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "ProductSkuCounter" ("id", "lastValue")
VALUES ('product', 14999)
ON CONFLICT ("id") DO UPDATE
SET "lastValue" = GREATEST("ProductSkuCounter"."lastValue", EXCLUDED."lastValue");

INSERT INTO "Product" (
    "id",
    "name",
    "slug",
    "sku",
    "shortDescription",
    "description",
    "price",
    "stockQuantity",
    "isFeatured",
    "isNewArrival",
    "isPublished",
    "rating",
    "reviewCount",
    "categoryId",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        'visionia-demo-product-surge-guard',
        'Visionia 8-Port Surge Guard',
        'visionia-8-port-surge-guard',
        'VIS-DEMO-001',
        'Eight-outlet power strip with individual switches.',
        'A practical surge-protected power strip for a home office or entertainment setup.',
        1890.00,
        35,
        true,
        true,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'multi-plugs'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-compact-extension',
        'Compact 4-Outlet Extension',
        'compact-4-outlet-extension',
        'VIS-DEMO-002',
        'Compact extension strip for everyday charging.',
        'A space-saving extension strip for desks, bedside tables, and small work areas.',
        990.00,
        48,
        false,
        false,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'multi-plugs'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-usbc-60w',
        'USB-C Braided Cable 60W',
        'usb-c-braided-cable-60w',
        'VIS-DEMO-003',
        'Durable USB-C to USB-C cable for daily charging.',
        'A braided 1.5 metre cable designed for compatible phones, tablets, and laptops.',
        450.00,
        120,
        false,
        true,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'usb-cables'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-usbc-100w',
        'USB-C Cable 100W 2m',
        'usb-c-cable-100w-2m',
        'VIS-DEMO-004',
        'Long-reach USB-C cable for compatible high-power devices.',
        'A two metre cable for charging and desk setups with compatible USB-C equipment.',
        690.00,
        70,
        true,
        false,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'usb-cables'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-gan-30w',
        '30W USB-C GaN Charger',
        '30w-usb-c-gan-charger',
        'VIS-DEMO-005',
        'Compact USB-C wall charger for phones and tablets.',
        'A portable 30W charger for compatible devices, suitable for home or travel use.',
        1490.00,
        42,
        true,
        true,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'chargers-adapters'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-gan-65w',
        '65W USB-C GaN Travel Charger',
        '65w-usb-c-gan-travel-charger',
        'VIS-DEMO-006',
        'Multi-device charger for compatible laptops and mobile devices.',
        'A compact travel charger for devices that support USB-C power delivery.',
        3290.00,
        24,
        false,
        true,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'chargers-adapters'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-power-bank-10k',
        '10,000mAh Pocket Power Bank',
        '10000mah-pocket-power-bank',
        'VIS-DEMO-007',
        'Portable backup battery for daily commutes.',
        'A compact power bank for charging compatible phones and small devices on the go.',
        2290.00,
        32,
        true,
        false,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'power-banks'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-power-bank-20k',
        '20,000mAh Fast-Charge Power Bank',
        '20000mah-fast-charge-power-bank',
        'VIS-DEMO-008',
        'Higher-capacity portable charging for busy days.',
        'A 20,000mAh backup battery for compatible phones, tablets, and travel use.',
        4290.00,
        18,
        false,
        true,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'power-banks'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-tws-earbuds',
        'Wireless TWS Earbuds',
        'wireless-tws-earbuds',
        'VIS-DEMO-009',
        'True wireless earbuds for calls and everyday listening.',
        'Lightweight wireless earbuds with a charging case for compatible Bluetooth devices.',
        2790.00,
        26,
        true,
        true,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'audio'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'visionia-demo-product-bluetooth-speaker',
        'Portable Bluetooth Speaker',
        'portable-bluetooth-speaker',
        'VIS-DEMO-010',
        'Compact speaker for desks and small rooms.',
        'A portable Bluetooth speaker for everyday listening with compatible devices.',
        3490.00,
        15,
        false,
        false,
        true,
        0,
        0,
        (SELECT "id" FROM "Category" WHERE "slug" = 'audio'),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "sku" = EXCLUDED."sku",
    "shortDescription" = EXCLUDED."shortDescription",
    "description" = EXCLUDED."description",
    "price" = EXCLUDED."price",
    "stockQuantity" = EXCLUDED."stockQuantity",
    "isFeatured" = EXCLUDED."isFeatured",
    "isNewArrival" = EXCLUDED."isNewArrival",
    "isPublished" = EXCLUDED."isPublished",
    "categoryId" = EXCLUDED."categoryId",
    "updatedAt" = CURRENT_TIMESTAMP;
