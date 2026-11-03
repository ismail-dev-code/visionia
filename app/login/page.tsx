import { AuthForm } from "@/components/auth/auth-form";
import { getLocale } from "@/lib/i18n";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const [locale, params] = await Promise.all([getLocale(), searchParams]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <AuthForm
        mode="login"
        locale={locale}
        showCartLoginMessage={params.reason === "cart"}
      />
    </main>
  );
}
