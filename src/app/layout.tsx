import type { Metadata } from "next";
import { StoreShell } from "@/components/StoreShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chifaglow | شيفا جلو — USB فاخر والدفع عند الاستلام",
  description:
    "USB القرآن، تعليم الأطفال، والموسيقى. توصيل مجاني لجميع مدن المغرب والدفع عند الاستلام.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://chifaglow.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Cinzel:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-cairo bg-cream text-royal antialiased">
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
