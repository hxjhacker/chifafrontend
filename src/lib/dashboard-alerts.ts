export type AlertTone = "success" | "info" | "warning" | "error";
export type NoticeKind = AlertTone | "ok" | "warn";

export type DashboardToastInput = {
  tone?: NoticeKind;
  title: string;
  detail?: string;
  duration?: number;
};

export type DashboardToast = {
  id: string;
  tone: AlertTone;
  title: string;
  detail?: string;
  duration: number;
};

export const ALERT_TONES: Record<
  AlertTone,
  {
    label: string;
    accent: string;
    bg: string;
    glow: string;
    iconWrap: string;
    card: string;
    title: string;
    detail: string;
    close: string;
  }
> = {
  success: {
    label: "نجاح",
    accent: "#10b981",
    bg: "rgba(6, 78, 59, 0.2)",
    glow: "0 0 15px rgba(16,185,129,0.15)",
    iconWrap: "bg-[#10b981]/15 text-[#10b981]",
    card: "border-[#10b981]/40",
    title: "text-[#10b981]",
    detail: "text-gray-200",
    close: "text-[#10b981]/70 hover:bg-[#10b981]/10 hover:text-[#10b981]",
  },
  info: {
    label: "تنبيه",
    accent: "#06b6d4",
    bg: "rgba(8, 47, 73, 0.35)",
    glow: "0 0 15px rgba(6,182,212,0.15)",
    iconWrap: "bg-[#06b6d4]/15 text-[#06b6d4]",
    card: "border-[#06b6d4]/40",
    title: "text-[#06b6d4]",
    detail: "text-gray-200",
    close: "text-[#06b6d4]/70 hover:bg-[#06b6d4]/10 hover:text-[#06b6d4]",
  },
  warning: {
    label: "تحذير",
    accent: "#f59e0b",
    bg: "rgba(69, 26, 3, 0.28)",
    glow: "0 0 15px rgba(245,158,11,0.15)",
    iconWrap: "bg-[#f59e0b]/15 text-[#f59e0b]",
    card: "border-[#f59e0b]/40",
    title: "text-[#f59e0b]",
    detail: "text-gray-200",
    close: "text-[#f59e0b]/70 hover:bg-[#f59e0b]/10 hover:text-[#f59e0b]",
  },
  error: {
    label: "خطأ",
    accent: "#f43f5e",
    bg: "rgba(76, 5, 25, 0.28)",
    glow: "0 0 15px rgba(244,63,94,0.15)",
    iconWrap: "bg-[#f43f5e]/15 text-[#f43f5e]",
    card: "border-[#f43f5e]/40",
    title: "text-[#f43f5e]",
    detail: "text-gray-200",
    close: "text-[#f43f5e]/70 hover:bg-[#f43f5e]/10 hover:text-[#f43f5e]",
  },
};

export function resolveAlertTone(kind?: NoticeKind | null): AlertTone {
  if (kind === "ok") return "success";
  if (kind === "warn") return "warning";
  if (kind === "info" || kind === "warning" || kind === "error" || kind === "success") return kind;
  return "success";
}

const listeners = new Set<() => void>();
let toasts: DashboardToast[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeDashboardToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDashboardToasts() {
  return toasts;
}

export function dismissDashboardToast(id: string) {
  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function showDashboardToast(input: DashboardToastInput) {
  const tone = resolveAlertTone(input.tone);
  const item: DashboardToast = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tone,
    title: input.title.trim(),
    detail: input.detail?.trim() || undefined,
    duration: input.duration ?? (tone === "error" ? 6200 : 4200),
  };
  if (!item.title) return item.id;
  toasts = [...toasts.slice(-4), item];
  emit();
  if (typeof window !== "undefined" && (tone === "success" || tone === "warning" || tone === "error")) {
    window.dispatchEvent(
      new CustomEvent("chifaglow-dashboard-sound", {
        detail: { kind: tone === "success" ? "success" : "error" },
      }),
    );
  }
  if (typeof window !== "undefined" && item.duration > 0) {
    window.setTimeout(() => dismissDashboardToast(item.id), item.duration);
  }
  return item.id;
}

export function notifyDashboard(title: string, kind?: NoticeKind, detail?: string) {
  return showDashboardToast({ title, tone: kind, detail });
}

export const dashboardToast = {
  success: (title: string, detail?: string) => showDashboardToast({ tone: "success", title, detail }),
  info: (title: string, detail?: string) => showDashboardToast({ tone: "info", title, detail }),
  warning: (title: string, detail?: string) => showDashboardToast({ tone: "warning", title, detail }),
  error: (title: string, detail?: string) => showDashboardToast({ tone: "error", title, detail }),
};
