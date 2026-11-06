"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";

import { subscribeToNewsletter, type NewsletterState } from "@/actions/newsletter";

const initialState: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({
  emailLabel,
  emailPlaceholder,
  subscribeLabel,
  className,
}: {
  emailLabel: string;
  emailPlaceholder: string;
  subscribeLabel: string;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <form action={formAction} className={className}>
      <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 p-1">
        <input
          type="email"
          name="email"
          aria-label={emailLabel}
          placeholder={emailPlaceholder}
          autoComplete="email"
          required
          maxLength={254}
          className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label={subscribeLabel}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-slate-300">
        {state.message}
      </p>
    </form>
  );
}
