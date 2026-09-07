export type LogisticsCity = { city: string; count: number };

export type LogisticsRegion = {
  region_id: string;
  name: string;
  total_orders: number;
  delivered: number;
  returned: number;
  cancelled: number;
  in_transit: number;
  delivery_rate: number;
  cod_generated: number;
  top_cities: LogisticsCity[];
};

export type LogisticsAnalytics = {
  currency: string;
  delivery_fee: number;
  return_fee: number;
  financial: {
    total_delivered_amount: number;
    in_transit_amount: number;
    delivered_count: number;
    in_transit_count: number;
    returned_count: number;
    cancelled_count: number;
    estimated_shipping_costs: number;
    net_cash_due: number;
  };
  delivery_rate: number;
  delivery_rate_denominator: number;
  regions: LogisticsRegion[];
  unmapped: LogisticsRegion;
};

export const EMPTY_LOGISTICS: LogisticsAnalytics = {
  currency: "MAD",
  delivery_fee: 30,
  return_fee: 15,
  financial: {
    total_delivered_amount: 0,
    in_transit_amount: 0,
    delivered_count: 0,
    in_transit_count: 0,
    returned_count: 0,
    cancelled_count: 0,
    estimated_shipping_costs: 0,
    net_cash_due: 0,
  },
  delivery_rate: 0,
  delivery_rate_denominator: 0,
  regions: [],
  unmapped: {
    region_id: "",
    name: "غير محددة",
    total_orders: 0,
    delivered: 0,
    returned: 0,
    cancelled: 0,
    in_transit: 0,
    delivery_rate: 0,
    cod_generated: 0,
    top_cities: [],
  },
};

export const RATE_GREEN = "#10B981";
export const RATE_AMBER = "#F59E0B";
export const RATE_ROSE = "#E11D48";
export const RATE_GRAY = "#94A3B8";

export function deliveryFeeFromEnv() {
  const n = Number(process.env.META_LIVRAISON_DELIVERY_FEE);
  return Number.isFinite(n) && n >= 0 ? n : 30;
}

export function returnFeeFromEnv() {
  const n = Number(process.env.META_LIVRAISON_RETURN_FEE);
  return Number.isFinite(n) && n >= 0 ? n : 15;
}

export function trueDeliveryRate(delivered: number, returned: number, cancelled: number) {
  const closed = delivered + returned + cancelled;
  if (!closed) return 0;
  return Math.round((delivered / closed) * 1000) / 10;
}

export function regionRateFill(region: Pick<LogisticsRegion, "total_orders" | "delivery_rate" | "delivered" | "returned" | "cancelled">) {
  if (!region.total_orders) return RATE_GRAY;
  const closed = region.delivered + region.returned + region.cancelled;
  if (!closed) return RATE_GRAY;
  if (region.delivery_rate >= 75) return RATE_GREEN;
  if (region.delivery_rate >= 55) return RATE_AMBER;
  return RATE_ROSE;
}
