"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Loader2, Receipt, RefreshCw, Search, X } from "lucide-react";
import { notifyDashboard } from "@/components/admin/DashboardAlert";
import type { TeamMemberOption } from "@/components/admin/TeamMemberSelect";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { formatStamp, shortOrderRef, type AdminOrder } from "@/lib/admin";
import { DASHBOARD_HOME } from "@/lib/admin-paths";
import { cn } from "@/lib/cn";

type InvoiceTab = "unpaid" | "paid" | "all";

type Invoice = {
  id: string;
  reference: string;
  orderRef: string;
  customer: string;
  city: string;
  pack: string;
  memberId: string;
  memberName: string;
  memberColor: string;
  orderTotal: number;
  payout: number;
  methodLabel: string;
  paid: boolean;
  deliveredAt: string | null;
};

const TABS: { id: InvoiceTab; label: string }[] = [
  { id: "unpaid", label: "غير مدفوعة" },
  { id: "paid", label: "مدفوعة" },
  { id: "all", label: "الكل" },
];

function invoiceReference(orderId: string) {
  return `INV-${orderId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function money(value: number) {
  const rounded = Math.round(value * 100) / 100;
  const shown = Number.isInteger(rounded)
    ? rounded.toLocaleString("fr-MA")
    : rounded.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${shown} درهم`;
}

function memberLabel(member: TeamMemberOption | undefined, id: string) {
  if (member?.name_ar) return member.name_ar;
  if (id === "store") return "المتجر";
  if (id === "mohammed") return "محمد";
  return id;
}

function payoutFor(order: AdminOrder, member: TeamMemberOption | undefined) {
  const total = Number(order.total) || 0;
  const method = member?.payout_method || "percentage";
  if (method === "fixed") {
    return {
      amount: Math.max(0, Number(member?.payout_fixed_amount) || 0),
      label: "مبلغ ثابت لكل طلبية",
    };
  }
  if (method === "formula") {
    const losses = Number(member?.payout_loss_deduction) || 0;
    const divisor = Number(member?.payout_min_order_target) || 0;
    const amount = divisor > 0 ? Math.max(0, (total - losses) / divisor) : 0;
    return { amount, label: "(y - x) / a" };
  }
  const percent = Number(member?.payout_percentage) || 0;
  return {
    amount: Math.max(0, (total * percent) / 100),
    label: percent ? `${percent}% من مبلغ الطلب` : "نسبة غير محددة",
  };
}

function toInvoice(order: AdminOrder, members: Map<string, TeamMemberOption>): Invoice {
  const memberId = order.assigned_team_member_id || "mohammed";
  const member = members.get(memberId);
  const payout = payoutFor(order, member);
  return {
    id: order.order_id,
    reference: invoiceReference(order.order_id),
    orderRef: shortOrderRef(order.order_id),
    customer: order.full_name,
    city: order.city,
    pack: order.pack_label,
    memberId,
    memberName: memberLabel(member, memberId),
    memberColor: member?.avatar_color || "#38bdf8",
    orderTotal: Number(order.total) || 0,
    payout: payout.amount,
    methodLabel: payout.label,
    paid: Boolean(order.team_payout_paid),
    deliveredAt: order.delivered_at,
  };
}

function StatusBadge({ paid }: { paid: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black",
        paid
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border-amber-500/45 bg-amber-500/15 text-amber-300",
      )}
    >
      {paid ? "مدفوعة" : "غير مدفوعة"}
    </span>
  );
}

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [tab, setTab] = useState<InvoiceTab>("unpaid");
  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [viewing, setViewing] = useState<Invoice | null>(null);

  useLockBodyScroll(Boolean(viewing));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, membersRes] = await Promise.all([
        fetch("/api/admin/orders?status=delivered&limit=2000", { credentials: "include", cache: "no-store" }),
        fetch("/api/admin/team-members", { credentials: "include", cache: "no-store" }),
      ]);
      if (ordersRes.status === 401 || membersRes.status === 401) {
        window.location.replace(DASHBOARD_HOME);
        return;
      }
      if (!ordersRes.ok) throw new Error("تعذر تحميل الفواتير.");
      const ordersBody = (await ordersRes.json()) as { orders?: AdminOrder[] };
      const membersBody = membersRes.ok ? ((await membersRes.json()) as { members?: TeamMemberOption[] }) : { members: [] };
      const memberRows = membersBody.members || [];
      const memberMap = new Map(memberRows.map((member) => [member.id, member]));
      setMembers(memberRows);
      setInvoices((ordersBody.orders || []).filter((order) => order.status === "delivered").map((order) => toInvoice(order, memberMap)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل الفواتير.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleMembers = useMemo(() => {
    const ids = new Set(invoices.map((invoice) => invoice.memberId));
    return members.filter((member) => ids.has(member.id));
  }, [invoices, members]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return invoices.filter((invoice) => {
      if (tab === "paid" && !invoice.paid) return false;
      if (tab === "unpaid" && invoice.paid) return false;
      if (memberId !== "all" && invoice.memberId !== memberId) return false;
      if (!needle) return true;
      const hay = `${invoice.reference} ${invoice.orderRef} ${invoice.customer} ${invoice.memberName} ${invoice.city} ${invoice.pack}`.toLocaleLowerCase("ar");
      return hay.includes(needle);
    });
  }, [invoices, tab, query, memberId]);

  const unpaid = invoices.filter((invoice) => !invoice.paid);
  const paid = invoices.filter((invoice) => invoice.paid);
  const sum = (rows: Invoice[]) => rows.reduce((total, invoice) => total + invoice.payout, 0);

  async function setPaid(invoice: Invoice, next: boolean) {
    if (savingId) return;
    const previous = invoice.paid;
    setInvoices((rows) => rows.map((row) => (row.id === invoice.id ? { ...row, paid: next } : row)));
    setViewing((current) => (current?.id === invoice.id ? { ...current, paid: next } : current));
    setSavingId(invoice.id);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(invoice.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_payout_paid: next }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { detail?: string };
        const map: Record<string, string> = {
          payout_requires_delivered: "لا يمكن تعليم الفاتورة كمدفوعة قبل التسليم.",
        };
        throw new Error(map[body.detail || ""] || "تعذر تحديث حالة الفاتورة.");
      }
      notifyDashboard(next ? "تم تعليم الفاتورة كمدفوعة." : "تم تعليم الفاتورة كغير مدفوعة.", "ok");
    } catch (err) {
      setInvoices((rows) => rows.map((row) => (row.id === invoice.id ? { ...row, paid: previous } : row)));
      setViewing((current) => (current?.id === invoice.id ? { ...current, paid: previous } : current));
      notifyDashboard(err instanceof Error ? err.message : "تعذر تحديث حالة الفاتورة.", "error");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div dir="rtl" className="min-h-full flex-1 px-4 py-6 sm:px-6" style={{ background: "#070d19", color: "#e8eefc" }}>
      <div className="mx-auto w-full max-w-[1400px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-emerald-400/90">أجور الفريق · الطلبيات المسلّمة</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
              <Receipt className="h-6 w-6 text-emerald-400" />
              الفواتير
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold text-slate-200 disabled:opacity-60"
              style={{ borderColor: "#1e2d4a", background: "#0b1324" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              تحديث
            </button>
            <Link
              href={DASHBOARD_HOME}
              className="inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold text-slate-200"
              style={{ borderColor: "#1e2d4a", background: "#0b1324" }}
            >
              <ArrowRight className="h-4 w-4" />
              لوحة التحكم
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard label="غير مدفوعة" value={money(sum(unpaid))} hint={`${unpaid.length} فاتورة معلّقة`} tone="amber" />
          <SummaryCard label="مدفوعة" value={money(sum(paid))} hint={`${paid.length} فاتورة مسوّاة`} tone="emerald" />
          <SummaryCard label="الإجمالي" value={money(sum(invoices))} hint={`${invoices.length} طلبية مسلّمة`} tone="slate" />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center" style={{ borderColor: "#1e2d4a", background: "#0b1324" }}>
          <div className="flex rounded-xl bg-[#070d19] p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-black transition",
                  tab === item.id ? "bg-white text-slate-950" : "text-slate-400 hover:text-white",
                )}
              >
                {item.label}
                <span className="mr-1 font-mono text-[10px] opacity-70">
                  {item.id === "paid" ? paid.length : item.id === "unpaid" ? unpaid.length : invoices.length}
                </span>
              </button>
            ))}
          </div>
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالمرجع أو الزبون أو العضو"
              className="h-10 w-full rounded-xl border border-[#1e2d4a] bg-[#070d19] pr-9 pl-3 text-sm font-semibold text-white outline-none focus:border-emerald-500/50"
            />
          </label>
          <select
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
            className="h-10 rounded-xl border border-[#1e2d4a] bg-[#070d19] px-3 text-sm font-semibold text-white outline-none focus:border-emerald-500/50"
          >
            <option value="all">كل الأعضاء</option>
            {visibleMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name_ar}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300">{error}</p> : null}

        <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "#1e2d4a", background: "#0b1324" }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              جاري تحميل الفواتير…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-sm font-bold text-slate-400">لا توجد فواتير مطابقة.</div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-right text-sm">
                  <thead className="border-b border-[#1e2d4a] text-xs font-bold text-slate-400">
                    <tr>
                      <th className="px-4 py-3">المرجع</th>
                      <th className="px-4 py-3">العضو</th>
                      <th className="px-4 py-3">الطلب</th>
                      <th className="px-4 py-3">مبلغ الطلب</th>
                      <th className="px-4 py-3">الأجرة</th>
                      <th className="px-4 py-3">الحالة</th>
                      <th className="px-4 py-3">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2d4a]">
                    {filtered.map((invoice) => (
                      <tr key={invoice.id} className="text-slate-200">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-white">{invoice.reference}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 font-bold">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: invoice.memberColor }} />
                            {invoice.memberName}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-white">{invoice.customer}</div>
                          <div className="text-[11px] text-slate-500">
                            {invoice.orderRef} · {invoice.city}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold">{money(invoice.orderTotal)}</td>
                        <td className="px-4 py-3 font-black text-emerald-300">{money(invoice.payout)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge paid={invoice.paid} />
                        </td>
                        <td className="px-4 py-3">
                          <RowActions invoice={invoice} saving={savingId === invoice.id} onView={() => setViewing(invoice)} onToggle={() => void setPaid(invoice, !invoice.paid)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 p-3 md:hidden">
                {filtered.map((invoice) => (
                  <article key={invoice.id} className="rounded-2xl border border-[#1e2d4a] bg-[#070d19] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-black text-white">{invoice.reference}</p>
                        <p className="mt-1 text-sm font-black">{invoice.customer}</p>
                        <p className="text-[11px] text-slate-500">
                          {invoice.orderRef} · {invoice.city}
                        </p>
                      </div>
                      <StatusBadge paid={invoice.paid} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 font-bold text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: invoice.memberColor }} />
                        {invoice.memberName}
                      </span>
                      <span className="font-black text-emerald-300">{money(invoice.payout)}</span>
                    </div>
                    <div className="mt-3">
                      <RowActions invoice={invoice} saving={savingId === invoice.id} onView={() => setViewing(invoice)} onToggle={() => void setPaid(invoice, !invoice.paid)} />
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {viewing ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 sm:items-center">
          <button type="button" aria-label="إغلاق" className="absolute inset-0" onClick={() => setViewing(null)} />
          <div className="relative z-10 w-full max-w-lg space-y-4 rounded-3xl border border-[#1e2d4a] bg-[#0c1322] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-black text-emerald-300">{viewing.reference}</p>
                <h2 className="mt-1 text-lg font-black text-white">{viewing.customer}</h2>
              </div>
              <button type="button" onClick={() => setViewing(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="إغلاق التفاصيل">
                <X className="h-4 w-4" />
              </button>
            </div>
            <StatusBadge paid={viewing.paid} />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="مرجع الطلب" value={viewing.orderRef} />
              <Detail label="العضو" value={viewing.memberName} />
              <Detail label="المدينة" value={viewing.city} />
              <Detail label="المنتج" value={viewing.pack} />
              <Detail label="مبلغ الطلب" value={money(viewing.orderTotal)} />
              <Detail label="الأجرة" value={money(viewing.payout)} />
              <Detail label="طريقة الحساب" value={viewing.methodLabel} />
              <Detail label="تاريخ التسليم" value={formatStamp(viewing.deliveredAt)} />
            </dl>
            <button
              type="button"
              disabled={savingId === viewing.id}
              onClick={() => void setPaid(viewing, !viewing.paid)}
              className={cn(
                "inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-black disabled:opacity-60",
                viewing.paid ? "bg-amber-500/20 text-amber-200" : "bg-emerald-500 text-slate-950",
              )}
            >
              {savingId === viewing.id ? <Loader2 className="h-4 w-4 animate-spin" /> : viewing.paid ? "تعليم كغير مدفوعة" : "تعليم كمدفوعة"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "amber" | "emerald" | "slate" }) {
  const color = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : "text-white";
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "#1e2d4a", background: "#0b1324" }}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn("mt-1 text-2xl font-black", color)}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1e2d4a] bg-[#070d19] px-3 py-2">
      <dt className="text-[10px] font-bold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-white">{value}</dd>
    </div>
  );
}

function RowActions({
  invoice,
  saving,
  onView,
  onToggle,
}: {
  invoice: Invoice;
  saving: boolean;
  onView: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onView}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 text-[11px] font-bold text-sky-300"
      >
        <Eye className="h-3.5 w-3.5" />
        عرض
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={onToggle}
        className={cn(
          "inline-flex h-8 items-center rounded-lg px-2.5 text-[11px] font-black disabled:opacity-60",
          invoice.paid ? "bg-amber-500/15 text-amber-200" : "bg-emerald-500/20 text-emerald-200",
        )}
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : invoice.paid ? "تعليم كغير مدفوعة" : "تعليم كمدفوعة"}
      </button>
    </div>
  );
}
