import { getTranslations } from "@/lib/i18n";

export default async function SearchLoading() {
  const { t } = await getTranslations();

  return (
    <main
      role="status"
      aria-label={t("productSearch.loading")}
      className="mx-auto max-w-7xl animate-pulse px-4 py-8 lg:px-6 lg:py-12"
    >
      <p className="sr-only">{t("productSearch.loading")}</p>
      <div className="mb-6 space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-9 w-2/3 rounded bg-slate-200" />
        <div className="h-4 w-40 rounded bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="h-96 rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-72 rounded-xl bg-slate-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
