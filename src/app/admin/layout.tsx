import type { Metadata } from "next";
import { DashboardShield } from "@/components/admin/DashboardShield";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s | Chifaglow Admin",
  },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShield>{children}</DashboardShield>;
}
