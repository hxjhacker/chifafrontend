import webpush from "web-push";
import { randomUUID } from "node:crypto";
import { ensureSchema, getPool } from "./db";
import { PACK_NAMES } from "@/lib/admin";

const DEFAULT_PUBLIC =
  "BLIQF0U5W6Xd-DZjVgIqpNJoBlJo48KDeOn5DvMRQBWZY36qKbQeNYmAubek3DEgqmmC5ot2HuGN_m_jM7gmIbA";
const DEFAULT_PRIVATE = "aoeWVCDnWXyAQB7YjEldsJXqdaNk8005Ks2PwckW8TI";

function vapidPublic() {
  return (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_PUBLIC).trim();
}

function vapidPrivate() {
  return (process.env.VAPID_PRIVATE_KEY || DEFAULT_PRIVATE).trim();
}

function vapidSubject() {
  return (process.env.VAPID_SUBJECT || "mailto:hello@chifaglow.com").trim();
}

export function pushPublicKey() {
  return vapidPublic();
}

function configure() {
  const publicKey = vapidPublic();
  const privateKey = vapidPrivate();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(vapidSubject(), publicKey, privateKey);
  return true;
}

export type PushSubscriptionIn = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function savePushSubscription(input: PushSubscriptionIn, userAgent = "") {
  const endpoint = String(input.endpoint || "").trim();
  const p256dh = String(input.keys?.p256dh || "").trim();
  const auth = String(input.keys?.auth || "").trim();
  if (!endpoint.startsWith("https://") || !p256dh || !auth) {
    throw new Error("invalid_subscription");
  }
  await ensureSchema();
  await getPool().query(
    `INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_agent = EXCLUDED.user_agent`,
    [randomUUID(), endpoint, p256dh, auth, userAgent.slice(0, 400) || null],
  );
}

export async function deletePushSubscription(endpoint: string) {
  const value = String(endpoint || "").trim();
  if (!value) return;
  await ensureSchema();
  await getPool().query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [value]);
}

export async function notifyNewOrder(order: {
  fullName: string;
  city: string;
  productSlug: string;
  qty?: number;
  totalMad?: number;
}) {
  if (!configure()) return;
  await ensureSchema();
  const product = PACK_NAMES[order.productSlug] || order.productSlug;
  const qty = order.qty && order.qty > 1 ? ` × ${order.qty}` : "";
  const total = order.totalMad ? ` · ${Math.round(order.totalMad)} DH` : "";
  const payload = JSON.stringify({
    title: "طلب جديد في المتجر! 🔔",
    body: `${order.fullName} · ${order.city} · ${product}${qty}${total}`,
    url: "/mydashboard",
    tag: "chifaglow-new-order",
  });
  const rows = await getPool().query<{ endpoint: string; p256dh: string; auth: string }>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions`,
  );
  await Promise.all(
    rows.rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          payload,
          { TTL: 60 * 60, urgency: "high" },
        );
      } catch (err) {
        const status = Number((err as { statusCode?: number }).statusCode || 0);
        if (status === 404 || status === 410) {
          await deletePushSubscription(row.endpoint);
        } else {
          console.error("push_send_failed", status || err);
        }
      }
    }),
  );
}
