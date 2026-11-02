import { getAdminBanners } from "@/lib/services/admin";

export default async function AdminBannersPage() {
  const banners = await getAdminBanners();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Marketing</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Banners</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {banners.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500 md:col-span-2 xl:col-span-3">No banners available.</div>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="h-36 bg-gradient-to-br from-slate-900 via-slate-700 to-cyan-600" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{banner.title}</div>
                    <div className="text-sm text-slate-600">{banner.subtitle}</div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${banner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {banner.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{banner.linkUrl}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
