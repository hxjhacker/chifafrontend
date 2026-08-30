import type { Metadata } from "next";
import Script from "next/script";
import { Cairo, Cinzel, Tajawal } from "next/font/google";
import { StoreShell } from "@/components/StoreShell";
import { FB_PIXEL_ID } from "@/lib/pixels";
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
        {FB_PIXEL_ID ? (
          <Script id="meta-pixel" strategy="beforeInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${FB_PIXEL_ID}');
          `}</Script>
        ) : null}
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} ${cinzel.variable} font-tajawal bg-cream text-royal antialiased transition-colors duration-300 selection:bg-gold selection:text-royal dark:bg-brandDark dark:text-slate-100`}
      >
        {FB_PIXEL_ID ? (
          <noscript>
            <img
              height={1}
              width={1}
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        ) : null}
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
