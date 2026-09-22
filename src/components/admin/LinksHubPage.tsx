"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Facebook,
  MessageCircle,
  Music2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { readStorage, writeStorage } from "@/lib/safe-storage";

type LinkKey =
  | "store"
  | "tracking"
  | "policy"
  | "whatsapp"
  | "instagram"
  | "tiktok"
  | "metaAds"
  | "tiktokAds"
  | "snapchatAds";

type LinkItem = {
  key: LinkKey;
  code: string;
  title: string;
  subtitle: string;
  url: string;
  action: string;
  tone: "amber" | "cyan" | "slate" | "emerald" | "pink" | "blue";
  icon: "brand" | "message" | "music" | "facebook";
};

const LINKS_KEY = "chifaglow_custom_links";

const DEFAULT_LINKS: Record<LinkKey, string> = {
  store: "https://chifaglow.com",
  tracking: "https://chifaglow.com/track",
  policy: "https://chifaglow.com/policy",
  whatsapp: "https://web.whatsapp.com",
  instagram: "https://instagram.com/chifaglow",
  tiktok: "https://tiktok.com/@chifaglow",
  metaAds: "https://adsmanager.facebook.com",
  tiktokAds: "https://ads.tiktok.com",
  snapchatAds: "https://ads.snapchat.com",
};

const ITEMS: LinkItem[] = [
  { key: "store", code: "CG", title: "متجر CHIFA GLOW", subtitle: "الصفحة الرئيسية للواجهة", url: DEFAULT_LINKS.store, action: "فتح المتجر", tone: "amber", icon: "brand" },
  { key: "tracking", code: "TR", title: "تتبع الشحنات والطلبيات", subtitle: "بوابة تتبع طلبية الزبون", url: DEFAULT_LINKS.tracking, action: "فتح التتبع", tone: "cyan", icon: "brand" },
  { key: "policy", code: "PL", title: "الشروط وسياسة الاستبدال", subtitle: "صفحة الضمان والاسترجاع", url: DEFAULT_LINKS.policy, action: "فتح الصفحة", tone: "slate", icon: "brand" },
  { key: "whatsapp", code: "WA", title: "WhatsApp Business", subtitle: "تأكيد ومتابعة طلبيات COD", url: DEFAULT_LINKS.whatsapp, action: "فتح الويب", tone: "emerald", icon: "message" },
  { key: "instagram", code: "IG", title: "Instagram Brand Page", subtitle: "chifaglow.official@", url: DEFAULT_LINKS.instagram, action: "زيارة الحساب", tone: "pink", icon: "brand" },
  { key: "tiktok", code: "TK", title: "TikTok Account", subtitle: "فيديوهات UGC والتفاعل", url: DEFAULT_LINKS.tiktok, action: "زيارة الحساب", tone: "slate", icon: "music" },
  { key: "metaAds", code: "FB", title: "Meta Ads Manager", subtitle: "إعلانات Facebook و Instagram", url: DEFAULT_LINKS.metaAds, action: "إدارة الإعلانات", tone: "blue", icon: "facebook" },
  { key: "tiktokAds", code: "TK", title: "TikTok Ads Manager", subtitle: "Spark Ads ومتابعة التكاليف", url: DEFAULT_LINKS.tiktokAds, action: "إدارة الإعلانات", tone: "pink", icon: "music" },
  { key: "snapchatAds", code: "SC", title: "Snapchat Ads Manager", subtitle: "Story Ads وفلاتر الاستجابة", url: DEFAULT_LINKS.snapchatAds, action: "إدارة الإعلانات", tone: "amber", icon: "brand" },
];

const GROUPS = [
  { title: "روابط متجر CHIFA GLOW", badge: "Storefront", tone: "amber", keys: ["store", "tracking", "policy"] as LinkKey[] },
  { title: "حسابات التواصل الاجتماعي والدعم", badge: "Community", tone: "emerald", keys: ["whatsapp", "instagram", "tiktok"] as LinkKey[] },
  { title: "حسابات إدارة الإعلانات", badge: "Ads & Pixels", tone: "cyan", keys: ["metaAds", "tiktokAds", "snapchatAds"] as LinkKey[] },
] as const;

const TONE_STYLES: Record<LinkItem["tone"], { border: string; icon: string; action: string; dot: string }> = {
  amber: { border: "hover:border-amber-500/40", icon: "bg-amber-500/10 border-amber-500/30 text-amber-400", action: "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25", dot: "bg-amber-400" },
  cyan: { border: "hover:border-cyan-500/40", icon: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400", action: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25", dot: "bg-cyan-400" },
  slate: { border: "hover:border-slate-600", icon: "bg-slate-800 border-slate-700 text-slate-300", action: "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700", dot: "bg-slate-400" },
  emerald: { border: "hover:border-emerald-500/40", icon: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", action: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25", dot: "bg-emerald-400" },
  pink: { border: "hover:border-pink-500/40", icon: "bg-pink-500/10 border-pink-500/30 text-pink-400", action: "bg-pink-500/15 border-pink-500/30 text-pink-400 hover:bg-pink-500/25", dot: "bg-pink-400" },
  blue: { border: "hover:border-blue-500/40", icon: "bg-blue-600/10 border-blue-600/30 text-blue-400", action: "bg-blue-600/15 border-blue-500/30 text-blue-400 hover:bg-blue-600/25", dot: "bg-blue-400" },
};

function iconFor(item: LinkItem) {
  if (item.icon === "message") return <MessageCircle className="h-5 w-5" />;
  if (item.icon === "music") return <Music2 className="h-5 w-5" />;
  if (item.icon === "facebook") return <Facebook className="h-5 w-5" />;
  return <span className="text-xs font-black">{item.code}</span>;
}

export function LinksHubPage() {
  const [links, setLinks] = useState<Record<LinkKey, string>>(DEFAULT_LINKS);
  const [drafts, setDrafts] = useState<Record<LinkKey, string>>(DEFAULT_LINKS);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<LinkKey | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = readStorage(LINKS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<LinkKey, string>>;
      const next = { ...DEFAULT_LINKS, ...parsed };
      setLinks(next);
      setDrafts(next);
    } catch {
      /* Keep defaults when local storage is malformed. */
    }
  }, []);

  const itemByKey = useMemo(() => new Map(ITEMS.map((item) => [item.key, item])), []);

  function startEditing() {
    setDrafts(links);
    setEditing((value) => !value);
  }

  function saveLinks() {
    setLinks(drafts);
    writeStorage(LINKS_KEY, JSON.stringify(drafts));
    setEditing(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  function resetLinks() {
    setLinks(DEFAULT_LINKS);
    setDrafts(DEFAULT_LINKS);
    writeStorage(LINKS_KEY, JSON.stringify(DEFAULT_LINKS));
  }

  async function copyLink(key: LinkKey) {
    await navigator.clipboard.writeText(links[key]);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <main dir="rtl" className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-7xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/90 bg-[#0c1322] p-4 shadow-2xl sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={cn("h-2 w-2 animate-pulse rounded-full", editing ? "bg-amber-400" : "bg-emerald-400")} />
              <span className={cn("font-mono text-[11px] font-bold tracking-wider", editing ? "text-amber-400" : "text-emerald-400")}>
                لوحة القيادة • مركز المنصات
              </span>
            </div>
            <h1 className="flex flex-wrap items-center gap-2.5 text-xl font-black tracking-wide text-white sm:text-2xl">
              مركز الروابط وإدارة المنصات
              {editing ? <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">وضع التعديل</span> : null}
            </h1>
            <p className="text-[11px] text-slate-400 sm:text-xs">الوصول السريع لروابط المتجر، بوابات التتبع، وإدارة حسابات الإعلانات</p>
          </div>
          <div className="flex flex-wrap gap-2 self-start lg:self-center">
            {editing ? (
              <>
                <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-[#111927] px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-[#162134]">
                  إلغاء
                </button>
                <button type="button" onClick={resetLinks} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20">
                  <RotateCcw className="h-3.5 w-3.5" /> استعادة
                </button>
                <button type="button" onClick={saveLinks} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-400 transition hover:bg-emerald-500/25">
                  <Save className="h-3.5 w-3.5" /> حفظ
                </button>
              </>
            ) : (
              <button type="button" onClick={startEditing} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#111927] px-3.5 py-2 text-xs font-bold text-slate-200 transition hover:border-amber-500/50 hover:bg-[#162134] hover:text-amber-400">
                <Pencil className="h-3.5 w-3.5 text-amber-400" /> تعديل الروابط
              </button>
            )}
            <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-[#111927] px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-[#162134] hover:text-white">
              <RefreshCw className="h-3.5 w-3.5" /> تحديث
            </button>
          </div>
        </div>
      </section>

      {GROUPS.map((group) => {
        const groupItems = group.keys.map((key) => itemByKey.get(key)).filter((item): item is LinkItem => Boolean(item));
        return (
          <section key={group.title} className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full shadow-sm", group.tone === "amber" ? "bg-amber-400" : group.tone === "emerald" ? "bg-emerald-400" : "bg-sky-400")} />
                <h2 className="text-sm font-black tracking-wide text-white sm:text-base">{group.title}</h2>
              </div>
              <span className="rounded-full border border-slate-700/80 bg-[#111927] px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-400">{group.badge}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 sm:gap-4">
              {groupItems.map((item) => {
                const tone = TONE_STYLES[item.tone];
                const value = editing ? drafts[item.key] : links[item.key];
                return (
                  <article key={item.key} className={cn("flex flex-col justify-between space-y-3.5 rounded-2xl border border-slate-800 bg-[#0b101b] p-3.5 shadow-xl transition-all sm:p-4", tone.border)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", tone.icon)}>{iconFor(item)}</div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-extrabold text-white">{item.title}</h3>
                          <span className="block truncate text-[10px] text-slate-400">{item.subtitle}</span>
                        </div>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> نشط
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800/80 bg-[#070b12] p-2">
                      {editing ? (
                        <input
                          type="url"
                          value={value}
                          onChange={(event) => setDrafts((current) => ({ ...current, [item.key]: event.target.value }))}
                          className="w-full rounded-lg border border-amber-500/60 bg-[#0b101b] px-2 py-1 text-[11px] text-slate-200 outline-none"
                        />
                      ) : (
                        <span className="block truncate font-mono text-[11px] text-slate-300">{value}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t border-slate-800/60 pt-1">
                      <button type="button" onClick={() => void copyLink(item.key)} className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-slate-700/80 bg-[#111927] px-2 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-[#162134]">
                        {copied === item.key ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied === item.key ? "تم النسخ!" : "نسخ الرابط"}
                      </button>
                      <a href={value} target="_blank" rel="noreferrer" className={cn("flex flex-1 items-center justify-center gap-1 rounded-xl border px-2 py-1.5 text-center text-xs font-bold transition", tone.action)}>
                        <ExternalLink className="h-3.5 w-3.5" /> {item.action}
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      {saved ? <div className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-xl border border-emerald-500/30 bg-[#0c1322] px-4 py-2 text-xs font-bold text-emerald-400 shadow-xl">تم حفظ الروابط</div> : null}
    </main>
  );
}
