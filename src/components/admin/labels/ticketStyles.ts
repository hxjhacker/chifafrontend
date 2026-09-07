"use client";

import type { CSSProperties } from "react";

export const TICKET_FONT =
  "Arial, Helvetica, Tahoma, 'Segoe UI', 'Noto Sans Arabic', 'Cairo', sans-serif";

export const ticketBox: CSSProperties = {
  width: "100mm",
  height: "100mm",
  border: "2px solid #000",
  fontFamily: TICKET_FONT,
  color: "#000",
  background: "#fff",
  boxSizing: "border-box",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  margin: "0 auto",
  userSelect: "none",
  overflow: "hidden",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

export const hair = "1px solid #000";
export const thick = "2px solid #000";
