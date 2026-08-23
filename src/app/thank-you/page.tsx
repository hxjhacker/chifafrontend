"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchOrder } from "@/lib/api";
import { getProduct } from "@/lib/products";
import { CheckCircle2 } from "lucide-react";

function ThanksInner() {
  const params = useSearchParams();
  const orderId = params.get("order") || "";
  const [summary, setSummary] = useState("كنجيبو تفاصيل الطلب…");

  useEffect(() => {
    if (!orderId) {
      setSummary("الطلب تسجّل. غادي نتصلو بك لتأكيد العنوان.");
      return;
    }
    fetchOrder(orderId)
      .then((o) => {
        const p = getProduct(o.product_slug);
        setSummary(`${o.full_name} · ${p?.nameAr || o.product_slug} · ${o.total} درهم · ${o.city}`);
      })
      .catch(() => setSummary("الطلب تسجّل بنجاح. غادي نتصلو بك على الهاتف."));
  }, [orderId]);

  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald" />
      <h1 className="mt-4 text-3xl font-extrabold text-royal">الله يعطيك الصحة، الطلب تسجّل</h1>
      <p className="mt-3 text-royal/75">{summary}</p>
      <ul className="mt-6 space-y-2 text-royal">
        <li>غادي نتصلو بك لتأكيد العنوان.</li>
        <li>التوصيل ما بين 24 و 48 ساعة لجميع مدن المغرب.</li>
        <li>الدفع عند الاستلام — ما خاصكش تخلص دابا.</li>
      </ul>
      {orderId ? <p className="mt-6 text-xs text-royal/50">رقم الطلب: {orderId}</p> : null}
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">...</p>}>
      <ThanksInner />
    </Suspense>
  );
}
