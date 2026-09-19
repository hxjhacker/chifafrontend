export type OrderToastInput = {
  isBlacklisted?: boolean;
  name?: string;
  phone?: string;
  city?: string;
  orderId?: string;
};

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function nationalPhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.startsWith("212") && digits.length >= 12) return `0${digits.slice(3, 13)}`;
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(0, 10);
  return String(phone || "").trim();
}

export function whatsappHref(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const intl = digits.startsWith("212") ? digits : `212${digits.replace(/^0/, "")}`;
  return `https://wa.me/${intl}`;
}

export function isDesktopOrderToastViewport() {
  return typeof window !== "undefined" && window.innerWidth >= 640;
}

export function dismissToast(id: string) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  const timer = Number(el.dataset.timer || 0);
  if (timer) window.clearTimeout(timer);
  el.classList.add("opacity-0");
  window.setTimeout(() => el.remove(), 300);
}

export function copyPhoneNumber(phone: string, btn?: HTMLElement | null) {
  const value = nationalPhone(phone);
  void navigator.clipboard.writeText(value).catch(() => undefined);
  const span = btn?.querySelector(".btn-text");
  if (!span || !btn) return;
  const originalText = span.textContent;
  span.textContent = "تم!";
  btn.classList.add("border-emerald-500/50", "text-emerald-400");
  window.setTimeout(() => {
    span.textContent = originalText;
    btn.classList.remove("border-emerald-500/50", "text-emerald-400");
  }, 1500);
}

export function showOrderToast({ isBlacklisted = false, name = "", phone = "", city = "", orderId = "" }: OrderToastInput = {}) {
  if (typeof window === "undefined" || window.innerWidth < 640) return "";
  const container = document.getElementById("toastContainer");
  if (!container) return "";

  const displayName = String(name || "").trim();
  const displayPhone = nationalPhone(phone);
  if (!displayName || !displayPhone) return "";

  const key = String(orderId || displayPhone).trim();
  if (key && container.querySelector(`[data-order-id="${escapeHtml(key)}"]`)) return "";

  const toastId = `toast_${Date.now()}`;
  const borderClass = isBlacklisted ? "border-rose-500/80 shadow-rose-950/40" : "border-emerald-500/80 shadow-emerald-950/40";
  const titleColor = isBlacklisted ? "text-rose-400" : "text-emerald-400";
  const iconBg = isBlacklisted ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400";
  const progressBg = isBlacklisted ? "bg-rose-500" : "bg-emerald-500";
  const phoneColor = isBlacklisted ? "text-rose-300" : "text-emerald-300";
  const titleText = isBlacklisted ? "تنبيه أمني: زبون محظور!" : "طلبية جديدة";
  const iconSvg = isBlacklisted
    ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>`
    : `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>`;
  const waHref = whatsappHref(displayPhone);
  const safeName = escapeHtml(displayName);
  const safeCity = escapeHtml(String(city || "").trim());
  const safePhone = escapeHtml(displayPhone);
  const safeId = escapeHtml(toastId);

  const toast = document.createElement("div");
  toast.id = toastId;
  toast.dataset.orderId = key;
  toast.setAttribute("data-allow-select", "true");
  toast.className = `relative w-full bg-[#0c1322]/95 backdrop-blur-md border ${borderClass} rounded-2xl p-2.5 sm:p-3 shadow-2xl transition-all duration-300 transform translate-y-3 opacity-0 shrink-0 overflow-hidden select-none`;
  toast.innerHTML = `
    <div class="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800/70">
      <div class="flex items-center gap-1.5">
        <span class="w-5 h-5 rounded-full ${iconBg} flex items-center justify-center shrink-0">${iconSvg}</span>
        <span class="font-black text-xs ${titleColor}">${titleText}</span>
        <span class="text-[10px] text-slate-400 font-medium">• الآن</span>
      </div>
      <button type="button" data-dismiss-toast="${safeId}" class="text-slate-400 hover:text-white p-0.5 transition" aria-label="إغلاق">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
    <div class="py-1.5 flex items-center justify-between text-[11px] text-slate-300">
      <div class="truncate max-w-[180px]">
        <strong class="text-white">${safeName}</strong>
        ${safeCity ? `<span class="text-slate-400 text-[10px]">(${safeCity})</span>` : ""}
      </div>
      <div class="font-mono font-bold ${phoneColor} text-xs tracking-tight shrink-0">${safePhone}</div>
    </div>
    <div class="pt-1 flex items-center gap-1.5">
      <a href="tel:${safePhone}" class="flex-1 py-1 px-1.5 rounded-lg bg-[#111927] border border-slate-700/80 text-sky-400 hover:text-white transition flex items-center justify-center gap-1 text-[10px] font-bold shadow-sm">
        <svg class="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
        <span>اتصال</span>
      </a>
      <a href="${escapeHtml(waHref)}" target="_blank" rel="noopener noreferrer" class="flex-1 py-1 px-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition flex items-center justify-center gap-1 text-[10px] font-bold shadow-sm">
        <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 00-3.48-8.413z"/></svg>
        <span>واتساب</span>
      </a>
      <button type="button" data-copy-phone="${safePhone}" class="flex-1 py-1 px-1.5 rounded-lg bg-[#111927] border border-slate-700/80 text-slate-200 hover:text-white transition flex items-center justify-center gap-1 text-[10px] font-bold shadow-sm">
        <svg class="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        <span class="btn-text">نسخ</span>
      </button>
    </div>
    <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-800">
      <div class="h-full ${progressBg} animate-progress-30s"></div>
    </div>
  `;

  toast.querySelector("[data-dismiss-toast]")?.addEventListener("click", () => dismissToast(toastId));
  toast.querySelector<HTMLElement>("[data-copy-phone]")?.addEventListener("click", (event) => {
    copyPhoneNumber(displayPhone, event.currentTarget as HTMLElement);
  });

  container.prepend(toast);
  window.requestAnimationFrame(() => {
    toast.classList.remove("translate-y-3", "opacity-0");
  });
  const timer = window.setTimeout(() => dismissToast(toastId), 30000);
  toast.dataset.timer = String(timer);
  return toastId;
}

export function bindOrderToastGlobals() {
  if (typeof window === "undefined") return () => undefined;
  window.showOrderToast = showOrderToast;
  window.dismissToast = dismissToast;
  window.copyPhoneNumber = copyPhoneNumber;
  return () => {
    if (window.showOrderToast === showOrderToast) delete window.showOrderToast;
    if (window.dismissToast === dismissToast) delete window.dismissToast;
    if (window.copyPhoneNumber === copyPhoneNumber) delete window.copyPhoneNumber;
  };
}

declare global {
  interface Window {
    showOrderToast?: typeof showOrderToast;
    dismissToast?: typeof dismissToast;
    copyPhoneNumber?: typeof copyPhoneNumber;
  }
}
