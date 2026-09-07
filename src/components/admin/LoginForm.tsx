"use client";

import { FormEvent, MouseEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleAlert, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/Chrome";
import { cn } from "@/lib/cn";

const REMEMBER_KEY = "cg_admin_remember_user";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spot, setSpot] = useState({ x: 0, y: 0 });

  useEffect(() => {
      try {
        const saved = localStorage.getItem(REMEMBER_KEY);
        if (saved) {
          setUsername(saved);
          setRemember(true);
        }
      } catch (e) {
        console.warn("Failed to parse cached settings:", e);
        try {
          localStorage.removeItem(REMEMBER_KEY);
        } catch {
          /* ignore */
        }
      }
  }, []);

  function onCardMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({ username: username.trim(), password, remember, rememberMe: remember }),
      });
      if (res.status === 429) {
        setError("محاولات كثيرة. انتظر 15 دقيقة ثم أعد المحاولة.");
        return;
      }
      if (res.status === 503) {
        setError("لوحة التحكم غير مهيأة بعد. أضف بيانات الدخول في الخادم.");
        return;
      }
      if (!res.ok) {
        setError("بيانات الدخول غير صحيحة، يرجى المحاولة مرة أخرى.");
        return;
      }
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, username.trim());
        else localStorage.removeItem(REMEMBER_KEY);
      } catch {
        /* ignore */
      }
      router.replace("/mydashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof DOMException && err.name === "AbortError" ? "انتهت مهلة الاتصال. حاول مرة أخرى." : "تعذر الاتصال. حاول مرة أخرى.");
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050B14] p-4 font-tajawal text-white">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-gold/10 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-sky-600/10 blur-[140px]" />

      <div className="absolute left-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        onMouseMove={onCardMove}
        className="group relative w-full max-w-[440px] overflow-hidden rounded-[36px] border border-gold/30 bg-[#0c1728] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-3xl sm:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            left: spot.x,
            top: spot.y,
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        <div className="relative mb-8 text-center">
          <div className="relative inline-flex flex-col items-center">
            <div className="relative z-10 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/40 bg-gradient-to-b from-[#111c30] to-[#070e1b] shadow-2xl">
              <span className="font-cinzel text-4xl font-black tracking-tighter text-gold drop-shadow-md">C</span>
            </div>
            <div className="pointer-events-none absolute -bottom-2 h-3 w-14 animate-pulse rounded-full bg-gold opacity-75 blur-md" />
          </div>
          <h1 className="mt-3 font-cinzel text-2xl font-black tracking-[0.2em] text-white sm:text-3xl">CHIFAGLOW</h1>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold">Secure Administration Portal</p>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="relative space-y-4 text-xs">
          <div className="space-y-1.5">
            <label htmlFor="admin-username" className="block pr-1 text-right font-bold text-slate-300">
              اسم المستخدم أو البريد الإلكتروني *
            </label>
            <div className="group/field relative">
              <User className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within/field:text-gold" />
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="manager@chifa.com"
                className="w-full rounded-2xl border border-white/10 bg-[#040810] py-4 pl-4 pr-11 font-bold text-white shadow-inner placeholder-slate-600 transition-all focus:border-gold/80 focus:outline-none focus:ring-4 focus:ring-gold/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block pr-1 text-right font-bold text-slate-300">
              كلمة المرور الإدارية *
            </label>
            <div className="group/field relative">
              <Lock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within/field:text-gold" />
              <input
                id="admin-password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full rounded-2xl border border-white/10 bg-[#040810] py-4 pl-11 pr-11 font-mono font-bold text-white shadow-inner placeholder-slate-600 transition-all focus:border-gold/80 focus:outline-none focus:ring-4 focus:ring-gold/10"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center px-1 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={remember}
              onClick={() => setRemember((v) => !v)}
              className="flex cursor-pointer select-none items-center"
            >
              <span
                className={cn(
                  "relative h-6 w-10 rounded-full border shadow-inner transition-colors",
                  remember ? "border-gold bg-gold" : "border-white/10 bg-[#040810]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-[3px] h-[18px] w-[18px] rounded-full border border-gray-300 bg-white transition-all",
                    remember ? "right-[19px]" : "right-[3px]",
                  )}
                />
              </span>
              <span className="mr-3 text-xs font-bold text-slate-300">تذكرني على هذا الجهاز</span>
            </button>
          </div>

          <AnimatePresence>
            {error ? (
              <motion.div
                key={error}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center text-xs font-bold text-rose-300 shadow-lg"
                role="alert"
              >
                <CircleAlert className="ml-1.5 inline h-3.5 w-3.5" />
                {error}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="relative pt-2">
            <div aria-hidden className="pointer-events-none absolute inset-x-4 -bottom-1 h-4 rounded-full bg-gold/30 blur-md" />
            <button
              type="submit"
              disabled={loading}
              className="relative z-10 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-gold via-[#e6c453] to-gold py-4 text-sm font-black tracking-wide text-[#050B14] shadow-[0_10px_25px_-5px_rgba(212,175,55,0.4)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جاري التحقق من الهوية...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول الآمن</span>
                  <ArrowLeft className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="relative mt-8 border-t border-white/5 pt-5 text-center">
          <p className="text-[11px] font-semibold tracking-wider text-slate-500">CHIFAGLOW Enterprise Core © 2026</p>
        </div>
      </motion.div>
    </div>
  );
}
