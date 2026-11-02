import { getAdminReviews } from "@/lib/services/admin";

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Experience</div>
        <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Reviews</h1>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No reviews yet.</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{review.title}</div>
                  <div className="text-sm text-slate-500">{review.reviewer} • {review.product}</div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${review.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {review.isApproved ? "Approved" : "Pending"}
                </span>
              </div>
              <div className="mt-3 text-sm text-slate-600">{review.comment}</div>
              <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">{review.rating}/5 rating</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
