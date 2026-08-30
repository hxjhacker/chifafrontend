"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/Chrome";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
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
        setError("اسم المستخدم أو كلمة المرور غير صحيحة.");
        return;
      }
      router.replace("/mydashboard");
      router.refresh();
    } catch {
      setError("تعذر الاتصال. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF8F5] px-4 py-10 dark:bg-[#0A192F]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(212,175,55,0.22), transparent 55%), radial-gradient(ellipse 50% 45% at 10% 100%, rgba(10,25,47,0.12), transparent 50%)",
        }}
      />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md rounded-3xl border border-gold/30 bg-white/70 p-8 shadow-luxury backdrop-blur-xl dark:border-gold/20 dark:bg-[#0A192F]/75"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-gold bg-[#0A192F] shadow-gold">
            <span className="font-cinzel text-3xl font-black text-gold">C</span>
          </div>
          <h1 className="font-cinzel text-3xl font-black tracking-[0.22em] text-[#0A192F] dark:text-cream">
            CHIFAGLOW
          </h1>
          <p className="mt-2 text-sm font-semibold text-gold-600 dark:text-gold">لوحة التحكم الخاصة</p>
        </div>

        <label className="mb-4 block text-sm font-bold text-royal dark:text-slate-100">
          اسم المستخدم
          <div className="relative mt-1.5">
            <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="field-input !mt-0 pr-10"
              required
            />
          </div>
        </label>

        <label className="mb-6 block text-sm font-bold text-royal dark:text-slate-100">
          كلمة المرور
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-600" />
            <input
              name="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input !mt-0 px-10"
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-royal/50 transition hover:text-gold dark:text-slate-300"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <AnimatePresence>
          {error ? (
            <motion.p
              key={error}
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: [0, -10, 10, -6, 6, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-3.5 text-sm font-black text-[#0A192F] shadow-gold transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? "جاري التحقق…" : "دخول"}
        </button>
      </motion.form>
    </div>
  );
}
