"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQS } from "@/lib/educative";

export function Faq({ items }: { items?: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  const list = items ?? FAQS;

  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-extrabold text-royal dark:text-white sm:text-3xl">
        أسئلة كيطرحوها بزاف
      </h2>
      <div className="mt-5 space-y-3">
        {list.map((item, index) => {
          const expanded = open === index;
          const panelId = `faq-panel-${index}`;
          return (
            <div key={item.q} className="overflow-hidden rounded-2xl border border-gold/20 bg-white dark:bg-cardDark">
              <h3>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-right font-bold text-royal dark:text-white"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setOpen(expanded ? -1 : index)}
                >
                  {item.q}
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gold transition ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
              </h3>
              <div id={panelId} hidden={!expanded} className="px-4 pb-4 text-sm leading-relaxed text-royal/75 dark:text-slate-300">
                {item.a}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
