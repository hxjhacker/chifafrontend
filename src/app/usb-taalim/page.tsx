import type { Metadata } from "next";
import { USBTaalimLanding } from "@/components/educative/USBTaalimLanding";

export const metadata: Metadata = {
  title: "فلاشة Taalim Kids التعليمية للأطفال | شيفا جلو",
  description:
    "حوّل شاشة التلفاز إلى مدرسة ذكية لطفلك. +1300 فيديو تعليمي بدون إنترنت. توصيل مجاني لجميع مدن المغرب والدفع عند الاستلام بعد المعاينة.",
};

export default function UsbTaalimPage() {
  return <USBTaalimLanding />;
}
