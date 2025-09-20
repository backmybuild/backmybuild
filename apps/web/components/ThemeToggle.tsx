// components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current === "dark";

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="group relative inline-flex h-9 items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 text-sm font-medium shadow-sm backdrop-blur-md transition
                 hover:bg-white/70 active:scale-[0.98]
                 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
    >
      <span className="absolute -inset-px -z-10 rounded-full bg-gradient-to-br from-white/60 to-white/20 blur-xl dark:from-white/10 dark:to-transparent" />
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}
