import type { Metadata } from "next";
import { DashboardShield } from "@/components/admin/DashboardShield";
import { DashboardHeader, DashboardNavProvider } from "@/components/admin/DashboardHeader";

export const metadata: Metadata = {
  title: {
    default: "لوحة التحكم",
    template: "%s | Chifaglow Admin",
  },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShield>
      <DashboardNavProvider>
        <div className="flex min-h-screen flex-col">
          <DashboardHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </DashboardNavProvider>
    </DashboardShield>
  );
}
