import { getNewsletterSubscribers } from "@/lib/services/admin";

export default async function AdminNewsletterPage() {
  const subscribers = await getNewsletterSubscribers();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Marketing</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Newsletter</h1>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-slate-500">No subscribers yet.</td>
                </tr>
              ) : (
                subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{subscriber.email}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(subscriber.subscribedAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
