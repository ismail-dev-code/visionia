import { Activity, DollarSign, PackageCheck, ShoppingCart, Users } from "lucide-react";

import { getDashboardStats } from "@/lib/services/admin";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: "Revenue", value: currency.format(stats.totals.revenue), icon: DollarSign, accent: "text-emerald-600 bg-emerald-50" },
    { label: "Orders", value: String(stats.totals.orders), icon: ShoppingCart, accent: "text-cyan-600 bg-cyan-50" },
    { label: "Products", value: String(stats.totals.products), icon: PackageCheck, accent: "text-violet-600 bg-violet-50" },
    { label: "Customers", value: String(stats.totals.customers), icon: Users, accent: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className={`rounded-2xl p-2 ${accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Live</span>
            </div>
            <div className="text-3xl font-semibold tracking-[-0.06em] text-slate-950">{value}</div>
            <div className="mt-2 text-sm text-slate-600">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Recent orders</h2>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="pb-3 font-medium">Order</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-slate-500">No orders yet.</td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100">
                      <td className="py-3 font-medium text-slate-800">{order.orderNumber}</td>
                      <td className="py-3 text-slate-600">{order.customer}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-slate-800">{currency.format(order.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Top products</h2>
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No top products yet.</p>
            ) : (
              stats.topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2.5">
                  <div>
                    <div className="font-medium text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.reviewCount} reviews</div>
                  </div>
                  <div className="text-sm font-medium text-slate-600">{product.stockQuantity} in stock</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">Recent customers</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.recentCustomers.length === 0 ? (
            <p className="text-sm text-slate-500 md:col-span-2 xl:col-span-5">No customer activity yet.</p>
          ) : (
            stats.recentCustomers.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-medium text-slate-800">{customer.name}</div>
                <div className="mt-1 text-xs text-slate-500">{customer.email}</div>
                <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
