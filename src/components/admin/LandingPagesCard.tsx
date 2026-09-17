"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Link2 } from "lucide-react";
import { copyText } from "@/lib/admin";
import { SITE_URL } from "@/lib/cn";
import { ROYAL_LANDING_PATH } from "@/lib/royal-pack";

const LANDING_PAGES = [
  {
    id: "pack-royal",
    title: "الباك الملكي",
    path: ROYAL_LANDING_PATH,
  },
] as const;

function absoluteUrl(path: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL.replace(/\/$/, "");
  return `${origin}${path}`;
}

export function LandingPagesCard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyUrl(id: string, path: string) {
    const ok = await copyText(absoluteUrl(path));
    if (!ok) return;
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1800);
  }

  return (
    <div className="relative rounded-3xl border border-gold/20 bg-white p-6 shadow-luxury transition-all dark:bg-cardDark">
      <div className="flex items-center justify-between border-b border-gold/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-sm text-gold">
            <Link2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-royal dark:text-white">صفحات الهبوط (Landing Pages)</h3>
            <p className="text-[11px] text-royal/60 dark:text-slate-400">روابط سريعة للفتح والنسخ لحملات الإعلانات</p>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {LANDING_PAGES.map((page) => {
          const copied = copiedId === page.id;
          return (
            <li
              key={page.id}
              className="flex flex-col gap-3 rounded-2xl border border-gold/10 bg-cream/70 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-brandDark/70"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-royal dark:text-white">{page.title}</p>
                <p className="mt-0.5 truncate font-mono text-xs font-semibold text-royal/60 dark:text-slate-400" dir="ltr">
                  {page.path}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={page.path}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-gold/30 bg-white px-3.5 text-sm font-bold text-royal transition hover:border-gold hover:text-gold dark:bg-brandDark dark:text-slate-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  فتح الرابط
                </a>
                <button
                  type="button"
                  onClick={() => void copyUrl(page.id, page.path)}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-amber-400"
                >
                  {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
                  {copied ? "تم النسخ" : "نسخ الرابط"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
