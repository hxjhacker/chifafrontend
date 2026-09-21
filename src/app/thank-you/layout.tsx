import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "تم تسجيل طلبك بنجاح",
  description: `شكراً لثقتكم في ${SITE_NAME}. تم تسجيل طلبكم بنجاح وسنتصل بكم قريباً لتأكيد التوصيل.`,
  robots: { index: false, follow: false },
};

export default function ThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
