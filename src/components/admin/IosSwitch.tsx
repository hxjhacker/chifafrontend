"use client";

import { cn } from "@/lib/cn";

type Props = {
  checked: boolean;
  className?: string;
};

export function IosSwitch({ checked, className }: Props) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-[#5bb381]" : "bg-[#1e293b]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </span>
  );
}
