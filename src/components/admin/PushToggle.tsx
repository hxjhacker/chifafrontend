"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import {
  currentPushSubscription,
  disablePushNotifications,
  enablePushNotifications,
  pushSupported,
  registerAdminWorker,
} from "@/lib/push-client";
import { cn } from "@/lib/cn";

type Status = "loading" | "unsupported" | "off" | "on" | "blocked";

export function PushToggle({
  onNotice,
  variant = "toolbar",
  className,
}: {
  onNotice?: (message: string, kind?: "ok" | "warn") => void;
  variant?: "toolbar" | "menu";
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      setStatus("unsupported");
      return;
    }
    void (async () => {
      try {
        await registerAdminWorker();
        if (Notification.permission === "denied") {
          setStatus("blocked");
          return;
        }
        const sub = await currentPushSubscription();
        setStatus(sub ? "on" : "off");
      } catch {
        setStatus("off");
      }
    })();
  }, []);

  async function toggle() {
    if (busy || status === "unsupported" || status === "loading") return;
    if (status === "blocked") {
      onNotice?.("فعّل الإشعارات من إعدادات المتصفح، أو أضف اللوحة للشاشة الرئيسية على الآيفون.", "warn");
      return;
    }
    setBusy(true);
    try {
      if (status === "on") {
        await disablePushNotifications();
        setStatus("off");
        onNotice?.("تم إيقاف إشعارات الطلبات.", "ok");
      } else {
        await enablePushNotifications();
        setStatus("on");
        onNotice?.("تم تفعيل إشعارات الطلبات على هاد الجهاز.", "ok");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "permission_denied") {
        setStatus("blocked");
        onNotice?.("المتصفح رفض الإشعارات. فعّلها من الإعدادات.", "warn");
      } else {
        onNotice?.("تعذر تفعيل الإشعارات. جرّب من Chrome وعلى HTTPS.", "warn");
      }
    } finally {
      setBusy(false);
    }
  }

  const on = status === "on";
  const label =
    status === "on" ? "الإشعارات مفعّلة" : status === "blocked" ? "الإشعارات محظورة" : status === "unsupported" ? "الإشعارات غير مدعومة" : "الإشعارات";

  const icon =
    status === "blocked" || status === "unsupported" ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />;

  if (variant === "menu") {
    return (
      <button
        type="button"
        aria-label={label}
        disabled={busy || status === "loading" || status === "unsupported"}
        onClick={() => void toggle()}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right transition hover:bg-white/5",
          (busy || status === "unsupported") && "opacity-60",
        )}
      >
        <span className="text-slate-300">{icon}</span>
        <span className="text-[13px] font-semibold text-white">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={busy || status === "loading" || status === "unsupported"}
      onClick={() => void toggle()}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition",
        (busy || status === "unsupported") && "opacity-60",
        className,
      )}
    >
      {icon}
      <span className="hidden md:inline">{on ? "إشعارات مفعّلة" : "إشعارات الطلبات"}</span>
    </button>
  );
}
