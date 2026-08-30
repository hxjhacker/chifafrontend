import { CircleCheck, Star } from "lucide-react";

export type ReviewItem = {
  name: string;
  city: string;
  text: string;
  stars?: number;
  avatar?: string;
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

function Avatar({ name, src }: { name: string; src?: string }) {
  const frame =
    "h-12 w-12 shrink-0 rounded-full border-2 border-white bg-slate-100 outline outline-2 outline-slate-200 dark:border-cardDark dark:bg-brandDark dark:outline-white/15";

  if (src) {
    return <img src={src} alt="" className={`${frame} object-cover`} />;
  }

  return (
    <div className={`${frame} flex items-center justify-center text-base font-bold text-slate-500 dark:text-slate-300`} aria-hidden>
      {initials(name)}
    </div>
  );
}

export function ReviewCard({ name, city, text, stars = 5, avatar }: ReviewItem) {
  return (
    <article className="flex flex-col justify-between rounded-[18px] border border-[#eef2f6] bg-white p-6 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_12px_25px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-cardDark dark:hover:border-white/20">
      <div>
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={name} src={avatar} />
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-900 dark:text-white">{name}</p>
              <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">من {city}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <CircleCheck className="h-3.5 w-3.5" aria-hidden />
            مشترٍ موثّق
          </span>
        </div>
        <div className="mb-3 flex gap-[3px] text-amber-400" aria-label={`${stars} من 5`}>
          {Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          ))}
        </div>
        <p className="text-justify text-[14.5px] leading-[1.7] text-slate-600 dark:text-slate-300">{text}</p>
      </div>
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
    <section id={id} aria-labelledby={`${id}-heading`}>
      <div className="mx-auto max-w-[950px]">
        <div className="mb-[30px] text-right">
          <h2 id={`${id}-heading`} className="mb-1 text-[26px] font-extrabold text-[#0b2546] dark:text-white">
            {title}
          </h2>
          {subtitle ? <p className="text-[15px] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <div className="grid grid-cols-1 gap-6 min-[680px]:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={`${review.name}-${review.city}`} {...review} />
          ))}
        </div>
      </div>
    </section>
  );
}
