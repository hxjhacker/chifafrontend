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

export function PushToggle({ onNotice }: { onNotice?: (message: string, kind?: "ok" | "warn") => void }) {
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
    status === "on" ? "إشعارات مفعّلة" : status === "blocked" ? "الإشعارات محظورة" : status === "unsupported" ? "الإشعارات غير مدعومة" : "تفعيل إشعارات الطلبات";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={busy || status === "loading" || status === "unsupported"}
      onClick={() => void toggle()}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition active:scale-95 md:h-auto md:w-auto md:gap-1.5 md:px-3 md:py-2",
        on
          ? "border-emeraldCustom/30 bg-emeraldCustom/10 text-emeraldCustom hover:bg-emeraldCustom hover:text-white"
          : "border-gold/30 bg-gold/10 text-gold-600 hover:bg-gold hover:text-royal dark:text-gold",
        (busy || status === "unsupported") && "opacity-60",
      )}
    >
      {status === "blocked" || status === "unsupported" ? (
        <BellOff className="h-4 w-4" />
      ) : (
        <Bell className="h-4 w-4" />
      )}
      <span className="hidden text-xs font-black md:inline">{on ? "إشعارات مفعّلة" : "إشعارات الطلبات"}</span>
    </button>
  );
}
