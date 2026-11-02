import { getStoreSettings } from "@/lib/services/admin";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Configuration</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Store settings</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm uppercase tracking-[0.18em] text-slate-500">Store name</div>
          <div className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-950">{settings.storeName}</div>
          <p className="mt-2 text-sm text-slate-600">{settings.storeSubtitle}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-3 text-sm text-slate-600">
            <div><span className="font-medium text-slate-800">Email:</span> {settings.contactEmail}</div>
            <div><span className="font-medium text-slate-800">Phone:</span> {settings.contactPhone}</div>
            <div><span className="font-medium text-slate-800">Currency:</span> {settings.currency}</div>
            <div><span className="font-medium text-slate-800">Address:</span> {settings.address}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
