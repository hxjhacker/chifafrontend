import { redirect } from "next/navigation";
import { DASHBOARD_HOME } from "@/lib/admin-paths";

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminOverviewPage() {
  redirect(DASHBOARD_HOME);
}
