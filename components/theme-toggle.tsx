"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // `theme` is undefined during SSR and resolved on the client; suppress the
  // hydration warning on the icon so we don't need a mounted state.
  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Aktifkan Light Mode" : "Aktifkan Dark Mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9"
    >
      <span suppressHydrationWarning>
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </span>
    </Button>
  );
}
