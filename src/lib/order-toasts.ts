export type OrderToastInput = {
  orderId: string;
  name: string;
  phone: string;
  city?: string;
  isBlacklisted?: boolean;
};

export type OrderToast = OrderToastInput & {
  id: string;
  isBlacklisted: boolean;
};

const DURATION_MS = 30_000;
const listeners = new Set<() => void>();
let toasts: OrderToast[] = [];

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeOrderToasts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getOrderToasts() {
  return toasts;
}

export function dismissOrderToast(id: string) {
  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function isDesktopOrderToastViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;
}

export function nationalPhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("212") && digits.length >= 12) return `0${digits.slice(3, 13)}`;
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(0, 10);
  return String(phone || "").trim();
}

export function whatsappHref(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const intl = digits.startsWith("212") ? digits : digits.startsWith("0") ? `212${digits.slice(1)}` : `212${digits}`;
  return `https://wa.me/${intl}`;
}

export function showOrderToast(input: OrderToastInput) {
  if (!isDesktopOrderToastViewport()) return "";
  const orderId = String(input.orderId || "").trim();
  const name = String(input.name || "").trim();
  const phone = nationalPhone(input.phone);
  if (!orderId || !name || !phone) return "";
  if (toasts.some((item) => item.orderId === orderId)) return "";
  const item: OrderToast = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    orderId,
    name,
    phone,
    city: String(input.city || "").trim(),
    isBlacklisted: Boolean(input.isBlacklisted),
  };
  toasts = [item, ...toasts].slice(0, 8);
  emit();
  window.setTimeout(() => dismissOrderToast(item.id), DURATION_MS);
  return item.id;
}
