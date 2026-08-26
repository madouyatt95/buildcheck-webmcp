"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("buildcheck-theme", next);
  }

  return (
    <button className="button icon ghost" onClick={toggle} aria-label="Toggle light or dark mode">
      <Sun className="theme-dark-icon" aria-hidden="true" />
      <Moon className="theme-light-icon" aria-hidden="true" />
    </button>
  );
}
