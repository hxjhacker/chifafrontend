import { Truck } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-l from-royal via-royal-800 to-emerald px-3 py-2.5 text-center text-[12.5px] leading-relaxed text-white sm:text-sm">
      <span className="inline-flex items-center justify-center gap-2">
        <span className="relative grid h-5 w-5 place-items-center" aria-hidden>
          <span className="pulse-dot absolute inset-0 rounded-full bg-amber-400/70" />
          <Truck className="relative h-3.5 w-3.5 text-amber-100" />
        </span>
        التوصيل مجاني وسريع لجميع المدن المغربية + الدفع نقدًا عند الاستلام بعد المعاينة!
      </span>
    </div>
  );
}
