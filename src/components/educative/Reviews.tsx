import { BadgeCheck, Star } from "lucide-react";
import { REVIEWS } from "@/lib/educative";

export function Reviews() {
  return (
    <section aria-labelledby="reviews-heading">
      <h2 id="reviews-heading" className="text-2xl font-extrabold text-royal sm:text-3xl">
        آباء وأمهات جرّبوها
      </h2>
      <p className="mt-2 text-royal/70">تقييمات مشترين حقيقيين بعد التوصيل والمعاينة.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {REVIEWS.map((review) => (
          <article key={review.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-extrabold text-royal">{review.name}</p>
                <p className="text-xs text-royal/50">{review.city}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-1 text-[11px] font-bold text-emerald">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                مشترٍ موثّق
              </span>
            </div>
            <p className="mt-2 inline-flex text-amber" aria-label={`${review.stars} من 5`}>
              {Array.from({ length: review.stars }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber text-amber" />
              ))}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-royal/80">{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
