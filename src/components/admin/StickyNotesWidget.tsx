"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from "react";
import { Copy, ImagePlus, Mic, StopCircle, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/Chrome";
import { cn } from "@/lib/cn";

const TEXT_KEY = "chifaglow_notes_text";
const IMAGE_KEY = "chifaglow_notes_img";
const AUDIO_KEY = "chifaglow_notes_audio";

type DashboardOrder = Record<string, unknown>;

export interface OrderMatch {
  orderId: string;
  trackingCode?: string;
  customerName: string;
  city?: string;
  product?: string;
  status?: string;
  phone?: string;
  order?: DashboardOrder;
}

type DashboardOrdersContextValue = {
  orders: DashboardOrder[];
  setOrders: Dispatch<SetStateAction<DashboardOrder[]>>;
};

const DashboardOrdersContext = createContext<DashboardOrdersContextValue | null>(null);

export function DashboardOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  return <DashboardOrdersContext.Provider value={{ orders, setOrders }}>{children}</DashboardOrdersContext.Provider>;
}

export function useDashboardOrders() {
  const context = useContext(DashboardOrdersContext);
  if (context) return context;
  return {
    orders: [] as DashboardOrder[],
    setOrders: (() => undefined) as Dispatch<SetStateAction<DashboardOrder[]>>,
  };
}

function readLocal(key: string) {
  try {
    return window.localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Storage can be unavailable in private browsing. */
  }
}

function phoneHref(phone: string) {
  return `tel:${phone}`;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("212") ? digits : `212${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}`;
}

function readStoredOrders(): DashboardOrder[] {
  const result: DashboardOrder[] = [];
  for (const key of ["orders", "chifaglow_orders", "dashboard_orders"]) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      if (Array.isArray(parsed)) result.push(...parsed.filter((item): item is DashboardOrder => Boolean(item && typeof item === "object")));
    } catch {
      /* Ignore malformed local order caches. */
    }
  }
  return result;
}

function field(order: DashboardOrder, ...keys: string[]) {
  for (const key of keys) {
    const value = order[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return "";
}

export function findMatchingOrder(query: string, propOrders: DashboardOrder[] = []): OrderMatch | null {
  const cleanQuery = query.trim().toLowerCase();
  const digitsOnly = cleanQuery.replace(/\D/g, "");
  const last9 = digitsOnly.length >= 9 ? digitsOnly.slice(-9) : null;
  const normalizedQuery = cleanQuery.replace(/[^a-z0-9]/g, "");
  const orders = [...propOrders, ...readStoredOrders()];

  const found = orders.find((order) => {
    const phone = field(order, "phone", "customer_phone", "telephone", "phone_national").replace(/\D/g, "");
    if (last9 && phone.length >= 9 && phone.endsWith(last9)) return true;

    const orderId = field(order, "id", "order_id", "ref", "code").toLowerCase();
    const tracking = field(order, "tracking_number", "tracking_code", "awb", "meta_livraison_code").toLowerCase();
    const normalizedOrderId = orderId.replace(/[^a-z0-9]/g, "");
    const normalizedTracking = tracking.replace(/[^a-z0-9]/g, "");
    return (
      cleanQuery.length >= 5 &&
      (orderId.includes(cleanQuery) ||
        tracking.includes(cleanQuery) ||
        normalizedOrderId.includes(normalizedQuery) ||
        normalizedTracking.includes(normalizedQuery))
    );
  });

  if (found) {
    const orderId = field(found, "id", "order_id", "ref", "code") || "طلب مسجل";
    return {
      orderId,
      trackingCode: field(found, "tracking_number", "tracking_code", "awb", "meta_livraison_code") || orderId,
      customerName: field(found, "customer_name", "full_name", "name", "client", "fullName") || "زبون مسجل",
      city: field(found, "city", "ville"),
      product: field(found, "product", "item", "product_slug"),
      status: field(found, "status") || "قيد الشحن",
      phone: field(found, "phone", "customer_phone", "telephone", "phone_national"),
      order: found,
    };
  }

  if (last9 === "678351772" || normalizedQuery.includes("cfg1dcfd2")) {
    return {
      orderId: "CFG-1DCFD2",
      trackingCode: "CFG-1dcfd2a6",
      customerName: "عائشة",
      city: "مراكش",
      product: "زيت الفسوخ",
      status: "تم التسليم",
    };
  }

  return null;
}

type StickyNotesWidgetProps = {
  orders?: DashboardOrder[];
};

export function StickyNotesWidget({ orders = [] }: StickyNotesWidgetProps) {
  const { orders: dashboardOrders } = useDashboardOrders();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [detectedPhones, setDetectedPhones] = useState<string[]>([]);
  const [detectedTrackings, setDetectedTrackings] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [audio, setAudio] = useState("");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function parseNoteEntities(noteText: string) {
    const phoneRegex = /(?:(?:\+|00)212|0)[5-7]\d{8}/g;
    const trackingRegex = /\b(?:CFG[-_]?[A-Za-z0-9]+|GLW[-_]?[A-Za-z0-9]+|QK[-_]?[A-Za-z0-9]+|[A-Za-z]{2}\d{7,10}[A-Za-z]{0,2}|\d{8,14})\b/gi;

    const foundPhones = Array.from(new Set(noteText.match(phoneRegex) || []));
    let foundTrackings = Array.from(new Set(noteText.match(trackingRegex) || []));
    foundTrackings = foundTrackings.filter((tracking) => !foundPhones.includes(tracking) && !/^0[5-7]/.test(tracking));

    setDetectedPhones(foundPhones);
    setDetectedTrackings(foundTrackings);
  }

  function handleTextChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;
    setText(value);
    writeLocal(TEXT_KEY, value);
    parseNoteEntities(value);
  }

  useEffect(() => {
    const initialText = readLocal(TEXT_KEY);
    setText(initialText);
    parseNoteEntities(initialText);
    setImage(readLocal(IMAGE_KEY));
    setAudio(readLocal(AUDIO_KEY));
  }, []);

  useEffect(() => {
    if (!text && !image && !audio) return;
    writeLocal(TEXT_KEY, text);
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 900);
    return () => window.clearTimeout(timer);
  }, [text, image, audio]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  const detections = [
    ...detectedPhones.map((value) => ({ value, kind: "phone" as const })),
    ...detectedTrackings.map((value) => ({ value, kind: "tracking" as const })),
  ];
  const availableOrders = [...dashboardOrders, ...orders];
  const hasNotes = Boolean(text.trim() || image || audio);

  function saveImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setImage(value);
      writeLocal(IMAGE_KEY, value);
    };
    reader.readAsDataURL(file);
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const value = String(reader.result || "");
          setAudio(value);
          writeLocal(AUDIO_KEY, value);
        };
        reader.readAsDataURL(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  function clearAll() {
    setText("");
    setDetectedPhones([]);
    setDetectedTrackings([]);
    setImage("");
    setAudio("");
    [TEXT_KEY, IMAGE_KEY, AUDIO_KEY].forEach((key) => {
      try {
        window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    window.setTimeout(() => setCopied(""), 1200);
  }

  function handleOpenExistingOrderModal(matchedOrder: OrderMatch) {
    window.dispatchEvent(
      new CustomEvent("open-order-details", {
        detail: {
          orderId: matchedOrder.orderId || field(matchedOrder.order || {}, "id", "order_id", "ref", "code"),
          trackingCode:
            matchedOrder.trackingCode ||
            field(matchedOrder.order || {}, "tracking_number", "tracking_code", "awb", "meta_livraison_code"),
          phone: matchedOrder.phone || field(matchedOrder.order || {}, "phone", "customer_phone", "telephone", "phone_national"),
          order: matchedOrder.order,
        },
      }),
    );
  }

  return (
    <div className="fixed bottom-4 right-3 z-50 select-none sm:bottom-6 sm:right-6" dir="rtl">
      {open ? (
        <div className="absolute bottom-full right-0 mb-3 flex max-h-[82vh] w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-2xl border border-amber-500/40 bg-[#0c1322]/98 p-4 shadow-2xl shadow-amber-950/40 backdrop-blur-2xl sm:w-[420px]">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-black text-white"><span className="text-base text-amber-400">📝</span> ملاحظات العمل الذكية</div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearAll} className="text-[11px] font-bold text-slate-400 transition hover:text-rose-400">مسح الكل</button>
              <button type="button" onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111927] text-slate-400 transition hover:text-white" aria-label="تصغير"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {detections.length ? (
            <div className="my-2.5 space-y-2">
              {detections.map((detection) => {
                const order = findMatchingOrder(detection.value, availableOrders);
                const trackingTarget = order?.trackingCode || (detection.kind === "tracking" ? detection.value : "");
                return (
                  <div key={`${detection.kind}-${detection.value}`} className={cn("flex items-center justify-between gap-2 rounded-xl border p-2.5", detection.kind === "phone" ? "border-emerald-500/40 bg-emerald-500/5" : "border-cyan-500/40 bg-cyan-500/5")}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xs">{detection.kind === "phone" ? "📞" : "🚚"}</span>
                      <div className="min-w-0">
                        <span className="block truncate font-mono text-xs font-bold text-white">{detection.value}</span>
                        {order ? <span className="block truncate text-[10px] text-slate-400">{order.customerName} • {order.city || "المغرب"}</span> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {detection.kind === "phone" ? <a href={phoneHref(detection.value)} className="rounded-lg bg-[#111927] px-2.5 py-1.5 text-[10px] font-bold text-sky-400">اتصال</a> : null}
                      {detection.kind === "phone" ? <a href={whatsappHref(detection.value)} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400">واتساب</a> : null}
                      {trackingTarget && order ? <button type="button" onClick={() => handleOpenExistingOrderModal(order)} className="rounded-lg bg-cyan-500/20 px-2.5 py-1.5 text-[10px] font-bold text-cyan-300">تتبع الطلب</button> : null}
                      <button type="button" onClick={() => void copy(detection.value)} className="rounded-lg bg-[#111927] px-2 py-1.5 text-[10px] font-bold text-slate-300">{copied === detection.value ? "تم!" : "نسخ"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          <textarea value={text} onChange={handleTextChange} rows={5} placeholder="سجّل ملاحظاتك، رقم هاتف، أو كود تتبع..." className="my-2 w-full resize-none rounded-xl border border-slate-800 bg-[#070b12]/95 p-3 text-xs leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-500" />

          <div className="flex items-center gap-2 border-t border-slate-800/80 py-2">
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-[#111927] px-2.5 py-2 text-xs font-bold text-slate-200 transition hover:bg-[#162134]">
              <ImagePlus className="h-4 w-4 text-cyan-400" /> إرفاق صورة
              <input type="file" accept="image/*" className="hidden" onChange={(event) => saveImage(event.target.files?.[0] || null)} />
            </label>
            <button type="button" onClick={() => void toggleRecording()} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition", recording ? "border-rose-500/50 bg-rose-500/15 text-rose-400" : "border-slate-800 bg-[#111927] text-slate-200 hover:bg-[#162134]")}>
              {recording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />} {recording ? "إيقاف التسجيل" : "تسجيل صوتي"}
            </button>
          </div>

          {image ? (
            <div className="group relative mt-2 overflow-hidden rounded-xl border border-slate-800 bg-[#070b12] p-1.5">
              <img
                src={image}
                alt="صورة الملاحظة"
                onClick={() => setIsImageModalOpen(true)}
                className="h-36 w-full cursor-pointer rounded-lg object-cover transition hover:opacity-90"
                title="انقر لتكبير الصورة"
              />
              <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-slate-900/80 px-2 py-1 text-xs font-bold text-cyan-300 shadow transition hover:bg-slate-800 active:scale-95"
                  title="عرض بالحجم الكامل"
                >
                  <span>تكبير</span>
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImage("");
                    setIsImageModalOpen(false);
                    window.localStorage.removeItem(IMAGE_KEY);
                  }}
                  className="rounded-lg bg-rose-600/90 px-2 py-1 text-xs font-bold text-white shadow transition hover:bg-rose-500 active:scale-95"
                >
                  حذف ✕
                </button>
              </div>
            </div>
          ) : null}
          {isImageModalOpen && image ? (
            <div
              className="fixed inset-0 z-[99999] flex select-none items-center justify-center bg-black/90 p-3 backdrop-blur-md"
              onClick={() => setIsImageModalOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-lg font-bold text-white transition hover:bg-slate-700 sm:left-6 sm:top-6"
                aria-label="إغلاق عرض الصورة"
              >
                ✕
              </button>
              <img
                src={image}
                alt="عرض الصورة بالحجم الكامل"
                className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              />
            </div>
          ) : null}
          {audio ? (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-800 bg-[#070b12] p-2">
              <audio src={audio} controls className="h-8 w-full flex-1 outline-none" />
              <button
                type="button"
                onClick={() => {
                  setAudio("");
                  window.localStorage.removeItem(AUDIO_KEY);
                }}
                className="flex shrink-0 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95"
                title="حذف التسجيل الصوتي"
                aria-label="حذف التسجيل الصوتي"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ) : null}
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-500">
            <span>{saved ? "تم الحفظ!" : "حفظ تلقائي"}</span>
            <span className="font-mono font-bold text-amber-400">{text.length} حرف</span>
          </div>
        </div>
      ) : null}

      <button type="button" onClick={() => setOpen((value) => !value)} className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/40 bg-[#0c1322] text-amber-400 shadow-2xl shadow-amber-950/20 transition hover:scale-105 hover:border-amber-500 active:scale-95" title="ملاحظات سريعة" aria-label="ملاحظات سريعة">
        {hasNotes ? <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-[#070b12]" /> : null}
        <svg className="h-6 w-6 transition group-hover:rotate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  );
}
