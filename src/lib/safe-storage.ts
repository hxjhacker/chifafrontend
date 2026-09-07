export function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("Failed to read cached settings:", e);
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("Failed to save cached settings:", e);
  }
}

export function clearStorage(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* private mode / blocked storage */
  }
}

export function readJsonStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid cached object");
    }
    return parsed as T;
  } catch (e) {
    console.warn("Failed to parse cached settings:", e);
    clearStorage(key);
    return fallback;
  }
}

export function writeJsonStorage(key: string, value: unknown) {
  try {
    writeStorage(key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to save cached settings:", e);
  }
}
