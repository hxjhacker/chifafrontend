"use client";

import { useEffect } from "react";
import { Eye, MapPin, MessageSquare, Pencil, Phone, X } from "lucide-react";
import {
  copyablePhone,
  detailedAddress,
  formatMad,
  formatStamp,
  orderLineItems,
  shortOrderRef,
  sourceLabel,
  statusMeta,
  type AdminOrder,
  type AdminStatus,
} from "@/lib/admin";
import { regionNameForId } from "@/lib/admin-geo";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

type Props = {
  order: AdminOrder | null;
  onClose: () => void;
  onEdit: (order: AdminOrder) => void;
};

const STAGES: {
  id: Exclude<AdminStatus, "new"> | "created";
  title: string;
  hint: string;
  dot: string;
  ring: string;
  line: string;
}[] = [
  {
    id: "created",
    title: "تم استلام الطلب",
    hint: "Created",
    dot: "bg-amber-400",
    ring: "ring-amber-400/30",
    line: "bg-amber-400/40",
  },
  {
    id: "confirmed",
    title: "تم التأكيد الهاتفي",
    hint: "Confirmed",
    dot: "bg-sky-400",
    ring: "ring-sky-400/30",
    line: "bg-sky-400/40",
  },
  {
    id: "shipped",
    title: "قيد الشحن والتوزيع",
    hint: "Shipped",
    dot: "bg-violet-400",
    ring: "ring-violet-400/30",
    line: "bg-violet-400/40",
  },
  {
    id: "delivered",
    title: "تم التسليم وقبض المبلغ",
    hint: "Delivered",
    dot: "bg-emerald-400",
    ring: "ring-emerald-400/30",
    line: "bg-emerald-400/40",
  },
];

function reached(order: AdminOrder, stage: (typeof STAGES)[number]["id"] | "cancelled") {
  if (stage === "created") return true;
  if (stage === "cancelled") return order.status === "cancelled";
  if (stage === "confirmed") {
    return Boolean(order.confirmed_at) || ["confirmed", "shipped", "delivered"].includes(order.status);
  }
  if (stage === "shipped") {
    return Boolean(order.shipped_at) || ["shipped", "delivered"].includes(order.status);
  }
  return Boolean(order.delivered_at) || order.status === "delivered";
}

function stageStamp(order: AdminOrder, stage: (typeof STAGES)[number]["id"] | "cancelled") {
  if (stage === "created") return order.created_at;
  if (stage === "confirmed") return order.confirmed_at;
  if (stage === "shipped") return order.shipped_at;
  if (stage === "delivered") return order.delivered_at;
  return order.cancelled_at;
}

export function OrderTimelineModal({ order, onClose, onEdit }: Props) {
  useLockBodyScroll(Boolean(order));
  useEffect(() => {
    if (!order) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [order, onClose]);

  if (!order) return null;

  const phone = copyablePhone(order);
  const address = detailedAddress(order) || "لم يُسجَّل العنوان بعد";
  const region = regionNameForId(order.region_id || order.region || "");
  const lines = orderLineItems(order);
  const notes = (order.courier_notes || order.driver_comment || "").trim();
  const meta = statusMeta(order.status);
  const showCancel = order.status === "cancelled";

  return (
    <div
      id="order-timeline-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="custom-scrollbar relative my-auto flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-3xl border border-[#1e293b] bg-[#0b1322] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#1e293b] bg-[#0b1322]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-500/30 bg-sky-500/10 text-sky-400">
              <Eye className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-black">عرض التفاصيل ومسار الطلب</h3>
              <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                {shortOrderRef(order.order_id)} · {meta.label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="إغلاق"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e293b] bg-[#0f172a] text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-2xl border border-[#1e293b] bg-[#0f172a] p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-white">ملخص الطلبية</h4>
              <span className={cn("rounded-lg border px-2 py-0.5 text-[10px] font-bold", meta.tone)}>{meta.label}</span>
            </div>
            <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">الرقم المرجعي</dt>
                <dd className="mt-0.5 font-mono font-bold text-gold">{shortOrderRef(order.order_id)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">الاسم الكامل</dt>
                <dd className="mt-0.5 font-black text-white">{order.full_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">المدينة</dt>
                <dd className="mt-0.5 font-bold text-sky-300">{order.city}</dd>
              </div>
              <div>
                <dt className="text-slate-500">الجهة</dt>
                <dd className="mt-0.5 font-bold text-slate-200">{region}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-slate-500">
                  <Phone className="h-3 w-3" /> الهاتف
                </dt>
                <dd className="mt-0.5 font-mono font-bold text-white" dir="ltr">
                  {phone}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">المبلغ الإجمالي</dt>
                <dd className="mt-0.5 font-black text-emerald-400">{formatMad(order.total)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1 text-slate-500">
                  <MapPin className="h-3 w-3" /> العنوان التفصيلي
                </dt>
                <dd className="mt-1 rounded-xl border border-[#1e293b] bg-[#060b14] px-3 py-2 font-bold leading-6 text-slate-200">
                  {address}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold text-slate-500">تفصيل المنتجات والكميات</p>
              <ul className="space-y-1.5">
                {lines.map((line) => (
                  <li
                    key={`${line.label}-${line.qty}`}
                    className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#060b14] px-3 py-2 text-xs"
                  >
                    <span className="font-bold text-slate-200">{line.label}</span>
                    <span className="rounded-md bg-gold/10 px-2 py-0.5 font-black text-gold">× {line.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
              <MessageSquare className="h-3.5 w-3.5" /> ملاحظات الموزع / تعليق السائق
            </p>
            <p className="text-sm font-bold leading-6 text-amber-50">
              {notes || "لا توجد ملاحظات خاصة — الاتصال قبل الوصول / فتح المعاينة قبل الأداء"}
            </p>
          </section>

          <section>
            <h4 className="mb-4 text-sm font-black text-white">مسار الطلبية</h4>
            <ol className="relative space-y-0 pr-1">
              {STAGES.map((stage, index) => {
                const done = reached(order, stage.id);
                const stamp = stageStamp(order, stage.id);
                const isCurrent =
                  (stage.id === "created" && order.status === "new" && !showCancel) ||
                  (stage.id !== "created" && order.status === stage.id);
                let detail = "";
                if (stage.id === "created") detail = `المصدر: ${sourceLabel(order.source)}`;
                if (stage.id === "confirmed") {
                  detail = done ? `${address}${lines.length ? ` · ${lines.map((l) => `${l.label} ×${l.qty}`).join(" + ")}` : ""}` : "في انتظار التأكيد الهاتفي";
                }
                if (stage.id === "shipped") detail = done ? `منطقة التوزيع: ${order.city} — ${region}` : "لم تُشحن بعد";
                if (stage.id === "delivered") {
                  detail = done ? "تم قبض مبلغ الدفع عند الاستلام" : "لم يُسلَّم بعد";
                }
                return (
                  <li key={stage.id} className="relative flex gap-3 pb-6 last:pb-0">
                    {index < STAGES.length - 1 || showCancel ? (
                      <span
                        className={cn(
                          "absolute right-[9px] top-5 h-[calc(100%-8px)] w-0.5",
                          done ? stage.line : "bg-[#1e293b]",
                        )}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 mt-0.5 h-[20px] w-[20px] shrink-0 rounded-full ring-4",
                        done ? `${stage.dot} ${stage.ring}` : "bg-[#1e293b] ring-[#0f172a]",
                        isCurrent && "scale-110",
                      )}
                    />
                    <div className={cn("min-w-0 flex-1 rounded-2xl border px-3 py-2.5", done ? "border-[#1e293b] bg-[#0f172a]" : "border-[#1e293b]/60 bg-transparent opacity-60")}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-white">{stage.title}</p>
                        <span className="text-[10px] font-mono text-slate-500">{done ? formatStamp(stamp) : "—"}</span>
                      </div>
                      <p className="mt-1 text-[11px] leading-5 text-slate-400">{detail}</p>
                    </div>
                  </li>
                );
              })}
              {showCancel ? (
                <li className="relative flex gap-3">
                  <span className="relative z-10 mt-0.5 h-[20px] w-[20px] shrink-0 rounded-full bg-rose-500 ring-4 ring-rose-500/30" />
                  <div className="min-w-0 flex-1 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black text-rose-200">ملغاة</p>
                      <span className="text-[10px] font-mono text-rose-300/80">{formatStamp(order.cancelled_at)}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-5 text-rose-100/80">
                      {notes || "تم إلغاء الطلبية — لم يُذكر سبب إضافي"}
                    </p>
                  </div>
                </li>
              ) : null}
            </ol>
          </section>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-[#1e293b] bg-[#0b1322] p-4">
          <button
            type="button"
            onClick={() => onEdit(order)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 py-2.5 text-xs font-black text-gold transition hover:bg-gold hover:text-royal"
          >
            <Pencil className="h-3.5 w-3.5" /> الانتقال للتعديل والتأكيد
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#1e293b] bg-[#0f172a] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:text-white"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
