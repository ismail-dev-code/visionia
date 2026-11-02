import { getAdminCoupons } from "@/lib/services/admin";

export default async function AdminCouponsPage() {
  const coupons = await getAdminCoupons();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Marketing</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Coupons</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {coupons.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500 md:col-span-2 xl:col-span-3">No coupons configured.</div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold tracking-[-0.04em] text-slate-900">{coupon.code}</div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${coupon.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {coupon.isActive ? "Active" : "Paused"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{coupon.description}</p>
              <div className="mt-4 text-sm text-slate-700">{coupon.value}% off</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
