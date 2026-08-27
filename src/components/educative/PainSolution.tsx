import { CheckCircle2, XCircle } from "lucide-react";

export function PainSolution() {
  return (
    <section aria-labelledby="hook-heading">
      <h2 id="hook-heading" className="text-center text-2xl font-extrabold text-royal sm:text-3xl">
        وقت الشاشة ما خاصوش يولي إدمان
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-royal/70">
        الفرق واضح: إما محتوى عشوائي فالهاتف، وإلا محتوى تربوي آمن فالتلفاز.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-red-700">
            <XCircle className="h-5 w-5" aria-hidden />
            مع الهواتف واليوتيوب
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-red-900/80">
            <li>إدمان شاشات صغيرة وقريبة من العينين</li>
            <li>ضعف تركيز وتشتت من الفيديوهات القصيرة</li>
            <li>إعلانات عشوائية غير آمنة</li>
            <li>استهلاك مستمر للإنترنت والبيانات</li>
          </ul>
        </article>
        <article className="rounded-3xl border border-emerald/30 bg-emerald/5 p-5">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-emerald">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
            مع الفلاشة التعليمية الذكية
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-royal/80">
            <li>أمان 100% بدون إنترنت</li>
            <li>محتوى تربوي معتمد: قرآن، لغات، حساب، وقصص</li>
            <li>حماية العينين في التلفاز بدل الهاتف</li>
            <li>تفوق دراسي ممتع… بلا إعلانات وبلا تطبيقات</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
