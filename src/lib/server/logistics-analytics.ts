import { displayStatus } from "@/lib/admin";
import { MOROCCO_REGIONS, regionIdForCity } from "@/lib/admin-geo";
import {
  deliveryFeeFromEnv,
  returnFeeFromEnv,
  trueDeliveryRate,
  type LogisticsAnalytics,
  type LogisticsRegion,
} from "@/lib/logistics";
import { ensureSchema, getPool } from "@/lib/server/db";

const REGION_IDS = new Set<string>(MOROCCO_REGIONS.map((r) => r.id));
const TOP_CITIES_LIMIT = 5;

type Bucket = LogisticsRegion & { cities: Map<string, number>; codCents: number };

function emptyRegion(id: string, name: string): Bucket {
  return {
    region_id: id,
    name,
    total_orders: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    in_transit: 0,
    delivery_rate: 0,
    cod_generated: 0,
    top_cities: [],
    cities: new Map(),
    codCents: 0,
  };
}

function resolveRegion(regionId: string | null, shippingCity: string | null, city: string | null) {
  const rid = (regionId || "").trim().toUpperCase();
  if (REGION_IDS.has(rid)) return rid;
  for (const candidate of [shippingCity, city]) {
    const mapped = regionIdForCity(candidate || "");
    if (mapped && REGION_IDS.has(mapped)) return mapped;
  }
  return "";
}

function finalize(bucket: Bucket): LogisticsRegion {
  const ranked = [...bucket.cities.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, TOP_CITIES_LIMIT)
    .map(([city, count]) => ({ city, count }));
  return {
    region_id: bucket.region_id,
    name: bucket.name,
    total_orders: bucket.total_orders,
    delivered: bucket.delivered,
    returned: bucket.returned,
    cancelled: bucket.cancelled,
    in_transit: bucket.in_transit,
    delivery_rate: trueDeliveryRate(bucket.delivered, bucket.returned, bucket.cancelled),
    cod_generated: Math.round(bucket.codCents) / 100,
    top_cities: ranked,
  };
}

export async function logisticsAnalytics(): Promise<LogisticsAnalytics> {
  await ensureSchema();
  const client = await getPool().connect();
  const deliveryFee = deliveryFeeFromEnv();
  const returnFee = returnFeeFromEnv();
  try {
    const result = await client.query<{
      status: string;
      total_cents: number;
      region_id: string | null;
      city: string | null;
      shipping_city: string | null;
    }>(`SELECT status, total_cents, region_id, city, shipping_city FROM orders`);

    const regions = new Map<string, Bucket>();
    for (const region of MOROCCO_REGIONS) {
      regions.set(region.id, emptyRegion(region.id, region.name));
    }
    const unmapped = emptyRegion("", "غير محددة");

    let deliveredCents = 0;
    let inTransitCents = 0;
    let deliveredCount = 0;
    let inTransitCount = 0;
    let returnedCount = 0;
    let cancelledCount = 0;

    for (const row of result.rows) {
      const status = displayStatus(row.status || "pending");
      const amount = Number(row.total_cents || 0);
      if (status === "delivered") {
        deliveredCount += 1;
        deliveredCents += amount;
      } else if (status === "shipped") {
        inTransitCount += 1;
        inTransitCents += amount;
      } else if (status === "returned") {
        returnedCount += 1;
      } else if (status === "cancelled") {
        cancelledCount += 1;
      }

      const rid = resolveRegion(row.region_id, row.shipping_city, row.city);
      const bucket = regions.get(rid) || unmapped;
      bucket.total_orders += 1;
      if (status === "delivered") {
        bucket.delivered += 1;
        bucket.codCents += amount;
      } else if (status === "returned") {
        bucket.returned += 1;
      } else if (status === "cancelled") {
        bucket.cancelled += 1;
      } else if (status === "shipped") {
        bucket.in_transit += 1;
      }
      const cityName = (row.shipping_city || row.city || "").trim();
      if (cityName) bucket.cities.set(cityName, (bucket.cities.get(cityName) || 0) + 1);
    }

    const deliveredAmount = Math.round(deliveredCents) / 100;
    const inTransitAmount = Math.round(inTransitCents) / 100;
    const shippingCosts = Math.round((deliveredCount * deliveryFee + returnedCount * returnFee) * 100) / 100;

    return {
      currency: "MAD",
      delivery_fee: deliveryFee,
      return_fee: returnFee,
      financial: {
        total_delivered_amount: deliveredAmount,
        in_transit_amount: inTransitAmount,
        delivered_count: deliveredCount,
        in_transit_count: inTransitCount,
        returned_count: returnedCount,
        cancelled_count: cancelledCount,
        estimated_shipping_costs: shippingCosts,
        net_cash_due: Math.round((deliveredAmount - shippingCosts) * 100) / 100,
      },
      delivery_rate: trueDeliveryRate(deliveredCount, returnedCount, cancelledCount),
      delivery_rate_denominator: deliveredCount + returnedCount + cancelledCount,
      regions: MOROCCO_REGIONS.map((r) => finalize(regions.get(r.id)!)),
      unmapped: finalize(unmapped),
    };
  } finally {
    client.release();
  }
}
