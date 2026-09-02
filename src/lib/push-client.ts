"use client";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerAdminWorker() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export async function currentPushSubscription() {
  const ready = await navigator.serviceWorker.ready;
  return ready.pushManager.getSubscription();
}

export async function enablePushNotifications() {
  const keyRes = await fetch("/api/admin/push", { credentials: "include", cache: "no-store" });
  if (!keyRes.ok) throw new Error("missing_vapid");
  const { publicKey } = (await keyRes.json()) as { publicKey?: string };
  if (!publicKey) throw new Error("missing_vapid");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("permission_denied");
  const registration = await registerAdminWorker();
  await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  const saved = await fetch("/api/admin/push", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!saved.ok) throw new Error("subscribe_failed");
  return subscription;
}

export async function disablePushNotifications() {
  const subscription = await currentPushSubscription();
  if (subscription) {
    await fetch("/api/admin/push", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    await subscription.unsubscribe();
  }
}
