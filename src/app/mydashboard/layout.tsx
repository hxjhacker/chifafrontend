import type { Metadata } from "next";
import { DashboardShield } from "@/components/admin/DashboardShield";
import { DashboardHeader, DashboardNavProvider } from "@/components/admin/DashboardHeader";
import { DashboardSoundEngine } from "@/components/admin/DashboardSoundEngine";
import { CalculatorWidget } from "@/components/admin/CalculatorWidget";
import { DashboardOrdersProvider, StickyNotesWidget } from "@/components/admin/StickyNotesWidget";

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
  return (
    <DashboardOrdersProvider>
      <DashboardShield>
        <DashboardNavProvider>
          <DashboardSoundEngine />
          <div className="flex min-h-screen flex-col">
            <DashboardHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </div>
          <CalculatorWidget />
          <StickyNotesWidget />
        </DashboardNavProvider>
      </DashboardShield>
    </DashboardOrdersProvider>
  );
}
