import { createCategory, updateCategoryTranslations } from "@/actions/admin";
import { getAdminCategories } from "@/lib/services/admin";

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Catalog</div>
          <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Categories</h1>
        </div>
      </div>

      <form
        action={async (formData: FormData) => {
          "use server";
          await createCategory(formData);
        }}
        className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
      >
        <div className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Create category</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" placeholder="Category name" className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-slate-400" required />
          <input name="slug" placeholder="Slug" className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-slate-400" required />
          <textarea name="description" placeholder="Description" rows={3} className="md:col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-slate-400" />
          <input name="image" placeholder="Image URL" className="md:col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-0 focus:border-slate-400" />
          <label className="md:col-span-2 space-y-2 text-sm text-slate-600">
            <span>Optional translations (JSON; base English content remains unchanged)</span>
            <textarea
              name="translations"
              rows={5}
              placeholder={'{"bn":{"name":"...","description":"..."},"ar":{"name":"..."},"hi":{"name":"..."}}'}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-xs outline-none focus:border-slate-400"
            />
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
            Add category
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-500">No categories yet.</div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 h-24 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{category.name}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">/{category.slug}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {category.productCount} products
                </span>
              </div>
              {category.description ? <p className="mt-3 text-sm text-slate-600">{category.description}</p> : null}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-medium text-cyan-800">Edit translations</summary>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await updateCategoryTranslations(
                      String(formData.get("categoryId") ?? ""),
                      String(formData.get("translations") ?? ""),
                    );
                  }}
                  className="mt-2 space-y-2"
                >
                  <input type="hidden" name="categoryId" value={category.id} />
                  <textarea
                    name="translations"
                    rows={6}
                    defaultValue={JSON.stringify(category.translations ?? {}, null, 2)}
                    placeholder={'{"bn":{"name":"...","description":"..."},"ar":{"name":"..."},"hi":{"name":"..."}}'}
                    aria-label={`Translations for ${category.name}`}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-800"
                  />
                  <button type="submit" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                    Save translations
                  </button>
                </form>
              </details>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
