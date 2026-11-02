import { Search } from "lucide-react";

import { toggleProductPublished, updateProductTranslations } from "@/actions/admin";
import { getAdminProducts } from "@/lib/services/admin";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-700">Catalog</div>
          <h1 className="text-2xl font-semibold tracking-[-0.05em] text-slate-950">Products</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Search className="h-4 w-4" />
          {products.length} items
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-slate-500">No products available.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.category}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{currency.format(product.price)}</td>
                    <td className="px-4 py-3 text-slate-600">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {product.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <form
                        action={async (formData: FormData) => {
                          "use server";
                          const productId = String(formData.get("productId") ?? "");
                          const published = formData.get("published") === "true";
                          await toggleProductPublished(productId, published);
                        }}
                      >
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="published" value={String(!product.isPublished)} />
                        <button type="submit" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700">
                          {product.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-cyan-800">
                          Edit translations
                        </summary>
                        <form
                          action={async (formData: FormData) => {
                            "use server";
                            await updateProductTranslations(
                              String(formData.get("productId") ?? ""),
                              String(formData.get("translations") ?? ""),
                            );
                          }}
                          className="mt-2 w-72 space-y-2"
                        >
                          <input type="hidden" name="productId" value={product.id} />
                          <textarea
                            name="translations"
                            rows={8}
                            defaultValue={JSON.stringify(product.translations ?? {}, null, 2)}
                            placeholder={'{"bn":{"name":"...","description":"..."},"ar":{"name":"..."},"hi":{"name":"..."}}'}
                            aria-label={`Translations for ${product.name}`}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-800"
                          />
                          <button type="submit" className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                            Save translations
                          </button>
                        </form>
                      </details>
                    </td>
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
