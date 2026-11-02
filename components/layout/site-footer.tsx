import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

import { getTranslations } from "@/lib/i18n";
import Image from "next/image";

export async function SiteFooter() {
  const { t } = await getTranslations();

  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 lg:grid-cols-[1.2fr_0.7fr_0.7fr_1fr] lg:px-6">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label={t("navigation.home")}
            >
              <Image
                src="/visionia-logo.svg"
                alt="Visionia Logo"
                width={220}
                height={80}
                priority
                className="block h-auto w-[130px] object-contain sm:w-[160px] lg:w-[190px]"
              />
            </Link>
          </div>
          <p className="max-w-sm text-sm leading-7 text-slate-300">
            {t("footer.description")}
          </p>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Dhaka, Bangladesh
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-cyan-400" />
              +880 1700-000000
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-cyan-400" />
              hello@visionia.tech
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white">
            {t("footer.shop")}
          </h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link href="/shop" className="hover:text-white">
                {t("footer.allProducts")}
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-white">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/deals" className="hover:text-white">
                {t("footer.promotions")}
              </Link>
            </li>
            <li>
              <Link href="/new-arrivals" className="hover:text-white">
                {t("footer.newArrivals")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white">
            {t("footer.company")}
          </h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>
              <Link href="/about" className="hover:text-white">
                {t("footer.about")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                {t("footer.contact")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-white">
                {t("footer.faqs")}
              </Link>
            </li>
            <li>
              <Link href="/shipping" className="hover:text-white">
                {t("footer.shipping")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-white">
            {t("footer.newsletter")}
          </h3>
          <p className="mb-4 text-sm leading-7 text-slate-300">
            {t("footer.newsletterDescription")}
          </p>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 p-1">
            <input
              type="email"
              aria-label={t("auth.email")}
              placeholder={t("footer.emailPlaceholder")}
              className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-slate-950 transition hover:bg-cyan-300"
              aria-label={t("footer.subscribe")}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <p>{t("footer.copyright")}</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-white">
              {t("footer.terms")}
            </Link>
            <Link href="/returns" className="hover:text-white">
              {t("footer.returns")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
