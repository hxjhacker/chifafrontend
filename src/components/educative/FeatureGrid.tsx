import { BookOpen, Calculator, Languages, Drama, type LucideIcon } from "lucide-react";
import { FEATURES } from "@/lib/educative";

const ICONS: Record<(typeof FEATURES)[number]["icon"], LucideIcon> = {
  book: BookOpen,
  languages: Languages,
  calc: Calculator,
  drama: Drama,
};

export function FeatureGrid() {
  return (
    <section aria-labelledby="content-heading">
      <h2 id="content-heading" className="text-2xl font-extrabold text-royal dark:text-white sm:text-3xl">
        شنو كاين داخل الفلاشة؟
      </h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((feature) => {
          const Icon = ICONS[feature.icon];
          return (
            <article key={feature.id} className="rounded-3xl border border-gold/20 bg-white p-5 shadow-sm dark:bg-cardDark">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/10 text-gold">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 font-extrabold text-royal dark:text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-royal/70 dark:text-slate-400">{feature.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
