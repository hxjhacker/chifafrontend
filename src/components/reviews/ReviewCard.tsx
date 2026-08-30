import { BadgeCheck, Star } from "lucide-react";

export type ReviewItem = {
  name: string;
  city: string;
  text: string;
  stars?: number;
};

function initials(name: string) {
  const cleaned = name.replace(/[A-Za-z.]+/g, "").trim() || name.trim();
  return cleaned.slice(0, 1) || "ز";
}

export function Stars({ count = 5, className = "h-3.5 w-3.5" }: { count?: number; className?: string }) {
  return (
    <div className="flex shrink-0 text-gold" aria-label={`${count} من 5`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className={`${className} fill-gold text-gold`} />
      ))}
    </div>
  );
}

export function ReviewCard({ name, city, text, stars = 5 }: ReviewItem) {
  return (
    <article className="rounded-2xl border border-gold/20 bg-white p-5 shadow-sm transition-colors dark:bg-cardDark">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold/40 bg-royal font-black text-gold dark:bg-brandDark">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-royal dark:text-gold">
              {name} — {city}
            </p>
            <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-bold text-emeraldCustom">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              مشتري موثّق
            </span>
          </div>
        </div>
        <Stars count={stars} />
      </div>
      <p className="text-xs leading-relaxed text-royal/80 dark:text-slate-300 sm:text-sm">“{text}”</p>
    </article>
  );
}

export function ReviewGrid({
  id = "reviews",
  title,
  subtitle,
  reviews,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  reviews: ReviewItem[];
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="bg-cream py-4 dark:bg-brandDark">
      <div className="mb-8 text-center sm:mb-10">
        <h2 id={`${id}-heading`} className="text-2xl font-black text-royal dark:text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs font-semibold text-royal/70 dark:text-slate-400 sm:text-sm">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {reviews.map((review) => (
          <ReviewCard key={`${review.name}-${review.city}`} {...review} />
        ))}
      </div>
    </section>
  );
}
