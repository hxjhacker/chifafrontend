"use client";

import { useEffect, useState } from "react";

interface SplashScreenProps {
  isLoading: boolean;
}

export default function SplashScreen({ isLoading }: SplashScreenProps) {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden bg-[#020617] p-8 font-mono text-slate-100 transition-opacity duration-700 select-none ${
        isLoading ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-150"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(245, 158, 11, 0.14), transparent 75%)`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0,transparent_75%)]" />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />

      <div className="z-20 flex w-full items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
          </span>
          <span className="tracking-widest">QUANTUM ENGINE // ACTIVE</span>
        </div>
        <span className="tracking-widest text-amber-500/80">ENCRYPTED NODE: 256-BIT</span>
      </div>

      <div className="relative z-20 -mt-8 flex flex-col items-center justify-center">
        <div className="relative flex h-48 w-48 items-center justify-center">
          <div className="pointer-events-none absolute inset-x-6 z-30 h-px animate-[scan_2.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

          <svg
            className="absolute inset-0 h-full w-full animate-[spin_12s_linear_infinite] text-amber-500/30"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="14 8 4 8" />
          </svg>

          <svg
            className="absolute inset-4 h-40 w-40 animate-[spin_7s_linear_infinite_reverse] text-amber-400/50"
            viewBox="0 0 100 100"
          >
            <polygon
              points="50,5 90,25 90,75 50,95 10,75 10,25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="8 6"
            />
          </svg>

          <div className="relative flex h-20 w-20 animate-pulse items-center justify-center">
            <div className="absolute h-14 w-14 rotate-45 rounded-sm bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 opacity-90 shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
            <div className="absolute flex h-10 w-10 rotate-45 items-center justify-center rounded-[2px] bg-[#020617]">
              <div className="h-4 w-4 rotate-45 bg-amber-400 shadow-[0_0_18px_#f59e0b]" />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-1.5 text-center font-mono">
          <h1 className="text-xl font-bold tracking-[0.4em] text-white uppercase drop-shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            CHIFA<span className="text-amber-400">GLOW</span>
          </h1>
          <p className="text-[9px] font-medium tracking-[0.35em] text-slate-400 uppercase">
            Executive Commerce Observatory
          </p>
        </div>

        <div className="mt-7 flex flex-col items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-1 w-2.5 animate-pulse rounded-[2px] bg-amber-400" />
            <div className="h-1 w-2.5 animate-pulse rounded-[2px] bg-amber-400/70 delay-75" />
            <div className="h-1 w-2.5 animate-pulse rounded-[2px] bg-amber-400/40 delay-150" />
            <div className="h-1 w-2.5 rounded-[2px] bg-slate-800" />
            <div className="h-1 w-2.5 rounded-[2px] bg-slate-800" />
          </div>
          <span className="font-mono text-[9px] tracking-widest text-amber-500/80 uppercase">
            Initializing encrypted channel...
          </span>
        </div>
      </div>

      <div className="z-20 font-mono text-[10px] tracking-wider text-slate-500">
        SHA-256 SECURED // HARDWARE AUTHENTICATED
      </div>
    </div>
  );
}
