"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  MapPin,
  PackageOpen,
  User,
} from "lucide-react";
import { fetchOrder, finalizePurchase, type OrderResponse } from "@/lib/api";
import { getProduct } from "@/lib/products";
import { trackPurchaseOnce } from "@/lib/tracking";
import { waLink, WhatsAppIcon } from "@/components/Chrome";

type OrderDetails = {
  name: string;
  product: string;
  price: string;
  city: string;
};

function productLabel(order: OrderResponse) {
  const product = getProduct(order.product_slug);
  const name = product?.nameAr || order.product_slug;
  return order.tier_qty > 1 ? `${name} × ${order.tier_qty}` : name;
}

function ThanksInner() {
  const params = useSearchParams();
  const orderId = params.get("order") || "";
  const [details, setDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchOrder(orderId)
      .then((order) => {
        if (cancelled) return;
        setDetails({
          name: order.full_name,
          product: productLabel(order),
          price: `${order.total} درهم`,
          city: order.city,
        });
        const contentIds = [order.product_slug, order.cross_sell_slug, order.upsell_slug].filter(
          Boolean,
        ) as string[];
        trackPurchaseOnce({
          orderId: order.order_id,
          value: order.total,
          contentIds,
        });
        void finalizePurchase(order.order_id);
      })
      .catch(() => {
        if (!cancelled) setDetails(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const confirmWa = waLink(
    orderId
      ? `Salam Chifaglow, bghit n2akd talab dyali (${orderId})`
      : "Salam Chifaglow, bghit n2akd talab dyali",
  );

  return (
    <main className="flex flex-grow items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl border-2 border-gold/40 bg-white p-6 text-center shadow-luxury transition-all dark:bg-cardDark sm:p-10">
          <div className="check-glow mx-auto mb-6 flex h-20 w-20 animate-bounce items-center justify-center rounded-full border-2 border-emeraldCustom bg-emeraldCustom/10 text-3xl text-emeraldCustom motion-reduce:animate-none">
            <Check className="h-9 w-9 stroke-[3]" />
          </div>

          <h1 className="text-2xl font-black leading-tight text-royal dark:text-white sm:text-4xl">
            الله يعطيك الصحة، الطلب تسجّل بنجاح!
          </h1>

          {loading ? (
            <p className="mt-4 text-sm font-bold text-royal/60 dark:text-slate-400">كنجيبو تفاصيل الطلب…</p>
          ) : details ? (
            <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-cream px-4 py-2 text-xs font-bold text-royal/80 dark:bg-brandDark dark:text-slate-300 sm:text-sm">
              <span>
                <User className="ml-1 inline h-3.5 w-3.5 text-gold" /> {details.name}
              </span>
              <span className="text-gold">•</span>
              <span>
                <PackageOpen className="ml-1 inline h-3.5 w-3.5 text-gold" /> {details.product}
              </span>
              <span className="text-gold">•</span>
              <span className="font-black text-emeraldCustom">{details.price}</span>
              <span className="text-gold">•</span>
              <span>
                <MapPin className="ml-1 inline h-3.5 w-3.5 text-gold" /> {details.city}
              </span>
            </div>
          ) : null}

          <div className="mt-8 border-t border-gold/20 pt-6 text-right">
            <h2 className="mb-4 text-center text-sm font-black text-royal dark:text-white">شنو الخطوات القادمة دابا؟</h2>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-3.5 rounded-2xl border border-gold/10 bg-cream p-3.5 dark:bg-brandDark">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/10 font-black text-gold">
                  1
                </div>
                <div>
                  <strong className="block font-bold text-royal dark:text-white">مكالمة التأكيد</strong>
                  <p className="mt-0.5 text-royal/70 dark:text-slate-400">
                    سنتصل بك في أقل من ساعتين لتأكيد العنوان وموعد التسليم المناسب لك.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-gold/10 bg-cream p-3.5 dark:bg-brandDark">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/10 font-black text-gold">
                  2
                </div>
                <div>
                  <strong className="block font-bold text-royal dark:text-white">التوصيل السريع (24 - 48 ساعة)</strong>
                  <p className="mt-0.5 text-royal/70 dark:text-slate-400">
                    الموزع غادي يوصلك حتى لباب الدار فجميع مدن وقرى المغرب.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 rounded-2xl border border-gold/10 bg-cream p-3.5 dark:bg-brandDark">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emeraldCustom/10 font-black text-emeraldCustom">
                  3
                </div>
                <div>
                  <strong className="block font-bold text-emeraldCustom">الدفع عند الاستلام بعد الفحص</strong>
                  <p className="mt-0.5 text-royal/70 dark:text-slate-400">
                    حل الكولية ديالك، جربها وتأكد منها عاد خلص الموزع كاش.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={confirmWa}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#20bd5a]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              <span>تأكيد فوري عبر الواتساب</span>
            </a>
            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gold bg-royal px-5 py-3.5 text-sm font-extrabold text-gold transition hover:brightness-110 dark:bg-gold dark:text-brandDark"
            >
              <ArrowRight className="h-4 w-4" />
              <span>الرجوع للمتجر</span>
            </Link>
          </div>

          {orderId ? (
            <div className="mt-6 border-t border-gold/10 pt-4 font-mono text-[11px] text-royal/50 dark:text-slate-500">
              رقم الطلبية المرجعي:{" "}
              <span className="font-bold text-royal/70 dark:text-slate-400">{orderId}</span>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">كنجيبو تفاصيل الطلب…</p>}>
      <ThanksInner />
    </Suspense>
  );
}
