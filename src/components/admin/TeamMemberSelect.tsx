"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Pencil, Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type TeamMemberOption = {
  id: string;
  name_ar: string;
  avatar_color: string;
  payout_method?: "percentage" | "fixed" | "formula";
  payout_percentage?: number | null;
  payout_fixed_amount?: number | null;
  payout_loss_deduction?: number | null;
  payout_min_order_target?: number | null;
  is_active: boolean;
  order_count?: number;
};

const COLOR_OPTIONS = ["#38bdf8", "#a78bfa", "#34d399", "#f59e0b", "#fb7185", "#f472b6"];

function Avatar({ member, small = false }: { member: TeamMemberOption; small?: boolean }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-black text-[#07111f]", small ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[11px]")}
      style={{ backgroundColor: member.avatar_color }}
      aria-hidden
    >
      {member.name_ar.slice(0, 1)}
    </span>
  );
}

export function TeamMemberSelect({
  value,
  onChange,
  label = "المسؤول عن الطلب",
  dark = true,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  dark?: boolean;
}) {
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectorRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  async function loadMembers() {
    try {
      const response = await fetch("/api/admin/team-members", { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { members?: TeamMemberOption[] };
      setMembers((body.members || []).filter((member) => member.is_active));
    } catch {
      /* The server-side default remains usable if the list cannot load. */
    }
  }

  useEffect(() => {
    void loadMembers();
  }, []);

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    function updateMenuPosition() {
      const button = selectorRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuHeight = Math.min(360, window.innerHeight - 24);
      const openUpward = window.innerHeight - rect.bottom < menuHeight + 12 && rect.top > menuHeight + 12;
      const width = Math.max(rect.width, 250);
      const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - width - 12));
      setMenuPosition(
        openUpward
          ? { left, width, bottom: Math.max(12, window.innerHeight - rect.top + 8) }
          : { left, width, top: Math.min(window.innerHeight - 12, rect.bottom + 8) },
      );
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const selected = useMemo(
    () => members.find((member) => member.id === value) || members.find((member) => member.id === "mohammed") || members[0],
    [members, value],
  );

  function beginEdit(member: TeamMemberOption) {
    setEditingId(member.id);
    setEditName(member.name_ar);
    setEditColor(member.avatar_color);
    setError("");
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/team-members/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_ar: editName, avatar_color: editColor }),
      });
      if (!response.ok) throw new Error("تعذر حفظ عضو الفريق.");
      await loadMembers();
      window.dispatchEvent(new Event("dashboard-team-members-updated"));
      setEditingId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ عضو الفريق.");
    } finally {
      setBusy(false);
    }
  }

  async function addMember() {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_ar: newName, avatar_color: COLOR_OPTIONS[members.length % COLOR_OPTIONS.length] }),
      });
      if (!response.ok) throw new Error("تعذر إضافة عضو الفريق.");
      const member = (await response.json()) as TeamMemberOption;
      await loadMembers();
      window.dispatchEvent(new Event("dashboard-team-members-updated"));
      onChange(member.id);
      setNewName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر إضافة عضو الفريق.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <label className={cn("mb-1 block text-right text-xs font-bold", dark ? "text-slate-200" : "text-royal/80")}>{label}</label>
      <button
        type="button"
        ref={selectorRef}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-right text-xs font-bold transition",
          dark ? "border-slate-700 bg-[#060b14] text-white hover:border-slate-500" : "border-gold/20 bg-cream text-royal hover:border-gold",
        )}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? <Avatar member={selected} /> : <Users className="h-4 w-4 text-slate-400" />}
          <span>{selected?.name_ar || "اختر عضواً"}</span>
        </span>
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && menuPosition && typeof document !== "undefined"
        ? createPortal(
            <div
              dir="rtl"
              style={{
                position: "fixed",
                left: menuPosition.left,
                width: `min(${menuPosition.width}px, calc(100vw - 24px))`,
                ...(menuPosition.top != null ? { top: menuPosition.top } : { bottom: menuPosition.bottom }),
              }}
              className={cn("z-[1000] max-h-[min(22.5rem,calc(100vh-1.5rem))] overflow-y-auto rounded-xl border p-1.5 shadow-2xl", dark ? "border-slate-700 bg-[#0b1322]" : "border-gold/20 bg-white")}
            >
          {members.map((member) => (
            <div key={member.id} className={cn("flex items-center gap-1 rounded-lg p-1", dark ? "hover:bg-white/5" : "hover:bg-amber-50")}>
              <button
                type="button"
                onClick={() => {
                  onChange(member.id);
                  setOpen(false);
                }}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-right text-xs font-bold"
              >
                <Avatar member={member} small />
                <span className="flex-1 truncate">{member.name_ar}</span>
                <span className="text-[9px] font-mono text-slate-500">{member.order_count ?? 0}</span>
                {member.id === value ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
              </button>
              <button
                type="button"
                onClick={() => {
                  setManageOpen(true);
                  beginEdit(member);
                }}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-amber-300"
                title="تعديل عضو الفريق"
                aria-label={`تعديل ${member.name_ar}`}
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setManageOpen(true);
              setEditingId("");
              setError("");
            }}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-700 px-2 py-1.5 text-[10px] font-bold text-cyan-300"
          >
            <Plus className="h-3 w-3" /> إدارة وإضافة أعضاء
          </button>
            </div>,
            document.body,
          )
        : null}
      {manageOpen ? (
        <div className={cn("mt-2 rounded-xl border p-2.5", dark ? "border-slate-700 bg-[#070b12]" : "border-gold/20 bg-cream")}>
          <div className="mb-2 flex items-center justify-between">
            <span className={cn("text-[10px] font-black", dark ? "text-slate-200" : "text-royal")}>إدارة أعضاء الفريق</span>
            <button type="button" onClick={() => setManageOpen(false)} className="text-slate-400 hover:text-white" aria-label="إغلاق إدارة الفريق"><X className="h-3.5 w-3.5" /></button>
          </div>
          {editingId ? (
            <div className="space-y-2">
              <input value={editName} onChange={(event) => setEditName(event.target.value)} className={cn("w-full rounded-lg border px-2.5 py-2 text-xs outline-none", dark ? "border-slate-700 bg-[#0b1322] text-white" : "border-gold/20 bg-white text-royal")} placeholder="اسم العضو" />
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((color) => <button key={color} type="button" onClick={() => setEditColor(color)} className={cn("h-5 w-5 rounded-full border-2", editColor === color ? "border-white" : "border-transparent")} style={{ backgroundColor: color }} aria-label="اختيار لون الصورة الرمزية" />)}
                <button type="button" onClick={() => setEditingId("")} className="mr-auto text-[10px] text-slate-400">إلغاء</button>
                <button type="button" disabled={busy} onClick={() => void saveEdit()} className="rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300 disabled:opacity-50">حفظ</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input value={newName} onChange={(event) => setNewName(event.target.value)} className={cn("min-w-0 flex-1 rounded-lg border px-2.5 py-2 text-xs outline-none", dark ? "border-slate-700 bg-[#0b1322] text-white" : "border-gold/20 bg-white text-royal")} placeholder="اسم العضو الجديد" />
              <button type="button" disabled={busy} onClick={() => void addMember()} className="rounded-lg bg-cyan-500/20 px-2.5 py-1.5 text-[10px] font-bold text-cyan-300 disabled:opacity-50">إضافة</button>
            </div>
          )}
          {error ? <p className="mt-1.5 text-[10px] font-bold text-rose-400">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
