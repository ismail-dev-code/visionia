import Link from "next/link";
import { ChevronDown, Mail } from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getTranslations } from "@/lib/i18n";

const questionKeys = [
  "ordering",
  "payments",
  "shipping",
  "tracking",
  "returns",
  "products",
  "paymentIssues",
] as const;

export default async function FAQPage() {
  const { t } = await getTranslations();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-12 lg:px-6 lg:py-16">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            {t("faq.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-5xl">
            {t("faq.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
            {t("faq.description")}
          </p>
        </header>

        <section aria-label={t("faq.title")} className="space-y-3">
          {questionKeys.map((key) => (
            <details
              key={key}
              className="group rounded-2xl border border-slate-200 bg-white px-5 shadow-sm open:border-cyan-200"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-slate-900 marker:hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-700">
                {t(`faq.questions.${key}`)}
                <ChevronDown
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="pb-5 leading-7 text-slate-600">
                {t(`faq.answers.${key}`)}
              </p>
            </details>
          ))}
        </section>

        <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-semibold">{t("faq.supportTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {t("faq.supportDescription")}
            </p>
          </div>
          <Link
            href="mailto:hello@visionia.tech"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Mail aria-hidden="true" className="h-4 w-4" />
            {t("faq.contactSupport")}
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
