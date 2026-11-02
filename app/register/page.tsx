import { AuthForm } from "@/components/auth/auth-form";
import { getLocale } from "@/lib/i18n";

export default async function RegisterPage() {
  const locale = await getLocale();
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <AuthForm mode="register" locale={locale} />
    </main>
  );
}
