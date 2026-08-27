import { Car, Monitor, Tv, WifiOff } from "lucide-react";

const SPECS = [
  {
    icon: Tv,
    title: "شاشات التلفاز",
    body: "متوافقة مع جميع شاشات التلفاز (Smart TV والعادية المزودة بمنفذ USB).",
  },
  {
    icon: Monitor,
    title: "حواسيب ولوحات",
    body: "متوافقة مع الحواسيب، اللوحات، وشاشات السيارات.",
  },
  {
    icon: Car,
    title: "السيارة",
    body: "شاشات السيارات المزودة بـ USB — المحتوى حاضر فالطريق.",
  },
  {
    icon: WifiOff,
    title: "بدون نت وبدون شريحة",
    body: "تعمل بدون أي شريحة أو حاجة لاتصال واي فاي.",
  },
];

export function Specs() {
  return (
    <section aria-labelledby="specs-heading" className="rounded-[2rem] bg-royal p-6 text-white sm:p-8">
      <p className="text-sm font-bold text-amber-400">Plug & Play</p>
      <h2 id="specs-heading" className="mt-1 text-2xl font-extrabold sm:text-3xl">
        خدامة مباشرة بدون تعقيد
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {SPECS.map((spec) => (
          <article key={spec.title} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <spec.icon className="h-6 w-6 text-amber-400" aria-hidden />
            <h3 className="mt-3 font-bold">{spec.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/75">{spec.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
