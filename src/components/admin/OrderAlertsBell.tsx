"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Clock3, Truck, Volume2, X } from "lucide-react";
import { DashboardBanner } from "@/components/admin/DashboardAlert";
import { PushToggle } from "@/components/admin/PushToggle";
import { IosSwitch } from "@/components/admin/IosSwitch";
import { ADMIN_CARRIERS, hasTracking, type AdminCarrier, type AdminOrder } from "@/lib/admin";
import {
  EMPTY_UNDISPATCHED,
  hoursLabel,
  notifyNewOrderDesktop,
  parseUndispatchedSummary,
  playOrderPing,
  type UndispatchedItem,
  type UndispatchedSummary,
} from "@/lib/order-alerts";
import { showOrderToast } from "@/lib/order-toasts";
import { readStorage, writeStorage } from "@/lib/safe-storage";
import { cn } from "@/lib/cn";

const SOUND_KEY = "cg_order_sound_alerts";
const POLL_MS = 60_000;

type Tab = "new" | "overdue";

type Props = {
  className?: string;
  variant?: "toolbar" | "icon";
  poll?: boolean;
  emitOrderToasts?: boolean;
  panel?: "dropdown" | "sheet";
  orders: AdminOrder[];
  shippingId: string | null;
  onSendCarrier: (order: AdminOrder, carrier: AdminCarrier) => void;
  onShowOverdue: () => void;
  onNotice?: (message: string, kind?: "ok" | "warn") => void;
  onSummary?: (summary: UndispatchedSummary) => void;
};

function asOrder(item: UndispatchedItem, orders: AdminOrder[]): AdminOrder | null {
  const hit = orders.find((row) => row.order_id === item.order_id);
  if (hit) return hit;
  return {
    order_id: item.order_id,
    created_at: item.created_at,
    full_name: item.full_name,
    city: item.city,
    phone: item.phone,
    phone_national: item.phone,
    product_slug: "quran",
    tier_qty: 1,
    cross_sell_slug: null,
    upsell_slug: null,
    pack_label: "",
    total: 0,
    currency: "MAD",
    status: item.status === "confirmed" ? "confirmed" : "new",
    raw_status: item.status,
    address: item.address || null,
    quartier: null,
    street: null,
    building: null,
    landmark: null,
    delivery_window: null,
    courier_notes: null,
    region_id: null,
    bundle_enabled: false,
    secondary_qty: 1,
    full_address: item.address || null,
    region: null,
    primary_product: "quran",
    primary_qty: 1,
    secondary_product: null,
    driver_comment: null,
    total_price: 0,
    source: null,
    updated_at: null,
    confirmed_at: item.confirmed_at,
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    meta_livraison_code: null,
  };
}

export function OrderAlertsBell({
  className,
  variant = "toolbar",
  poll = true,
  emitOrderToasts = true,
  panel = "dropdown",
  orders,
  shippingId,
  onSendCarrier,
  onShowOverdue,
  onNotice,
  onSummary,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("new");
  const [summary, setSummary] = useState<UndispatchedSummary>(EMPTY_UNDISPATCHED);
  const [soundOn, setSoundOn] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const seenRef = useRef<Set<string> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const total = summary.new_orders_count + summary.overdue_orders_count;
  const alert = total > 0;

  const refresh = useCallback(async (announce: boolean) => {
    try {
      const res = await fetch("/api/admin/orders/undispatched-summary", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) return;
      const next = parseUndispatchedSummary(await res.json());
      const newIds = next.new_items.map((item) => item.order_id);
      if (seenRef.current == null) {
        seenRef.current = new Set(newIds);
      } else {
        const fresh = next.new_items.filter((item) => !seenRef.current!.has(item.order_id));
        if (announce && fresh.length && emitOrderToasts) {
          const soundEnabled = readStorage(SOUND_KEY) === "1";
          const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;
          if (desktop) {
            for (const item of [...fresh].reverse()) {
              const payload = {
                isBlacklisted: Boolean(item.is_blacklisted),
                name: item.full_name,
                phone: item.phone,
                city: item.city,
              };
              (window.showOrderToast || showOrderToast)(payload);
            }
          }
          if (soundEnabled) {
            playOrderPing();
            if (desktop) void notifyNewOrderDesktop(fresh[0].full_name, fresh[0].city);
          }
        }
        for (const id of newIds) seenRef.current.add(id);
      }
      setSummary(next);
      onSummary?.(next);
    } catch {
      /* keep last snapshot */
    }
  }, [onSummary, emitOrderToasts]);

  useEffect(() => {
    setSoundOn(readStorage(SOUND_KEY) === "1");
    void refresh(false);
    if (!poll) return;
    const timer = window.setInterval(() => void refresh(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [refresh, poll]);

  const prevShipping = useRef(shippingId);
  useEffect(() => {
    if (prevShipping.current && !shippingId) void refresh(false);
    prevShipping.current = shippingId;
  }, [shippingId, refresh]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setPickingId(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setPickingId(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggleSound() {
    const next = !soundOn;
    if (next && typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    setSoundOn(next);
    writeStorage(SOUND_KEY, next ? "1" : "0");
    onNotice?.(next ? "تم تفعيل التنبيه الصوتي للطلبات الجديدة." : "تم إيقاف التنبيه الصوتي.", "ok");
    if (next) playOrderPing();
  }

  const rows = tab === "new" ? summary.new_items : summary.overdue_items;
  const label = useMemo(() => {
    if (!alert) return "إشعارات الطلبات";
    return `(${total}) طلبات معلقة`;
  }, [alert, total]);

  function send(item: UndispatchedItem, carrier: AdminCarrier) {
    const order = asOrder(item, orders);
    if (!order) return;
    if (hasTracking(order)) return;
    onSendCarrier(order, carrier);
    setPickingId(null);
  }

  return (
    <div className="relative z-30" ref={boxRef}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            setTab(summary.overdue_orders_count && !summary.new_orders_count ? "overdue" : "new");
            void refresh(false);
          }
        }}
        className={cn(
          variant === "icon"
            ? "relative z-20 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
            : "relative z-30 inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-500/20 dark:text-amber-300",
          variant === "icon" && alert && "border-orange-500/50 text-orange-600 dark:text-orange-300",
          className,
        )}
      >
        {variant === "icon" ? (
          <>
            <Bell className="h-4 w-4" />
            {alert ? (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 animate-pulse items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {total > 99 ? "99+" : total}
              </span>
            ) : null}
          </>
        ) : (
          <>
            {alert ? <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse" /> : <Bell className="h-3.5 w-3.5 shrink-0" />}
            <span>{label}</span>
          </>
        )}
      </button>

      {open ? (
        <div
          dir="rtl"
          className={cn(
            "z-[80] overflow-hidden rounded-xl border border-slate-800 bg-[#111a2e] text-white shadow-2xl",
            panel === "sheet"
              ? "fixed inset-x-2 top-14 max-h-[min(28rem,calc(100dvh-4.5rem))]"
              : "absolute right-0 top-full mt-2 w-80",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
            <p className="text-xs font-black">تنبيهات الطلبات</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="إغلاق"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 p-2">
            <button
              type="button"
              onClick={() => setTab("new")}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] font-bold transition",
                tab === "new" ? "bg-emerald-500/20 text-emerald-200" : "text-slate-300 hover:bg-white/5",
              )}
            >
              طلبات جديدة ({summary.new_orders_count})
            </button>
            <button
              type="button"
              onClick={() => setTab("overdue")}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] font-bold transition",
                tab === "overdue" ? "bg-orange-500/20 text-orange-200" : "text-slate-300 hover:bg-white/5",
              )}
            >
              تذكير: طلبات متأخرة ({summary.overdue_orders_count})
            </button>
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto px-2 pb-2">
            {rows.length === 0 ? (
              <p className="px-2 py-6 text-center text-[11px] font-semibold text-slate-400">
                {tab === "new" ? "لا توجد طلبات جديدة بانتظار الإرسال." : "لا توجد طلبات متأخرة."}
              </p>
            ) : (
              rows.map((item) => {
                const sending = shippingId === item.order_id;
                const picking = pickingId === item.order_id;
                return (
                  <div key={item.order_id} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{item.full_name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-400">
                          {item.city || "—"} · {item.code}
                        </p>
                        <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-300">
                          <Clock3 className="h-3 w-3" />
                          {hoursLabel(tab === "overdue" ? item.hours_delayed : item.hours_ago || item.hours_delayed)}
                        </p>
                      </div>
                      {picking ? (
                        <div className="flex flex-col gap-1">
                          {ADMIN_CARRIERS.filter((row) => row.enabled).map((row) => (
                            <button
                              key={row.id}
                              type="button"
                              disabled={sending}
                              onClick={() => send(item, row.id)}
                              className="rounded-lg bg-gold px-2 py-1 text-[10px] font-black text-royal disabled:opacity-60"
                            >
                              {row.label}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={sending}
                          onClick={() => setPickingId(item.order_id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-2 py-1.5 text-[10px] font-black text-white disabled:opacity-60"
                        >
                          <Truck className="h-3 w-3" />
                          {sending ? "جاري…" : "إرسال الآن"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="space-y-1 border-t border-white/10 p-2">
            <button
              type="button"
              onClick={() => void toggleSound()}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-right hover:bg-white/5"
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold">
                <Volume2 className="h-3.5 w-3.5 text-amber-300" />
                تفعيل التنبيه الصوتي للطلبات الجديدة
              </span>
              <IosSwitch checked={soundOn} />
            </button>
            <PushToggle
              variant="menu"
              onNotice={onNotice}
            />
            {summary.overdue_orders_count > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onShowOverdue();
                }}
                className="w-full rounded-xl px-2 py-2 text-[12px] font-bold text-orange-200 hover:bg-orange-500/10"
              >
                عرض الطلبات المتأخرة في الجدول
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OverdueOrdersBanner({
  count,
  onShow,
}: {
  count: number;
  onShow: () => void;
}) {
  const [hidden, setHidden] = useState(false);
  const lastCount = useRef(0);

  useEffect(() => {
    if (count > lastCount.current) setHidden(false);
    lastCount.current = count;
  }, [count]);

  if (count < 1 || hidden) return null;

  return (
    <DashboardBanner
      tone="warning"
      className="mb-3"
      title={`لديك ${count} طلبات مؤكدة لم يتم إرسالها لشركة الشحن بعد.`}
      action={
        <button
          type="button"
          onClick={onShow}
          className="rounded-full bg-[#f59e0b]/20 px-3 py-1.5 text-[11px] font-black text-[#f59e0b] transition hover:bg-[#f59e0b]/30"
        >
          عرض الطلبات
        </button>
      }
      onClose={() => setHidden(true)}
    />
  );
}
