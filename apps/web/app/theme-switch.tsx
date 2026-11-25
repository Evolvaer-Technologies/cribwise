"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

export function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("evolvaer-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      // System appearance remains available when storage is blocked.
    }
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    try {
      if (next === "system") localStorage.removeItem("evolvaer-theme");
      else localStorage.setItem("evolvaer-theme", next);
    } catch {
      // The selected theme still works for this visit.
    }
  }

  return (
    <label className="theme-control">
      <span>Appearance</span>
      <select value={theme} onChange={(event) => changeTheme(event.target.value as Theme)}>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
