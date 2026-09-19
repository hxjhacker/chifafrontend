"use client";

import { useEffect } from "react";
import { bindOrderToastGlobals } from "@/lib/order-toasts";

export function OrderToastStack() {
  useEffect(() => bindOrderToastGlobals(), []);

  return (
    <div
      id="toastContainer"
      dir="rtl"
      className="toast-scroll pointer-events-auto fixed bottom-6 left-6 z-[9999] hidden max-h-[380px] w-[340px] flex-col gap-2 overflow-y-auto p-0.5 sm:flex"
    />
  );
}
