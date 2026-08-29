export function scrollToOrderFields() {
  const el = document.getElementById("order-fields") ?? document.getElementById("order-form");
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 8;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
