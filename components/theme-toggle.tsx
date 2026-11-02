"use client";

import { SunMoon } from "lucide-react";
import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("visionia-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle(
      "dark",
      savedTheme ? savedTheme === "dark" : prefersDark
    );
  }, []);

  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    window.localStorage.setItem("visionia-theme", isDark ? "dark" : "light");
  }

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      title="Toggle color theme"
      onClick={toggleTheme}
      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
    >
      <SunMoon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
