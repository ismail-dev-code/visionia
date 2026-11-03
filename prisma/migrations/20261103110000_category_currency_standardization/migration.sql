ALTER TABLE "Category"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

INSERT INTO "Category" (
    "id",
    "name",
    "slug",
    "description",
    "translations",
    "isActive",
    "createdAt",
    "updatedAt"
)
VALUES
    (
        gen_random_uuid()::text,
        'Multi-Plugs',
        'multi-plugs',
        'Smart power strips and multi-plugs for homes and offices.',
        '{"bn":{"name":"মাল্টি-প্লাগ","description":"বাড়ি ও অফিসের জন্য স্মার্ট পাওয়ার স্ট্রিপ এবং মাল্টি-প্লাগ।"},"ar":{"name":"مقابس متعددة","description":"مشتركات كهربائية ومقابس متعددة ذكية للمنازل والمكاتب."},"hi":{"name":"मल्टी-प्लग","description":"घर और कार्यालय के लिए स्मार्ट पावर स्ट्रिप और मल्टी-प्लग।"}}'::jsonb,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'USB Cables',
        'usb-cables',
        'Fast-charging cables for phones, tablets, and laptops.',
        '{"bn":{"name":"ইউএসবি ক্যাবল","description":"ফোন, ট্যাবলেট এবং ল্যাপটপের জন্য দ্রুত-চার্জিং ক্যাবল।"},"ar":{"name":"كابلات USB","description":"كابلات شحن سريع للهواتف والأجهزة اللوحية والحواسيب المحمولة."},"hi":{"name":"यूएसबी केबल","description":"फ़ोन, टैबलेट और लैपटॉप के लिए तेज़ चार्जिंग केबल।"}}'::jsonb,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'Chargers & Adapters',
        'chargers-adapters',
        'Reliable power adapters for everyday and travel use.',
        '{"bn":{"name":"চার্জার ও অ্যাডাপ্টার","description":"দৈনন্দিন ব্যবহার এবং ভ্রমণের জন্য নির্ভরযোগ্য পাওয়ার অ্যাডাপ্টার।"},"ar":{"name":"الشواحن والمحولات","description":"محولات طاقة موثوقة للاستخدام اليومي والسفر."},"hi":{"name":"चार्जर और अडैप्टर","description":"रोज़मर्रा और यात्रा के लिए भरोसेमंद पावर अडैप्टर।"}}'::jsonb,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'Power Banks',
        'power-banks',
        'Portable battery packs for all-day productivity.',
        '{"bn":{"name":"পাওয়ার ব্যাংক","description":"সারাদিন কাজের জন্য বহনযোগ্য ব্যাটারি প্যাক।"},"ar":{"name":"بنوك الطاقة","description":"بطاريات محمولة للإنتاجية طوال اليوم."},"hi":{"name":"पावर बैंक","description":"पूरे दिन काम के लिए पोर्टेबल बैटरी पैक।"}}'::jsonb,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid()::text,
        'Audio',
        'audio',
        'Earphones, headphones, speakers, and other audio accessories.',
        '{"bn":{"name":"অডিও","description":"ইয়ারফোন, হেডফোন, স্পিকার এবং অন্যান্য অডিও অ্যাকসেসরিজ।"},"ar":{"name":"الصوتيات","description":"سماعات أذن وسماعات رأس ومكبرات صوت وملحقات صوتية أخرى."},"hi":{"name":"ऑडियो","description":"ईयरफ़ोन, हेडफ़ोन, स्पीकर और अन्य ऑडियो एक्सेसरीज़।"}}'::jsonb,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT ("slug") DO UPDATE
SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "translations" = EXCLUDED."translations",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Product" AS product
SET "categoryId" = official."id"
FROM "Category" AS previous
CROSS JOIN "Category" AS official
WHERE previous."slug" = 'heavy-and-super-friendly'
  AND previous."name" = 'MultiPlug for Multipurpose'
  AND official."slug" = 'multi-plugs'
  AND product."categoryId" = previous."id";

ALTER TABLE "Order"
ADD COLUMN "currency" TEXT;

ALTER TABLE "Payment"
ADD COLUMN "currency" TEXT;
