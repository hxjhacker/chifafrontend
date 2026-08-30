import type { Metadata } from "next";
import { Cairo, Cinzel, Tajawal } from "next/font/google";
import { StoreShell } from "@/components/StoreShell";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chifaglow | شيفا جلو — مفاتيح USB فاخرة والدفع عند الاستلام",
  description:
    "مفاتيح USB أصلية ومعدنية: القرآن الكريم كاملاً، تعليم الأطفال، وأروع الموسيقى. توصيل مجاني والدفع بعد المعاينة.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://chifaglow.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} ${cinzel.variable} font-tajawal bg-cream text-royal antialiased transition-colors duration-300 selection:bg-gold selection:text-royal dark:bg-brandDark dark:text-slate-100`}
      >
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
