"use client";

import { useEffect, type ReactNode } from "react";
import { DashboardToastHost } from "@/components/admin/DashboardAlert";

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], [data-allow-select]"));
}

function isInspectShortcut(e: KeyboardEvent) {
  const key = e.key.toLowerCase();
  if (e.key === "F12") return true;
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === "i" || key === "j" || key === "c")) return true;
  if ((e.ctrlKey || e.metaKey) && key === "u") return true;
  if (e.metaKey && e.altKey && (key === "i" || key === "j" || key === "c")) return true;
  return false;
}

export function DashboardShield({ children }: { children: ReactNode }) {
  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    }

    function onClipboard(e: ClipboardEvent) {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    }

    function onDragStart(e: DragEvent) {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isInspectShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === "c" || key === "x" || key === "a") && !isEditableTarget(e.target)) {
        e.preventDefault();
      }
    }

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onClipboard);
    document.addEventListener("cut", onClipboard);
    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onClipboard);
      document.removeEventListener("cut", onClipboard);
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);

  return (
    <div className="no-select select-none">
      {children}
      <DashboardToastHost />
    </div>
  );
}
