import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تم تسجيل طلبك بنجاح | Chifaglow",
  description: "شكراً لثقتكم في شيفا جلو. تم تسجيل طلبكم بنجاح وسنتصل بكم قريباً لتأكيد العنوان.",
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
