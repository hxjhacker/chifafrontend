"use client";

import { useEffect } from "react";
import { bindOrderToastGlobals } from "@/lib/order-toasts";

export function OrderToastStack() {
  useEffect(() => {
    bindOrderToastGlobals();
  }, []);

  return (
    <div
      id="toastContainer"
      className="hidden sm:flex fixed bottom-6 left-6 w-[340px] z-[9999] flex-col gap-2 max-h-[380px] overflow-y-auto toast-scroll p-0.5 pointer-events-auto"
    />
  );
}
