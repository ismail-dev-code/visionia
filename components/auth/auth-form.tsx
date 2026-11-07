"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";

import { registerUser } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { translate, type Locale } from "@/lib/i18n-shared";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";
import Image from "next/image";

type AuthFormValues = LoginInput & Partial<Pick<RegisterInput, "name">>;

type AuthFormProps = {
  mode: "login" | "register";
  locale: Locale;
  showCartLoginMessage?: boolean;
};

export function AuthForm({
  mode,
  locale,
  showCartLoginMessage = false,
}: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const schema = mode === "login" ? loginSchema : registerSchema;
  const defaultValues =
    mode === "login"
      ? { email: "", password: "" }
      : { name: "", email: "", password: "" };

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(schema) as Resolver<AuthFormValues>,
    defaultValues,
  });

  const onSubmit = async (values: AuthFormValues) => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await registerUser({
          name: values.name,
          email: values.email,
          password: values.password,
        });
      }

      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (result?.error) {
        setError(translate(locale, "auth.invalidCredentials"));
        return;
      }

      router.push("/");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : translate(locale, "common.error"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validationMessage = (message: unknown, key: string) => {
    if (typeof message !== "string") {
      return undefined;
    }

    return translate(
      locale,
      message.includes("Name must")
        ? "auth.nameInvalid"
        : message.includes("valid email")
          ? "auth.emailInvalid"
          : message.includes("Password must")
            ? "auth.passwordInvalid"
            : key,
    );
  };
  const nameError = validationMessage(
    form.formState.errors.name?.message,
    "common.error",
  );
  const emailError = validationMessage(
    form.formState.errors.email?.message,
    "common.error",
  );
  const passwordError = validationMessage(
    form.formState.errors.password?.message,
    "common.error",
  );
  const isLogin = mode === "login";

  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] md:min-h-[620px] md:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white md:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label={translate(locale, "navigation.home")}
        >
          <Image
            src="/visionia-logo.svg"
            alt="Visionia Logo"
            width={220}
            height={80}
            priority
            className="block h-auto w-[130px] object-contain sm:w-[160px] lg:w-[190px]"
          />
        </Link>
        <div className="relative max-w-sm py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            {translate(locale, "auth.thoughtful")}
          </p>
          <h2 className="text-4xl font-semibold leading-tight tracking-[-0.06em]">
            {translate(
              locale,
              isLogin ? "auth.loginHeadline" : "auth.registerHeadline",
            )}
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            {isLogin
              ? translate(locale, "auth.loginDescription")
              : translate(locale, "auth.registerDescription")}
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          {translate(locale, "auth.tagline")}
        </p>
      </aside>

      <section className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
        <div className="mb-8 flex items-center justify-between md:justify-end">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold tracking-[0.18em] text-slate-900 md:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              V
            </span>
            VISIONIA
          </Link>
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            {translate(locale, isLogin ? "auth.welcomeBack" : "auth.join")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-4xl">
            {translate(locale, isLogin ? "auth.signIn" : "auth.createAccount")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {isLogin
              ? translate(locale, "auth.continue")
              : translate(locale, "auth.startShopping")}
          </p>
        </div>

        {isLogin && showCartLoginMessage && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 px-3.5 py-3 text-sm text-cyan-900"
          >
            {translate(locale, "common.loginRequired")}
          </p>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {mode === "register" && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {translate(locale, "auth.name")}
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "name-error" : undefined}
                  {...form.register("name")}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                  placeholder={translate(locale, "auth.yourName")}
                />
              </div>
              {nameError && (
                <p id="name-error" className="mt-1.5 text-xs text-rose-600">
                  {nameError}
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {translate(locale, "auth.email")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? "email-error" : undefined}
                {...form.register("email")}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                placeholder={translate(locale, "auth.emailPlaceholder")}
              />
            </div>
            {emailError && (
              <p id="email-error" className="mt-1.5 text-xs text-rose-600">
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              {translate(locale, "auth.password")}
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? "password-error" : undefined}
                {...form.register("password")}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 ps-10 pe-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10"
                placeholder={translate(locale, "auth.passwordPlaceholder")}
              />
              <button
                type="button"
                aria-label={translate(
                  locale,
                  isPasswordVisible ? "auth.hidePassword" : "auth.showPassword",
                )}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
              >
                {isPasswordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="mt-1.5 text-xs text-rose-600">
                {passwordError}
              </p>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-slate-950"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? translate(locale, "auth.submitting")
              : translate(
                  locale,
                  isLogin ? "auth.loginButton" : "auth.createButton",
                )}
          </Button>
        </form>

        <p className="mt-7 text-center text-sm text-slate-600">
          {translate(locale, isLogin ? "auth.noAccount" : "auth.hasAccount")}{" "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-semibold text-slate-950 underline-offset-4 hover:underline"
          >
            {translate(locale, isLogin ? "auth.createLink" : "auth.loginLink")}
          </Link>
        </p>
      </section>
    </div>
  );
}
