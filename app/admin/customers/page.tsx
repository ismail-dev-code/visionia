import { promoteUserToAdmin } from "@/actions/admin";
import { getAdminCustomers } from "@/lib/services/admin";

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomers();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">People</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Customers</h1>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await promoteUserToAdmin(formData);
        }}
        className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
      >
        <div className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Promote user to admin</div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input name="email" type="email" placeholder="customer@visionia.com" className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-slate-400" required />
          <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
            Promote
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {customers.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500 md:col-span-2 xl:col-span-3">No customers found.</div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold text-slate-900">{customer.name}</div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">{customer.orderCount} orders</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">{customer.email}</div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Joined {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
