import type { Metadata } from "next";
import { Cairo, Cinzel } from "next/font/google";
import { StoreShell } from "@/components/StoreShell";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chifaglow | شيفا جلو — USB فاخر والدفع عند الاستلام",
  description:
    "USB القرآن، تعليم الأطفال، والموسيقى. توصيل مجاني لجميع مدن المغرب والدفع عند الاستلام.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://chifaglow.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${cinzel.variable}`}>
      <body className="font-cairo bg-cream text-royal antialiased">
        <StoreShell>{children}</StoreShell>
      </body>
    </html>
  );
}
