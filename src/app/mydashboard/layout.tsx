import type { Metadata } from "next";
import { DashboardShield } from "@/components/admin/DashboardShield";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s | Chifaglow Admin",
  },
  manifest: "/manifest-admin.json",
  appleWebApp: {
    capable: true,
    title: "Chifaglow",
    statusBarStyle: "black-translucent",
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
  return <DashboardShield>{children}</DashboardShield>;
}
