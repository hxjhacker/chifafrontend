export const VIEW_PRODUCTS = ["quran", "kids", "music"] as const;
export type ViewProductSlug = (typeof VIEW_PRODUCTS)[number];
export type ViewRange = "today" | "week" | "month" | "custom";

export type ViewsObservatoryPayload = {
  range: ViewRange;
  from: string;
  to: string;
  totals: {
    all: number;
    store: number;
    quran: number;
    kids: number;
    music: number;
  };
  trend_pct: number | null;
  series: {
    labels: string[];
    quran: number[];
    kids: number[];
    music: number[];
  };
};
