"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, X, XCircle } from "lucide-react";
import {
  ALERT_TONES,
  dismissDashboardToast,
  getDashboardToasts,
  subscribeDashboardToasts,
  type AlertTone,
  type NoticeKind,
} from "@/lib/dashboard-alerts";
import { cn } from "@/lib/cn";

export {
  dashboardToast,
  notifyDashboard,
  showDashboardToast,
  type AlertTone,
  type NoticeKind,
} from "@/lib/dashboard-alerts";

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: CircleAlert,
  error: XCircle,
} as const;

type AlertCardProps = {
  tone?: AlertTone;
  title: string;
  detail?: string;
  className?: string;
  compact?: boolean;
  onClose?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
};

export function DashboardAlertCard({
  tone = "success",
  title,
  detail,
  className,
  compact,
  onClose,
  action,
  icon,
}: AlertCardProps) {
  const style = ALERT_TONES[tone];
  const Icon = ICONS[tone];

  return (
    <div
      dir="rtl"
      data-allow-select="true"
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      style={{
        background: `linear-gradient(${style.bg}, ${style.bg}), rgba(7, 12, 16, 0.9)`,
        boxShadow: style.glow,
      }}
      className={cn(
        "flex select-text items-start gap-3 border px-4 py-3 font-tajawal backdrop-blur-md",
        compact ? "rounded-full py-2.5" : "rounded-xl",
        style.card,
        className,
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          compact && "h-7 w-7",
          style.iconWrap,
        )}
      >
        {icon ?? <Icon className="h-4 w-4" strokeWidth={2.25} />}
      </span>
      <div className="min-w-0 flex-1 text-right leading-relaxed">
        <p className={cn("text-sm font-bold tracking-wide", style.title)}>{title}</p>
        {detail ? <p className={cn("mt-0.5 text-xs font-medium", style.detail)}>{detail}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-1.5 self-center">{action}</div> : null}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition",
            style.close,
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function DashboardBanner(props: AlertCardProps) {
  return <DashboardAlertCard {...props} />;
}

export function DashboardToastHost() {
  const items = useSyncExternalStore(subscribeDashboardToasts, getDashboardToasts, getDashboardToasts);

  return (
    <div
      dir="rtl"
      className="pointer-events-none fixed inset-x-0 top-20 z-[95] flex justify-center px-4 sm:top-24"
    >
      <div className="flex w-full max-w-md flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pointer-events-auto"
            >
              <DashboardAlertCard
                tone={item.tone}
                title={item.title}
                detail={item.detail}
                onClose={() => dismissDashboardToast(item.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function asAlertTone(kind?: NoticeKind): AlertTone {
  if (kind === "ok") return "success";
  if (kind === "warn") return "warning";
  return kind || "success";
}
