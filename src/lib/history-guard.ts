export function sanitizeHistoryUrl(url: unknown): unknown {
  if (url == null || url === "") return url;
  let value = String(url);
  try {
    if (value.startsWith("//")) value = `${window.location.protocol}${value}`;
    const parsed = new URL(value, window.location.origin);
    const path =
      parsed.hostname === "mydashboard"
        ? `/mydashboard${parsed.pathname === "/" ? "" : parsed.pathname}`
        : parsed.pathname || "/";
    const relative = `/${path.replace(/^\/+/, "")}`.replace(/\/{2,}/g, "/");
    return `${relative === "/" && parsed.hostname === "mydashboard" ? "/mydashboard" : relative}${parsed.search}${parsed.hash}`;
  } catch {
    if (value.startsWith("//mydashboard")) return `/mydashboard${value.slice("//mydashboard".length)}`;
    if (value.startsWith("//")) return `/${value.replace(/^\/+/, "")}`;
    return value;
  }
}

export function installHistoryGuard() {
  if (typeof window === "undefined") return;
  const marker = window as Window & { __cgHistoryGuard?: boolean };
  if (marker.__cgHistoryGuard) return;
  marker.__cgHistoryGuard = true;
  const { pushState, replaceState } = History.prototype;
  History.prototype.pushState = function (data, unused, url) {
    return pushState.call(this, data, unused, arguments.length > 2 ? (sanitizeHistoryUrl(url) as string) : url);
  };
  History.prototype.replaceState = function (data, unused, url) {
    return replaceState.call(this, data, unused, arguments.length > 2 ? (sanitizeHistoryUrl(url) as string) : url);
  };
}
