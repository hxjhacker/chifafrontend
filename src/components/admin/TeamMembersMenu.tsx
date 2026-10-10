"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Pencil, Plus, UserCog, X } from "lucide-react";
import { AddTeamMemberModal, type NewTeamMemberValues } from "@/components/admin/AddTeamMemberModal";
import type { TeamMemberOption } from "@/components/admin/TeamMemberSelect";

const COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#f59e0b", "#fb7185", "#f472b6"];

function dispatchTeamFilter(memberId: string | null) {
  window.dispatchEvent(new CustomEvent("dashboard-team-filter", { detail: { memberId } }));
}

export function TeamMembersMenu() {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMemberOption[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function loadMembers() {
    try {
      const response = await fetch("/api/admin/team-members", { credentials: "include", cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { members?: TeamMemberOption[] };
      setMembers((body.members || []).filter((member) => member.is_active));
    } catch {
      /* Keep the header usable if the team endpoint is temporarily unavailable. */
    }
  }

  useEffect(() => {
    void loadMembers();
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const totalOrders = useMemo(() => members.reduce((sum, member) => sum + (member.order_count || 0), 0), [members]);

  function beginEdit(member: TeamMemberOption) {
    setEditingId(member.id);
    setDraftName(member.name_ar);
    setDraftColor(member.avatar_color);
    setError("");
  }

  async function saveMember() {
    if (!editingId || !draftName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/team-members/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_ar: draftName, avatar_color: draftColor }),
      });
      if (!response.ok) throw new Error("تعذر حفظ عضو الفريق.");
      await loadMembers();
      setEditingId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ عضو الفريق.");
    } finally {
      setBusy(false);
    }
  }

  async function saveNewMember(values: NewTeamMemberValues) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/team-members", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error("تعذر إضافة عضو الفريق.");
      const member = (await response.json()) as TeamMemberOption;
      await loadMembers();
      setActiveId(member.id);
      dispatchTeamFilter(member.id);
      setOpen(false);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "تعذر إضافة عضو الفريق.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/35 bg-cyan-500/10 text-cyan-300 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
        aria-label="قائمة أعضاء الفريق"
        title="قائمة أعضاء الفريق"
        aria-expanded={open}
      >
        <UserCog className="h-4 w-4" />
      </button>
      {open ? (
        <div dir="rtl" className="absolute left-0 right-auto top-full z-50 mt-2 max-h-[min(70vh,30rem)] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0c1322] p-2 shadow-2xl">
          <div className="mb-1 flex items-center justify-between border-b border-slate-800 px-2 pb-2">
            <span className="text-xs font-black text-white">قائمة أعضاء الفريق</span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white" aria-label="إغلاق"><X className="h-3.5 w-3.5" /></button>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveId(null);
              dispatchTeamFilter(null);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-right text-xs font-bold text-slate-200 transition hover:bg-white/5"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-[10px] font-black text-white">∑</span>
            <span className="flex-1">إختيار الكل (الإجمالي)</span>
            <span className="font-mono text-[10px] text-slate-500">({totalOrders})</span>
            {activeId === null ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
          </button>
          {members.map((member) => (
            <div key={member.id}>
              <div className="flex items-center gap-1 rounded-xl px-1 py-0.5 hover:bg-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(member.id);
                    dispatchTeamFilter(member.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-right text-xs font-bold text-slate-200"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-[#07111f]" style={{ backgroundColor: member.avatar_color }}>
                    {member.name_ar.slice(0, 1)}
                  </span>
                  <span className="flex-1 truncate">{member.name_ar}</span>
                  <span className="font-mono text-[10px] text-slate-500">({member.order_count || 0})</span>
                  {activeId === member.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : null}
                </button>
                <button type="button" onClick={() => beginEdit(member)} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-amber-300" title={`تعديل ${member.name_ar}`} aria-label={`تعديل ${member.name_ar}`}>
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
              {editingId === member.id ? (
                <div className="space-y-1.5 rounded-xl border border-slate-700 bg-[#070b12] p-2">
                  <input value={draftName} onChange={(event) => setDraftName(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-[#0c1322] px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400" />
                  <div className="flex items-center gap-1">
                    {COLORS.map((color) => <button key={color} type="button" onClick={() => setDraftColor(color)} className={`h-4 w-4 rounded-full border-2 ${draftColor === color ? "border-white" : "border-transparent"}`} style={{ backgroundColor: color }} aria-label="اختيار لون العضو" />)}
                    <button type="button" onClick={() => setEditingId("")} className="mr-auto text-[10px] text-slate-500">إلغاء</button>
                    <button type="button" disabled={busy} onClick={() => void saveMember()} className="rounded-md bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300 disabled:opacity-50">حفظ</button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setAddModalOpen(true);
            }}
            className="mt-1 flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-slate-700 px-2 py-2 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/10"
          >
            <Plus className="h-3 w-3" /> إضافة شخص جديد
          </button>
          {error ? <p className="px-2 pt-1 text-[10px] font-bold text-rose-400">{error}</p> : null}
        </div>
      ) : null}
      <AddTeamMemberModal
        open={addModalOpen}
        color={COLORS[members.length % COLORS.length]}
        onClose={() => setAddModalOpen(false)}
        onSave={saveNewMember}
      />
    </div>
  );
}
