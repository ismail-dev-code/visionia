import { getLocale } from "@/lib/i18n";
import { getProducts } from "@/lib/services/products";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length > 120) {
    return Response.json({ error: "Search query is too long." }, { status: 400 });
  }

  if (query.length < 2) {
    return Response.json({ products: [] });
  }

  const locale = await getLocale();
  const catalog = await getProducts(
    { search: query, sort: "popular", limit: 6 },
    locale,
  );

  return Response.json(
    {
      products: catalog.products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: product.discountPrice,
        variantStartingPrice: product.variantStartingPrice,
        primaryImage: product.primaryImage,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
