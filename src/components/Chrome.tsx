"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { applyTheme, resolveIsDark, storedTheme, THEME_STORAGE_KEY } from "@/lib/theme";

export function waLink(message: string) {
  return `https://wa.me/212620863895?text=${encodeURIComponent(message)}`;
}

export const WA_LINK = waLink("Salam Chifaglow, bghit nswl 3la l-USB");

function hashHref(home: boolean, hash: string) {
  return home ? hash : `/${hash}`;
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function ThemeSync() {
  useLayoutEffect(() => {
    applyTheme(resolveIsDark());
  }, []);
  return null;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useLayoutEffect(() => {
    const initial = resolveIsDark();
    applyTheme(initial);
    setDark(initial);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onPrefChange = (e: MediaQueryListEvent) => {
      if (storedTheme()) return;
      applyTheme(e.matches);
      setDark(e.matches);
    };
    media.addEventListener("change", onPrefChange);
    return () => media.removeEventListener("change", onPrefChange);
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      aria-label="تبديل الوضع"
      onClick={toggle}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold transition hover:scale-105 active:scale-95 dark:bg-brandDark"
    >
      {dark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function WhatsAppFloat({ raised = false }: { raised?: boolean }) {
  return (
    <a
      href={WA_LINK}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className={cn(
        "wa-pulse fixed left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-[#25D366] text-white shadow-2xl transition-all hover:scale-110 active:scale-95 md:h-14 md:w-14",
        raised ? "bottom-24" : "bottom-5",
      )}
    >
      <WhatsAppIcon className="h-7 w-7 md:h-8 md:w-8" />
    </a>
  );
}

export function BackToTop({ raised = false }: { raised?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="الرجوع إلى الأعلى"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold/40 bg-royal text-gold shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-gold hover:text-royal active:scale-95 dark:bg-cardDark",
        raised ? "bottom-24" : "bottom-5",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}

export function TopBar() {
  return (
    <div className="border-b border-gold/30 bg-royal px-4 py-2.5 text-center text-xs font-bold text-white dark:bg-cardDark md:text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-2">
        <span className="inline-flex animate-pulse items-center justify-center rounded-md bg-moroccoRed px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
          عرض حصري
        </span>
        <span className="text-gold-100">
          توصيل مجاني لجميع مدن المغرب + الدفع نقدًا بعد معاينة السلعة بيدك!
        </span>
      </div>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const home = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-white/95 shadow-sm backdrop-blur-md transition-colors duration-300 dark:bg-brandDark/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-gold bg-royal shadow-sm dark:bg-cardDark md:h-11 md:w-11">
            <span className="font-cinzel text-xl font-black text-gold">C</span>
          </div>
          <div>
            <span className="font-cinzel block text-lg font-black tracking-widest text-royal dark:text-white md:text-xl">
              CHIFAGLOW
            </span>
            <span className="-mt-1 block text-[10px] font-extrabold tracking-wider text-gold-600 dark:text-gold">
              شيفا جلو المغرب
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          <nav className="hidden items-center gap-6 text-sm font-bold text-royal/90 dark:text-slate-200 md:flex">
            <Link href={hashHref(home, "#catalog")} className="transition hover:text-gold">
              المنتجات
            </Link>
            <Link href={hashHref(home, "#features")} className="transition hover:text-gold">
              المميزات
            </Link>
            <Link href={hashHref(home, "#reviews")} className="transition hover:text-gold">
              آراء الزبناء
            </Link>
          </nav>
          <ThemeToggle />
          <Link
            href={hashHref(home, "#catalog")}
            className="rounded-xl border border-gold bg-royal px-4 py-2 text-xs font-black text-gold shadow-sm transition-all hover:brightness-110 dark:bg-gold dark:text-brandDark md:text-sm"
          >
            تصفح الباقات
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const pathname = usePathname();
  const home = pathname === "/";

  return (
    <footer className="border-t border-gold/30 bg-royal py-10 text-cream transition-colors duration-300 dark:bg-brandDark">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center md:flex-row md:text-right">
        <div>
          <span className="font-cinzel text-xl font-bold text-gold">CHIFAGLOW</span>
          <p className="mt-1 text-xs text-cream/70">شيفا جلو — المتجر المغربي المعتمد لمنتجات الوسائط الفاخرة.</p>
        </div>
        <div className="flex items-center gap-6 text-xs font-semibold text-cream/80">
          <Link href={hashHref(home, "#catalog")} className="transition hover:text-gold">
            المنتجات
          </Link>
          <Link href={hashHref(home, "#features")} className="transition hover:text-gold">
            الضمان والتوصيل
          </Link>
          <a href={WA_LINK} target="_blank" rel="noreferrer" className="transition hover:text-gold">
            واتساب
          </a>
        </div>
        <p className="text-xs text-cream/60">© {new Date().getFullYear()} Chifaglow.com — جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}
