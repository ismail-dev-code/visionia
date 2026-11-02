"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { BadgeCheck, Box, Gift, Home, LayoutDashboard, LogOut, Menu, Newspaper, Package, Settings, ShieldCheck, ShoppingCart, Users, Wand2, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Box },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/coupons", label: "Coupons", icon: Gift },
  { href: "/admin/banners", label: "Banners", icon: Wand2 },
  { href: "/admin/reviews", label: "Reviews", icon: BadgeCheck },
  { href: "/admin/newsletter", label: "Newsletter", icon: Newspaper },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1700px] gap-4 p-3 sm:p-4 lg:gap-6 lg:p-6">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-lg font-bold text-white">V</div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</div>
              <div className="text-lg font-semibold text-slate-950">Visionia</div>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 space-y-2 border-t border-slate-200 pt-6">
            <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
              <Home className="h-4 w-4" />
              Back to store
            </Link>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-slate-200 px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-6">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 lg:hidden"
                aria-label="Toggle navigation"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((value) => !value)}
              >
                {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-700 sm:text-xs">Operations</div>
                <div className="text-xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-2xl">Admin Dashboard</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 sm:px-3 sm:py-2 sm:text-sm">System online</div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 sm:px-3 sm:py-2 sm:text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Admin access
              </div>
            </div>
          </header>

          {isMenuOpen && (
            <div className="border-b border-slate-200 bg-slate-50 p-3 lg:hidden">
              <nav className="space-y-1">
                {navigation.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-slate-950"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <div className="p-3 sm:p-4 lg:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
