import Link from "next/link";
import { Truck, ShieldCheck, Clock3 } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-royal text-gold-300 text-center text-[13px] py-2 px-3">
      التوصيل مجاني + الدفع عند الاستلام لجميع مدن المغرب
    </div>
  );
}

export function Header({ cartCount, onCart }: { cartCount: number; onCart: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur border-b border-gold-200">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-royal text-gold font-cinzel text-xl ring-2 ring-gold">
            C
          </span>
          <span>
            <span className="block font-cinzel text-lg text-royal leading-none">Chifaglow</span>
            <span className="block text-sm text-royal/70">شيفا جلو</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-royal">
          <Link href="/">الرئيسية</Link>
          <Link href="/products/quran">القرآن</Link>
          <Link href="/products/kids">تعليم الأطفال</Link>
          <Link href="/products/music">الموسيقى</Link>
        </nav>
        <button
          type="button"
          onClick={onCart}
          aria-label={`السلة، ${cartCount} منتجات`}
          className="relative rounded-full border border-gold bg-white px-3 py-2 text-royal"
        >
          السلة
          {cartCount > 0 ? (
            <span className="absolute -top-1 -left-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold text-[11px] text-royal font-bold px-1">
              {cartCount}
            </span>
          ) : null}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-royal text-cream">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <p className="font-cinzel text-gold text-xl">Chifaglow</p>
          <p className="text-sm text-cream/80 mt-2">شيفا جلو — محتوى فاخر كيوصل حتى لباب دارك.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-gold" /> الدفع عند الاستلام</span>
          <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-gold" /> توصيل مجاني لجميع المدن</span>
          <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" /> 24–48 ساعة</span>
        </div>
        <p className="text-xs text-cream/60">© {new Date().getFullYear()} chifaglow.com — COD Morocco</p>
      </div>
    </footer>
  );
}
