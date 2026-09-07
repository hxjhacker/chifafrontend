export const THEME_STORAGE_KEY = "theme";

/** Runs in <head> before paint so the first frame matches the phone / saved choice. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})();`;

export function storedTheme(): "dark" | "light" | null {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    if (t === "dark" || t === "light") return t;
  } catch (e) {
    console.warn("Failed to parse cached settings:", e);
  }
  return null;
}

export function resolveIsDark(): boolean {
  const stored = storedTheme();
  if (stored) return stored === "dark";
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("chifaglow-theme", { detail: { dark } }));
  }
}
