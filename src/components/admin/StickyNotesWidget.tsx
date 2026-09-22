"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Copy, ImagePlus, Mic, StopCircle, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/Chrome";
import { cn } from "@/lib/cn";

const TEXT_KEY = "chifaglow_notes_text";
const IMAGE_KEY = "chifaglow_notes_img";
const AUDIO_KEY = "chifaglow_notes_audio";

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

function findStoredOrder(value: string) {
  try {
    const raw = window.localStorage.getItem("chifaglow_orders") || window.localStorage.getItem("orders") || "[]";
    const orders = JSON.parse(raw) as Array<Record<string, unknown>>;
    const digits = value.replace(/\D/g, "");
    return orders.find((order) => {
      const phone = String(order.phone || order.customer_phone || "").replace(/\D/g, "");
      return digits.length >= 9 && phone.length >= 9 && (phone.endsWith(digits.slice(-9)) || digits.endsWith(phone.slice(-9)));
    });
  } catch {
    return undefined;
  }
}

export function StickyNotesWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [detectedPhones, setDetectedPhones] = useState<string[]>([]);
  const [detectedTrackings, setDetectedTrackings] = useState<string[]>([]);
  const [image, setImage] = useState("");
  const [audio, setAudio] = useState("");
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
                const order = detection.kind === "phone" ? findStoredOrder(detection.value) : undefined;
                return (
                  <div key={`${detection.kind}-${detection.value}`} className={cn("flex items-center justify-between gap-2 rounded-xl border p-2.5", detection.kind === "phone" ? "border-emerald-500/40 bg-emerald-500/5" : "border-cyan-500/40 bg-cyan-500/5")}>
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-xs">{detection.kind === "phone" ? "📞" : "🚚"}</span>
                      <div className="min-w-0">
                        <span className="block truncate font-mono text-xs font-bold text-white">{detection.value}</span>
                        {order ? <span className="block truncate text-[10px] text-slate-400">{String(order.name || order.full_name || "طلب مسجل")} • {String(order.city || "المغرب")}</span> : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {detection.kind === "phone" ? <a href={phoneHref(detection.value)} className="rounded-lg bg-[#111927] px-2.5 py-1.5 text-[10px] font-bold text-sky-400">اتصال</a> : null}
                      {detection.kind === "phone" ? <a href={whatsappHref(detection.value)} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-bold text-emerald-400">واتساب</a> : null}
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

          {image ? <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#070b12] p-1.5"><img src={image} alt="صورة الملاحظة" className="h-36 w-full rounded-lg object-cover" /><button type="button" onClick={() => setImage("")} className="absolute left-2.5 top-2.5 rounded-lg bg-rose-600/90 px-2 py-0.5 text-xs font-bold text-white">حذف</button></div> : null}
          {audio ? <audio src={audio} controls className="mt-2 h-8 w-full" /> : null}
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
