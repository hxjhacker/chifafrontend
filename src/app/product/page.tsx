import type { Metadata } from "next";
import { EducativeProductPage } from "@/components/educative/EducativeProductPage";

export const metadata: Metadata = {
  title: "الفلاشة التعليمية الذكية للأطفال | شيفا جلو",
  description:
    "فلاشة تعليمية للأطفال 100% بدون إنترنت. قرآن، لغات، حساب وقصص هادفة. توصيل مجاني لجميع المدن المغربية والدفع عند الاستلام بعد المعاينة.",
};

export default function ProductPage() {
  return <EducativeProductPage />;
}
