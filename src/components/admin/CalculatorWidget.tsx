"use client";

import { useEffect, useState } from "react";
import { Calculator, Delete, Equal, X } from "lucide-react";
import { cn } from "@/lib/cn";

const KEYS = [
  "C",
  "⌫",
  "/",
  "*",
  "7",
  "8",
  "9",
  "-",
  "4",
  "5",
  "6",
  "+",
  "1",
  "2",
  "3",
  ".",
  "0",
  "=",
];

const OPERATORS = new Set(["+", "-", "*", "/"]);

function evaluateExpression(expression: string) {
  const normalized = expression.replace(/\s+/g, "");
  if (!normalized) return 0;
  const tokens = normalized.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/]/g);
  if (!tokens || tokens.join("") !== normalized) throw new Error("invalid_expression");

  const values: number[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const apply = () => {
    const operator = operators.pop();
    const right = values.pop();
    const left = values.pop();
    if (!operator || left == null || right == null) throw new Error("invalid_expression");
    if (operator === "/" && right === 0) throw new Error("division_by_zero");
    values.push(operator === "+" ? left + right : operator === "-" ? left - right : operator === "*" ? left * right : left / right);
  };

  let expectingValue = true;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!OPERATORS.has(token)) {
      const value = Number(token);
      if (!Number.isFinite(value)) throw new Error("invalid_expression");
      values.push(value);
      expectingValue = false;
      continue;
    }
    if (expectingValue && token === "-" && index === 0) {
      values.push(0);
    } else if (expectingValue) {
      throw new Error("invalid_expression");
    }
    while (operators.length && precedence[operators[operators.length - 1]] >= precedence[token]) apply();
    operators.push(token);
    expectingValue = true;
  }
  if (expectingValue) throw new Error("invalid_expression");
  while (operators.length) apply();
  if (values.length !== 1 || !Number.isFinite(values[0])) throw new Error("invalid_expression");
  return values[0];
}

function formatResult(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
}

export function CalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [display, setDisplay] = useState("0");
  const [error, setError] = useState("");

  function press(key: string) {
    setError("");
    if (key === "C") {
      setExpression("");
      setDisplay("0");
      return;
    }
    if (key === "⌫") {
      const next = expression.slice(0, -1);
      setExpression(next);
      setDisplay(next || "0");
      return;
    }
    if (key === "=") {
      try {
        const result = formatResult(evaluateExpression(expression));
        setExpression(result);
        setDisplay(result);
      } catch (err) {
        setError(err instanceof Error && err.message === "division_by_zero" ? "لا يمكن القسمة على صفر" : "عملية غير صالحة");
      }
      return;
    }
    if (OPERATORS.has(key)) {
      if (!expression && key !== "-") return;
      const next = OPERATORS.has(expression.slice(-1)) ? `${expression.slice(0, -1)}${key}` : `${expression}${key}`;
      setExpression(next);
      setDisplay(next);
      return;
    }
    if (key === "." && expression.split(/[+\-*/]/).pop()?.includes(".")) return;
    const next = `${expression}${key}`;
    setExpression(next);
    setDisplay(next);
  }

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      const numpadKey =
        event.code === "NumpadDecimal"
          ? "."
          : event.code === "NumpadAdd"
            ? "+"
            : event.code === "NumpadSubtract"
              ? "-"
              : event.code === "NumpadMultiply"
                ? "*"
                : event.code === "NumpadDivide"
                  ? "/"
                  : event.key;
      const key = numpadKey === "Enter" ? "=" : numpadKey;

      if (key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (key === "Backspace" || key === "Delete") {
        event.preventDefault();
        press("⌫");
        return;
      }
      if (/^[0-9]$/.test(key) || OPERATORS.has(key) || key === "." || key === "=") {
        event.preventDefault();
        press(key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, expression]);

  return (
    <div className="fixed bottom-4 left-3 z-50 select-none sm:bottom-6 sm:left-6" dir="rtl">
      <div
        className={cn(
          "absolute bottom-full left-0 mb-3 w-[calc(100vw-1.5rem)] max-w-[280px] origin-bottom-left rounded-2xl border border-cyan-500/40 bg-[#0c1322]/98 p-3 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl transition-all duration-200",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
        aria-hidden={!open}
      >
        <div className="mb-3 flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Calculator className="h-4 w-4 text-cyan-400" />
            آلة حاسبة
          </div>
          <button type="button" onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111927] text-slate-400 transition hover:text-white" aria-label="إغلاق الآلة الحاسبة">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mb-2 rounded-xl border border-slate-800 bg-[#070b12] p-3 text-left" dir="ltr">
          <div className="min-h-5 truncate text-[10px] font-bold text-slate-500">{expression || "0"}</div>
          <div className={cn("mt-1 truncate text-2xl font-black text-white", error && "text-rose-400")}>{error || display}</div>
        </div>

        <div className="grid grid-cols-4 gap-1.5" dir="ltr">
          {KEYS.map((key) => {
            const isOperator = OPERATORS.has(key);
            const isEquals = key === "=";
            const isClear = key === "C";
            return (
              <button
                key={key}
                type="button"
                onClick={() => press(key)}
                className={cn(
                  "flex h-10 items-center justify-center rounded-xl border text-sm font-black transition active:scale-95",
                  isEquals
                    ? "col-span-2 border-cyan-400/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
                    : isClear
                      ? "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                      : isOperator
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                        : "border-slate-800 bg-[#111927] text-slate-200 hover:bg-[#162134]",
                )}
                aria-label={key === "⌫" ? "حذف آخر رقم" : key}
              >
                {key === "⌫" ? <Delete className="h-4 w-4" /> : key === "=" ? <Equal className="h-4 w-4" /> : key}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-[#0c1322] text-cyan-400 shadow-2xl shadow-cyan-950/20 transition hover:scale-105 hover:border-cyan-500 active:scale-95"
        title="آلة حاسبة"
        aria-label="فتح الآلة الحاسبة"
        aria-expanded={open}
      >
        <Calculator className="h-6 w-6 transition group-hover:rotate-6" />
      </button>
    </div>
  );
}
