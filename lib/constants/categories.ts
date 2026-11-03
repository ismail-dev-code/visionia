export const OFFICIAL_CATEGORIES = [
  {
    name: "Multi-Plugs",
    slug: "multi-plugs",
    description: "Smart power strips and multi-plugs for homes and offices.",
    translations: {
      bn: {
        name: "মাল্টি-প্লাগ",
        description: "বাড়ি ও অফিসের জন্য স্মার্ট পাওয়ার স্ট্রিপ এবং মাল্টি-প্লাগ।",
      },
      ar: {
        name: "مقابس متعددة",
        description: "مشتركات كهربائية ومقابس متعددة ذكية للمنازل والمكاتب.",
      },
      hi: {
        name: "मल्टी-प्लग",
        description: "घर और कार्यालय के लिए स्मार्ट पावर स्ट्रिप और मल्टी-प्लग।",
      },
    },
  },
  {
    name: "USB Cables",
    slug: "usb-cables",
    description: "Fast-charging cables for phones, tablets, and laptops.",
    translations: {
      bn: {
        name: "ইউএসবি ক্যাবল",
        description: "ফোন, ট্যাবলেট এবং ল্যাপটপের জন্য দ্রুত-চার্জিং ক্যাবল।",
      },
      ar: {
        name: "كابلات USB",
        description: "كابلات شحن سريع للهواتف والأجهزة اللوحية والحواسيب المحمولة.",
      },
      hi: {
        name: "यूएसबी केबल",
        description: "फ़ोन, टैबलेट और लैपटॉप के लिए तेज़ चार्जिंग केबल।",
      },
    },
  },
  {
    name: "Chargers & Adapters",
    slug: "chargers-adapters",
    description: "Reliable power adapters for everyday and travel use.",
    translations: {
      bn: {
        name: "চার্জার ও অ্যাডাপ্টার",
        description: "দৈনন্দিন ব্যবহার এবং ভ্রমণের জন্য নির্ভরযোগ্য পাওয়ার অ্যাডাপ্টার।",
      },
      ar: {
        name: "الشواحن والمحولات",
        description: "محولات طاقة موثوقة للاستخدام اليومي والسفر.",
      },
      hi: {
        name: "चार्जर और अडैप्टर",
        description: "रोज़मर्रा और यात्रा के लिए भरोसेमंद पावर अडैप्टर।",
      },
    },
  },
  {
    name: "Power Banks",
    slug: "power-banks",
    description: "Portable battery packs for all-day productivity.",
    translations: {
      bn: {
        name: "পাওয়ার ব্যাংক",
        description: "সারাদিন কাজের জন্য বহনযোগ্য ব্যাটারি প্যাক।",
      },
      ar: {
        name: "بنوك الطاقة",
        description: "بطاريات محمولة للإنتاجية طوال اليوم.",
      },
      hi: {
        name: "पावर बैंक",
        description: "पूरे दिन काम के लिए पोर्टेबल बैटरी पैक।",
      },
    },
  },
  {
    name: "Audio",
    slug: "audio",
    description: "Earphones, headphones, speakers, and other audio accessories.",
    translations: {
      bn: {
        name: "অডিও",
        description: "ইয়ারফোন, হেডফোন, স্পিকার এবং অন্যান্য অডিও অ্যাকসেসরিজ।",
      },
      ar: {
        name: "الصوتيات",
        description: "سماعات أذن وسماعات رأس ومكبرات صوت وملحقات صوتية أخرى.",
      },
      hi: {
        name: "ऑडियो",
        description: "ईयरफ़ोन, हेडफ़ोन, स्पीकर और अन्य ऑडियो एक्सेसरीज़।",
      },
    },
  },
] as const;

export const OFFICIAL_CATEGORY_SLUGS = OFFICIAL_CATEGORIES.map(
  (category) => category.slug,
);

export function isOfficialCategorySlug(slug: string): boolean {
  return OFFICIAL_CATEGORY_SLUGS.includes(slug as (typeof OFFICIAL_CATEGORY_SLUGS)[number]);
}
