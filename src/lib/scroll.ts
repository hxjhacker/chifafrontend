export function scrollToOrderFields() {
  const el = document.getElementById("order-form") ?? document.getElementById("order-fields");
  if (!el) return;
  const header = document.querySelector("header");
  const headerH = header instanceof HTMLElement ? header.getBoundingClientRect().height : 72;
  const top = el.getBoundingClientRect().top + window.scrollY - headerH - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
