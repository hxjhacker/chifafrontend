import type { Metadata } from "next";
import { InvoicesPage } from "@/components/admin/InvoicesPage";

export const metadata: Metadata = {
  title: "الفواتير",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function DashboardInvoicesPage() {
  return <InvoicesPage />;
}
