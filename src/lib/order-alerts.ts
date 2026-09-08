export type UndispatchedItem = {
  id: string;
  order_id: string;
  code: string;
  full_name: string;
  client_name?: string;
  phone: string;
  city: string;
  address?: string | null;
  status: string;
  created_at: string | null;
  confirmed_at: string | null;
  hours_delayed: number;
  hours_ago?: number;
};

export type UndispatchedSummary = {
  new_orders_count: number;
  overdue_orders_count: number;
  total_count: number;
  new_items: UndispatchedItem[];
  overdue_items: UndispatchedItem[];
  items: UndispatchedItem[];
};

export const EMPTY_UNDISPATCHED: UndispatchedSummary = {
  new_orders_count: 0,
  overdue_orders_count: 0,
  total_count: 0,
  new_items: [],
  overdue_items: [],
  items: [],
};

export function hoursLabel(hours: number) {
  if (hours < 1) return "أقل من ساعة";
  if (hours === 1) return "ساعة واحدة";
  if (hours === 2) return "ساعتان";
  if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
  return `${hours} ساعة`;
}

export function parseUndispatchedSummary(payload: unknown): UndispatchedSummary {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const asItems = (value: unknown): UndispatchedItem[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const item = row as Record<string, unknown>;
        const id = String(item.order_id || item.id || "").trim();
        if (!id) return null;
        const name = String(item.full_name || item.client_name || "").trim();
        return {
          id,
          order_id: id,
          code: String(item.code || "").trim() || `#CFG-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
          full_name: name,
          client_name: name,
          phone: String(item.phone || item.phone_national || "").trim(),
          city: String(item.city || "").trim(),
          address: item.address == null ? null : String(item.address),
          status: String(item.status || "new"),
          created_at: item.created_at ? String(item.created_at) : null,
          confirmed_at: item.confirmed_at ? String(item.confirmed_at) : null,
          hours_delayed: Math.max(0, Number(item.hours_delayed) || 0),
          hours_ago: Math.max(0, Number(item.hours_ago) || Number(item.hours_delayed) || 0),
        };
      })
      .filter((row): row is UndispatchedItem => Boolean(row));
  };
  const newItems = asItems(data.new_items);
  const overdueItems = asItems(data.overdue_items?.length ? data.overdue_items : data.items);
  const newCount = Number(data.new_orders_count);
  const overdueCount = Number(data.overdue_orders_count);
  return {
    new_orders_count: Number.isFinite(newCount) ? newCount : newItems.length,
    overdue_orders_count: Number.isFinite(overdueCount) ? overdueCount : overdueItems.length,
    total_count: Number(data.total_count) || (Number(data.new_orders_count) || newItems.length) + (Number(data.overdue_orders_count) || overdueItems.length),
    new_items: newItems,
    overdue_items: overdueItems,
    items: overdueItems,
  };
}

export function playOrderPing() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.14);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.34);
  osc.onended = () => {
    void ctx.close();
  };
}

export async function notifyNewOrderDesktop(name: string, city: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const title = `طلب جديد وارد: ${name}`;
    const options: NotificationOptions = {
      body: city ? `مدينة: ${city}` : "طلبية جديدة بانتظار الإرسال",
      tag: `new-order-${name}-${city}`,
      silent: true,
      dir: "rtl",
    };
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return;
    }
    new Notification(title, options);
  } catch {
    /* ignore blocked notifications */
  }
}
