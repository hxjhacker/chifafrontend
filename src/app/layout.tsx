import type { Metadata } from "next";
import { Cairo, Cinzel, Tajawal } from "next/font/google";
import { StoreShell } from "@/components/StoreShell";
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

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}else{document.documentElement.classList.remove("dark")}}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Chifaglow | شيفا جلو — مفاتيح USB فاخرة والدفع عند الاستلام",
  description:
    "مفاتيح USB أصلية ومعدنية: القرآن الكريم كاملاً، تعليم الأطفال، وأروع الموسيقى. توصيل مجاني والدفع بعد المعاينة.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://chifaglow.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`scroll-smooth ${cairo.variable} ${tajawal.variable} ${cinzel.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-cairo bg-cream text-royal antialiased">
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
