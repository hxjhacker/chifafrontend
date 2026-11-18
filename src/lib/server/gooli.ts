import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gooliExternalRef, hasCompleteConfirmDetails, type AdminOrder, type AdminStatus } from "@/lib/admin";
import { ensureSchema, getPool } from "@/lib/server/db";
import { getAdminOrder, getAdminOrdersByIds } from "@/lib/server/admin-orders";
import {
  GOOLI_BATCH_LIMIT,
  GOOLI_CARRIER,
  buildGooliOrder,
  chunk,
  formatGooliErrors,
  isGooliCarrier,
  mapGooliStatus,
  parseGooliCreated,
  parseGooliErrors,
  shouldApplyGooliStatus,
  verifyGooliSignature,
  type GooliFieldError,
  type GooliOrderPayload,
} from "@/lib/server/gooli-protocol";

export { isGooliCarrier, formatGooliErrors };

const CREATE_PATH = "/api_orders.php?action=create";

type DispatchRow = {
  order_id: string;
  success: boolean;
  tracking: string;
  error: string;
  carrier: string;
};

export type GooliDispatchResponse = {
  httpStatus: number;
  success_count: number;
  failed_count: number;
  message: string;
  errors: GooliFieldError[];
  results: DispatchRow[];
};

function cleanEnvValue(value: string | undefined | null) {
  let text = String(value || "").trim().replace(/^\uFEFF/, "");
  if (text.length >= 2 && (text[0] === "'" || text[0] === '"') && text[0] === text[text.length - 1]) {
    text = text.slice(1, -1).trim();
  }
  return text;
}

function envFromFiles(name: string) {
  const roots = [process.cwd(), join(process.cwd(), "chifafrontend"), join(process.cwd(), "..")];
  const files = [".env.local", ".env.production.local", ".env.production", ".env"];
  for (const root of roots) {
    for (const file of files) {
      const path = join(root, file);
      if (!existsSync(path)) continue;
      let raw = "";
      try {
        raw = readFileSync(path, "utf8");
      } catch {
        continue;
      }
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const body = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
        const eq = body.indexOf("=");
        if (eq < 1 || body.slice(0, eq).trim() !== name) continue;
        const value = cleanEnvValue(body.slice(eq + 1));
        if (value) return value;
      }
    }
  }
  return "";
}

function cleanEnv(name: string) {
  return cleanEnvValue(process.env[name]) || envFromFiles(name);
}

export function gooliApiKey() {
  return cleanEnv("GOOLI_API_KEY");
}

export function gooliWebhookSecret() {
  return cleanEnv("GOOLI_WEBHOOK_SECRET") || gooliApiKey();
}

export function gooliApiBase() {
  return (cleanEnv("GOOLI_API_BASE") || "https://gooli.pro").replace(/\/+$/, "");
}

export function gooliConfigured() {
  return Boolean(gooliApiKey());
}

function failure(orderId: string, error: string): DispatchRow {
  return { order_id: orderId, success: false, tracking: "", error, carrier: GOOLI_CARRIER };
}

function success(orderId: string, tracking: string): DispatchRow {
  return { order_id: orderId, success: true, tracking, error: "", carrier: GOOLI_CARRIER };
}

async function rememberShipment(
  orderId: string,
  tracking: string,
  externalRef: string,
  results: DispatchRow[],
  errors: GooliFieldError[],
) {
  try {
    await markShipped(orderId, tracking);
  } catch (err) {
    const message = `تم إنشاء الشحنة (${tracking}) لكن تعذر حفظها محلياً.`;
    console.error("gooli_mark_shipped_failed", orderId, err);
    results.push(failure(orderId, message));
    errors.push({ external_ref: externalRef, message });
    return;
  }
  results.push(success(orderId, tracking));
}

async function markShipped(orderId: string, tracking: string) {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query(
      `UPDATE orders SET
         status = 'shipped',
         carrier = $2,
         carrier_status = 'Ajouté',
         meta_livraison_code = $3,
         meta_livraison_sent_at = COALESCE(meta_livraison_sent_at, now()),
         dispatched_at = COALESCE(dispatched_at, now()),
         shipped_at = COALESCE(shipped_at, now()),
         confirmed_at = COALESCE(confirmed_at, now()),
         cancelled_at = NULL,
         delivered_at = NULL,
         team_payout_paid = false,
         updated_at = now()
       WHERE id = $1`,
      [orderId, GOOLI_CARRIER, tracking.slice(0, 80)],
    );
  } finally {
    client.release();
  }
}

async function postBatch(orders: GooliOrderPayload[]) {
  const res = await fetch(`${gooliApiBase()}${CREATE_PATH}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Api-Key": gooliApiKey(),
    },
    body: JSON.stringify({ orders }),
    signal: AbortSignal.timeout(20000),
  });
  const raw = await res.text();
  let payload: unknown = raw;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    payload = { message: raw.slice(0, 500) };
  }
  return { status: res.status, payload };
}

export async function dispatchOrdersToGooli(orderIds: string[]): Promise<GooliDispatchResponse> {
  const ids = [...new Set(orderIds.map((id) => String(id || "").trim()).filter(Boolean))].slice(0, 1000);
  if (!ids.length) {
    return {
      httpStatus: 422,
      success_count: 0,
      failed_count: 0,
      message: "حدّد طلبيات أولاً.",
      errors: [{ message: "حدّد طلبيات أولاً." }],
      results: [],
    };
  }
  if (!gooliConfigured()) {
    return {
      httpStatus: 400,
      success_count: 0,
      failed_count: ids.length,
      message: "أضف GOOLI_API_KEY في بيئة الخادم أولاً.",
      errors: [{ message: "أضف GOOLI_API_KEY في بيئة الخادم أولاً." }],
      results: ids.map((id) => failure(id, "gooli_not_configured")),
    };
  }

  const orders = await getAdminOrdersByIds(ids);
  const byId = new Map(orders.map((order) => [order.order_id, order]));
  const results: DispatchRow[] = [];
  const errors: GooliFieldError[] = [];
  const ready: { order: AdminOrder; payload: GooliOrderPayload }[] = [];

  for (const id of ids) {
    const order = byId.get(id);
    if (!order) {
      results.push(failure(id, "الطلبية غير موجودة."));
      errors.push({ message: "الطلبية غير موجودة." });
      continue;
    }
    const ref = gooliExternalRef(order.order_id);
    if (order.status === "cancelled" || order.status === "returned") {
      const message = order.status === "returned" ? "لا يمكن شحن طلبية مرتجعة." : "لا يمكن شحن طلبية ملغاة.";
      results.push(failure(id, message));
      errors.push({ external_ref: ref, message });
      continue;
    }
    if (order.status !== "confirmed" && order.status !== "shipped") {
      results.push(failure(id, "الطلبية غير مؤكدة."));
      errors.push({ external_ref: ref, message: "الطلبية غير مؤكدة." });
      continue;
    }
    if (!hasCompleteConfirmDetails(order)) {
      results.push(failure(id, "كمّل عنوان التوصيل قبل الإرسال."));
      errors.push({ external_ref: ref, message: "كمّل عنوان التوصيل قبل الإرسال." });
      continue;
    }
    const existing = String(order.meta_livraison_code || order.tracking_number || "").trim();
    if (existing) {
      results.push(success(id, existing));
      continue;
    }
    const built = buildGooliOrder(order);
    if ("error" in built) {
      results.push(failure(id, built.error.message));
      errors.push(built.error);
      continue;
    }
    ready.push({ order, payload: built.payload });
  }

  for (const group of chunk(ready, GOOLI_BATCH_LIMIT)) {
    let response: { status: number; payload: unknown };
    try {
      response = await postBatch(group.map((row) => row.payload));
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر الاتصال بـ Gooli.";
      for (const row of group) {
        results.push(failure(row.order.order_id, message));
        errors.push({ external_ref: row.payload.external_ref, message });
      }
      continue;
    }
    const created = parseGooliCreated(response.payload);
    const remoteErrors = parseGooliErrors(response.payload);
    const createdByRef = new Map(created.map((row) => [row.external_ref.toUpperCase(), row.tracking_code]));
    if (response.status === 201 || (response.status === 200 && created.length && !remoteErrors.length)) {
      for (const row of group) {
        const tracking = createdByRef.get(row.payload.external_ref.toUpperCase()) || "";
        if (!tracking) {
          const message = "Gooli لم يُرجع رقم التتبع.";
          results.push(failure(row.order.order_id, message));
          errors.push({ external_ref: row.payload.external_ref, message });
          continue;
        }
        await rememberShipment(row.order.order_id, tracking, row.payload.external_ref, results, errors);
      }
      continue;
    }
    const byRef = new Map<string, GooliFieldError[]>();
    for (const error of remoteErrors) {
      const key = String(error.external_ref || "").replace(/^#/, "").toUpperCase();
      const list = byRef.get(key) || [];
      list.push(error);
      byRef.set(key, list);
    }
    for (const row of group) {
      const tracking = createdByRef.get(row.payload.external_ref.toUpperCase()) || "";
      if (tracking && response.status < 400) {
        await rememberShipment(row.order.order_id, tracking, row.payload.external_ref, results, errors);
        continue;
      }
      const matched = byRef.get(row.payload.external_ref.toUpperCase()) || (!byRef.size ? remoteErrors : []);
      const message = formatGooliErrors(matched) || `رفض Gooli الإرسال (${response.status}).`;
      results.push(failure(row.order.order_id, message));
      errors.push(...(matched.length ? matched : [{ external_ref: row.payload.external_ref, message }]));
    }
  }

  const successCount = results.filter((row) => row.success).length;
  const failedCount = results.length - successCount;
  const message =
    formatGooliErrors(errors) ||
    (failedCount ? `فشل إرسال ${failedCount} طلبية إلى Gooli.` : `تم إرسال ${successCount} طلبية إلى Gooli.`);
  return {
    httpStatus: successCount > 0 ? 200 : 422,
    success_count: successCount,
    failed_count: failedCount,
    message,
    errors,
    results,
  };
}

type WebhookOrder = {
  id: string;
  status: string;
  carrier: string | null;
  meta_livraison_code: string | null;
};

function readEvent(payload: unknown) {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root.order && typeof root.order === "object"
        ? (root.order as Record<string, unknown>)
        : root;
  const event = String(root.event || root.type || root.action || "").trim();
  const externalRef = String(data.external_ref || data.externalRef || data.reference || root.external_ref || "")
    .trim()
    .replace(/^#/, "");
  const tracking = String(data.tracking_code || data.trackingCode || data.tracking || root.tracking_code || "").trim();
  const status = String(data.status || data.order_status || data.new_status || root.status || "").trim();
  const eventId = String(root.id || root.event_id || root.eventId || data.id || "").trim();
  const proofSource = root.proof && typeof root.proof === "object" ? root.proof : data.proof || data.call_proof || data;
  return { event, externalRef, tracking, status, eventId, proofSource };
}

async function findWebhookOrder(externalRef: string, tracking: string): Promise<WebhookOrder | null> {
  const client = await getPool().connect();
  try {
    if (tracking) {
      const byTracking = await client.query<WebhookOrder>(
        `SELECT id::text, status, carrier, meta_livraison_code
         FROM orders
         WHERE BTRIM(COALESCE(meta_livraison_code, '')) = $1
         LIMIT 2`,
        [tracking],
      );
      if (byTracking.rows.length === 1) return byTracking.rows[0];
    }
    if (!externalRef) return null;
    const byRef = await client.query<WebhookOrder>(
      `SELECT id::text, status, carrier, meta_livraison_code
       FROM orders
       WHERE id::text = $1
          OR UPPER(REPLACE(id::text, '-', '')) = UPPER(REPLACE($1, '-', ''))
          OR (
            UPPER($1) ~ '^CFG-[0-9A-F]{6,}$'
            AND UPPER(LEFT(REPLACE(id::text, '-', ''), LENGTH($1) - 4)) = UPPER(SUBSTRING($1 FROM 5))
          )
       LIMIT 2`,
      [externalRef],
    );
    if (byRef.rows.length !== 1) return null;
    const row = byRef.rows[0];
    const stored = String(row.meta_livraison_code || "").trim();
    const carrier = String(row.carrier || "");
    if (stored && tracking && stored !== tracking && carrier && carrier !== GOOLI_CARRIER) return null;
    return row;
  } finally {
    client.release();
  }
}

export async function handleGooliWebhook(input: {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
  eventIdHeader?: string | null;
}) {
  if (!verifyGooliSignature({
    rawBody: input.rawBody,
    signatureHeader: input.signature,
    timestampHeader: input.timestamp,
    secret: gooliWebhookSecret(),
  })) {
    return { status: 401, body: { ok: false, error: "invalid_signature" } };
  }
  let payload: unknown = {};
  try {
    payload = input.rawBody ? JSON.parse(input.rawBody) : {};
  } catch {
    return { status: 400, body: { ok: false, error: "invalid_json" } };
  }
  const event = readEvent(payload);
  const eventId = String(input.eventIdHeader || event.eventId || "").slice(0, 120);
  await ensureSchema();
  const order = await findWebhookOrder(event.externalRef, event.tracking);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    if (eventId) {
      const inserted = await client.query(
        `INSERT INTO gooli_webhook_events (event_id) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_id`,
        [eventId],
      );
      if (!inserted.rows.length) {
        await client.query("COMMIT");
        return { status: 200, body: { ok: true, duplicate: true } };
      }
    }
    if (!order) {
      await client.query("COMMIT");
      return { status: 200, body: { ok: true, matched: false } };
    }

    const eventName = event.event.toLowerCase();
    const isProof = eventName.includes("call_proof");
    const nextStatus = isProof ? null : mapGooliStatus(event.status);
    const current = (String(order.status || "new") === "in_shipping" ? "shipped" : String(order.status || "new")) as AdminStatus;
    const applyStatus = nextStatus && shouldApplyGooliStatus(current, nextStatus) ? nextStatus : null;
    const proof = isProof ? JSON.stringify(event.proofSource).slice(0, 4000) : "";
    await client.query(
      `UPDATE orders SET
         status = COALESCE($2::varchar, status),
         carrier = CASE
           WHEN $3 <> '' AND (carrier IS NULL OR BTRIM(carrier) = '' OR carrier = 'gooli' OR COALESCE(BTRIM(meta_livraison_code), '') = '') THEN 'gooli'
           ELSE carrier
         END,
         carrier_status = COALESCE(NULLIF($4, ''), carrier_status),
         meta_livraison_code = CASE WHEN $3 <> '' THEN LEFT($3, 80) ELSE meta_livraison_code END,
         confirmed_at = CASE
           WHEN COALESCE($2::varchar, status) IN ('confirmed','shipped','out_of_zone','delivered','returned') THEN COALESCE(confirmed_at, now())
           ELSE confirmed_at
         END,
         shipped_at = CASE
           WHEN COALESCE($2::varchar, status) IN ('shipped','out_of_zone','delivered','returned') THEN COALESCE(shipped_at, now())
           ELSE shipped_at
         END,
         delivered_at = CASE
           WHEN COALESCE($2::varchar, status) = 'delivered' THEN COALESCE(delivered_at, now())
           WHEN COALESCE($2::varchar, status) IN ('returned','cancelled','shipped','out_of_zone') THEN NULL
           ELSE delivered_at
         END,
         cancelled_at = CASE
           WHEN COALESCE($2::varchar, status) = 'cancelled' THEN COALESCE(cancelled_at, now())
           ELSE NULL
         END,
         team_payout_paid = CASE WHEN COALESCE($2::varchar, status) = 'delivered' THEN team_payout_paid ELSE false END,
         gooli_call_proof = CASE WHEN $5 <> '' THEN $5 ELSE gooli_call_proof END,
         updated_at = now()
       WHERE id = $1`,
      [order.id, applyStatus, event.tracking, event.status.slice(0, 50), proof],
    );
    await client.query("COMMIT");
    const invoiceEligible = applyStatus === "delivered" && current !== "delivered";
    return {
      status: 200,
      body: {
        ok: true,
        matched: true,
        order_id: order.id,
        status: applyStatus || current,
        invoice_eligible: invoiceEligible,
      },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function dispatchOneToGooli(orderId: string) {
  const result = await dispatchOrdersToGooli([orderId]);
  const row = result.results[0];
  if (!row?.success) {
    return {
      status: result.httpStatus === 200 ? 422 : result.httpStatus,
      body: {
        success: false,
        detail: row?.error || result.message,
        message: row?.error || result.message,
        errors: result.errors,
        carrier: GOOLI_CARRIER,
      },
    };
  }
  const order = await getAdminOrder(row.order_id);
  return {
    status: 200,
    body: {
      success: true,
      ...(order || {}),
      carrier: GOOLI_CARRIER,
      meta_livraison_code: row.tracking,
      tracking_number: row.tracking,
      message: `تم إرسال الطرد عبر Gooli. كود التتبع: ${row.tracking}`,
    },
  };
}
