import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s | Chifaglow Admin",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
};

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
