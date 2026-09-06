"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { filterOfficialMetaCities, isOfficialMetaCity } from "@/lib/meta-livraison-cities";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
  required?: boolean;
  tone?: "dark" | "light";
};

export function MetaCityCombobox({ value, onChange, placeholder = "Rechercher une ville Meta…", required, tone = "dark" }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const options = useMemo(() => filterOfficialMetaCities(query, 50), [query]);
  const valid = isOfficialMetaCity(value);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const field =
    tone === "light"
      ? "border-gold/20 bg-cream text-royal placeholder-royal/30 focus:border-gold dark:bg-brandDark dark:text-white"
      : "border-[#1e293b] bg-[#060b14] text-white placeholder:text-slate-600 focus:border-[#0284c7]";

  return (
    <div ref={rootRef} className="relative">
      <div className={cn("flex items-center rounded-xl border px-3 transition", field, open && "ring-1 ring-[#0284c7]/40")}>
        <Search className="h-3.5 w-3.5 shrink-0 opacity-50" />
        <input
          value={open ? query : value}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery(value);
            setOpen(true);
          }}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-2.5 font-bold outline-none"
        />
        <button type="button" tabIndex={-1} onClick={() => setOpen((v) => !v)} className="shrink-0 opacity-60">
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>
      {value && !valid ? (
        <p className="mt-1 font-bold text-amber-400">اختَر مدينة رسمية من قائمة Meta Livraison</p>
      ) : null}
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border py-1 shadow-xl",
            tone === "light" ? "border-gold/20 bg-white dark:bg-cardDark" : "border-[#1e293b] bg-[#0b1322]",
          )}
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-slate-500">Aucune ville</li>
          ) : (
            options.map((city) => {
              const selected = city === value;
              return (
                <li key={city}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(city);
                      setQuery(city);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left font-bold transition",
                      selected ? "bg-[#0284c7]/20 text-[#38bdf8]" : "hover:bg-white/5",
                    )}
                  >
                    <span dir="ltr">{city}</span>
                    {selected ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
