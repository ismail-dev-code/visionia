import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { getCurrentUser } from "@/lib/admin";
import { getLocale } from "@/lib/i18n";
import { getCartSummary } from "@/lib/services/cart";

export async function SiteHeader() {
  const [user, locale] = await Promise.all([
    getCurrentUser(),
    getLocale(),
  ]);
  const cart = await getCartSummary(locale);

  return (
    <SiteHeaderClient
      isAdmin={user?.role === "ADMIN"}
      user={user ? { name: user.name, email: user.email, role: user.role } : null}
      locale={locale}
      initialCartCount={cart.count}
    />
  );
}
