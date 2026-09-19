"use client";

import { FormEvent, useEffect, useState } from "react";
import { PencilLine, UserRound, X } from "lucide-react";
import { cn } from "@/lib/cn";

export const STORE_NAME_KEY = "cg_admin_store_name";
export const DEFAULT_STORE_NAME = "CHIFA GLOW";
export const DEFAULT_PROFILE_EMAIL = "manager@chifa.com";

export function storeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  const compact = name.replace(/\s+/g, "");
  return (compact.slice(0, 2) || "CG").toUpperCase();
}

export function AccountPopover({
  storeName,
  email,
  initials,
  className,
  onOpenProfile,
}: {
  storeName: string;
  email: string;
  initials: string;
  className?: string;
  onOpenProfile: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="معلومات الحساب"
      className={cn(
        "absolute left-0 top-full z-50 mt-3 w-80 origin-top-left rounded-2xl border border-slate-800/90 bg-[#0c1322] p-5 shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/70 pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-amber-600/60 bg-[#181615] text-base font-black text-amber-500">
          {initials}
        </div>
        <div className="flex flex-1 flex-col text-left">
          <span className="text-base font-extrabold tracking-wide text-white">{storeName}</span>
          <span className="max-w-[160px] truncate text-xs font-medium text-slate-400">{email}</span>
        </div>
      </div>
      <div className="space-y-3.5 py-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-400">الصفة / الرتبة:</span>
          <span className="text-sm font-extrabold text-amber-500">لوحة إدارة المبيعات</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-400">حالة الحساب:</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            نشط الآن
          </span>
        </div>
      </div>
      <div className="border-t border-slate-800/70 pt-3">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-[#162033] px-4 py-2 text-center text-xs font-bold text-slate-200 shadow-sm transition hover:bg-[#1c2942]"
        >
          <PencilLine className="h-4 w-4 text-slate-400" />
          <span>الملف الشخصي</span>
        </button>
      </div>
    </div>
  );
}

export function EditProfileModal({
  open,
  storeName,
  email,
  onClose,
  onSave,
}: {
  open: boolean;
  storeName: string;
  email: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [draftName, setDraftName] = useState(storeName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraftName(storeName);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }, [open, storeName]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = draftName.trim();
    if (name.length < 2) {
      setError("كتبي اسم المتجر (حرفين على الأقل).");
      return;
    }
    const changingPassword = Boolean(currentPassword || newPassword || confirmPassword);
    if (changingPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setError("باش تبدّلي كلمة المرور، عمّري الخانات الثلاثة.");
        return;
      }
      if (newPassword.length < 8) {
        setError("كلمة المرور الجديدة خاصها تكون 8 حروف على الأقل.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("تأكيد كلمة المرور ما كيتطابقش.");
        return;
      }
    }
    onSave(name);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      id="editProfileModal"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="edit-profile-title"
        className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0c1322] p-5 text-slate-200 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <UserRound className="h-4 w-4" />
            </div>
            <div>
              <h3 id="edit-profile-title" className="text-sm font-bold text-white">
                إعدادات الحساب والملف الشخصي
              </h3>
              <p className="text-[11px] text-slate-400">تعديل اسم المستخدم وتحديث كلمة المرور</p>
            </div>
          </div>
          <button
            type="button"
            id="closeEditModalBtn"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="profileSettingsForm" className="space-y-4 py-4 text-xs" onSubmit={submit}>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block font-semibold text-slate-300" htmlFor="inputUsername">
                اسم المستخدم / المتجر
              </label>
              <input
                id="inputUsername"
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs text-white transition focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-semibold text-slate-300" htmlFor="inputEmail">
                البريد الإلكتروني
              </label>
              <input
                id="inputEmail"
                type="email"
                value={email}
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs text-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="my-2 h-px bg-slate-800/80" />

          <div className="space-y-3">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              تغيير كلمة المرور
            </span>
            <div>
              <label className="mb-1 block font-medium text-slate-400" htmlFor="inputCurrentPassword">
                كلمة المرور الحالية
              </label>
              <input
                id="inputCurrentPassword"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs text-white transition focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-400" htmlFor="inputNewPassword">
                كلمة المرور الجديدة
              </label>
              <input
                id="inputNewPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs text-white transition focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-slate-400" htmlFor="inputConfirmPassword">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                id="inputConfirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#070b12] px-3 py-2 text-xs text-white transition focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3">
            <button
              type="button"
              id="cancelEditModalBtn"
              onClick={onClose}
              className="rounded-xl border border-slate-800 px-4 py-2 font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-5 py-2 font-bold text-slate-950 shadow-md shadow-amber-500/10 transition hover:bg-amber-400"
            >
              حفظ التعديلات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
