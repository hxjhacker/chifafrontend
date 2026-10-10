"use client";

import { useEffect, useState } from "react";
import { UserPlus, X } from "lucide-react";

export type TeamPayoutMethod = "percentage" | "fixed" | "formula";

export type NewTeamMemberValues = {
  name_ar: string;
  avatar_color: string;
  payout_method: TeamPayoutMethod;
  payout_percentage: number | null;
  payout_fixed_amount: number | null;
  payout_loss_deduction: number | null;
  payout_min_order_target: number | null;
};

const INITIAL_VALUES: NewTeamMemberValues = {
  name_ar: "",
  avatar_color: "#38bdf8",
  payout_method: "percentage",
  payout_percentage: 10,
  payout_fixed_amount: null,
  payout_loss_deduction: 0,
  payout_min_order_target: 1,
};

export function AddTeamMemberModal({
  open,
  onClose,
  onSave,
  color,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: NewTeamMemberValues) => Promise<void>;
  color: string;
}) {
  const [values, setValues] = useState<NewTeamMemberValues>({ ...INITIAL_VALUES, avatar_color: color });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setValues({ ...INITIAL_VALUES, avatar_color: color });
    setBusy(false);
    setError("");
  }, [open, color]);

  if (!open) return null;

  const update = <K extends keyof NewTeamMemberValues>(key: K, value: NewTeamMemberValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = values.name_ar.trim();
    if (name.length < 2) {
      setError("يرجى إدخال اسم العضو.");
      return;
    }
    if (values.payout_method === "percentage" && (values.payout_percentage == null || values.payout_percentage < 0 || values.payout_percentage > 100)) {
      setError("النسبة يجب أن تكون بين 0 و100.");
      return;
    }
    if (values.payout_method === "fixed" && (values.payout_fixed_amount == null || values.payout_fixed_amount < 0)) {
      setError("يرجى إدخال مبلغ ثابت صالح.");
      return;
    }
    if (values.payout_method === "formula" && (values.payout_loss_deduction == null || values.payout_loss_deduction < 0 || values.payout_min_order_target == null || values.payout_min_order_target <= 0)) {
      setError("يرجى إدخال قيم المعادلة بشكل صحيح.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({ ...values, name_ar: name });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إضافة عضو الفريق.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div dir="rtl" role="dialog" aria-modal="true" aria-labelledby="add-team-member-title" className="my-auto w-full max-w-md space-y-4 rounded-3xl border border-slate-800 bg-[#0c1322] p-6 text-right shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 id="add-team-member-title" className="flex items-center gap-2 text-sm font-black text-white">
            <UserPlus className="h-4 w-4 text-emerald-400" />
            إضافة عضو جديد للفريق
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 transition hover:text-white" aria-label="إغلاق">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(event) => void submit(event)} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="new-team-member-name" className="mb-1 block font-bold text-slate-300">اسم الشخص أو العضو *</label>
            <input id="new-team-member-name" value={values.name_ar} onChange={(event) => update("name_ar", event.target.value)} required autoFocus placeholder="مثال: محمد أو المتجر" className="w-full rounded-xl border border-slate-800 bg-[#060b14] px-3.5 py-2.5 font-bold text-white outline-none focus:border-amber-500" />
          </div>

          <div>
            <label htmlFor="team-payout-method" className="mb-1 block font-bold text-slate-300">طريقة الحساب والأجرة *</label>
            <select id="team-payout-method" value={values.payout_method} onChange={(event) => update("payout_method", event.target.value as TeamPayoutMethod)} className="w-full rounded-xl border border-slate-800 bg-[#060b14] px-3 py-2.5 font-bold text-white outline-none focus:border-amber-500">
              <option value="percentage">1. نسبة مئوية (%) من كل طلبية</option>
              <option value="fixed">2. مبلغ ثابت لكل طلبية</option>
              <option value="formula">3. تقسيم الأرباح الصافية: (y - x) / a = b</option>
            </select>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-800 bg-[#060b14] p-3">
            {values.payout_method === "percentage" ? (
              <NumberField label="النسبة المئوية (%) من المبيعات" value={values.payout_percentage} onChange={(value) => update("payout_percentage", value)} placeholder="مثال: 10" min={0} max={100} />
            ) : null}
            {values.payout_method === "fixed" ? (
              <NumberField label="المبلغ الثابت لكل طلبية (درهم)" value={values.payout_fixed_amount} onChange={(value) => update("payout_fixed_amount", value)} placeholder="مثال: 10" min={0} />
            ) : null}
            {values.payout_method === "formula" ? (
              <>
                <p className="text-[11px] font-bold text-amber-400">معادلة الحساب: (y - x) / a = b</p>
                <NumberField label="قيمة الخسائر والمصاريف (x) لكل طلبية" value={values.payout_loss_deduction} onChange={(value) => update("payout_loss_deduction", value)} placeholder="مثال: 50" min={0} />
                <NumberField label="معامل القسمة / الحد الأدنى للطلب (a)" value={values.payout_min_order_target} onChange={(value) => update("payout_min_order_target", value)} placeholder="مثال: 2" min={0.01} />
              </>
            ) : null}
          </div>

          {error ? <p className="font-bold text-rose-400">{error}</p> : null}
          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-emerald-500 py-3 text-xs font-black text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "جاري الحفظ…" : "حفظ وإضافة العضو"}
            </button>
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 font-bold text-slate-400 transition hover:text-white">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder: string;
  min: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1 block font-bold text-slate-400">{label}</label>
      <input type="number" value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} placeholder={placeholder} min={min} max={max} step="0.01" className="w-full rounded-xl border border-slate-800 bg-[#0b1322] px-3.5 py-2.5 font-mono font-bold text-white outline-none focus:border-amber-500" />
    </div>
  );
}
