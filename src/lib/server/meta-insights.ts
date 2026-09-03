const EMPTY = {
  spend: 0,
  clicks: 0,
  impressions: 0,
  cpc: 0,
  cpm: 0,
  ctr: 0,
};

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

export async function fetchMetaInsights() {
  const accountId = (process.env.META_AD_ACCOUNT_ID || "").trim();
  const token = (process.env.META_ACCESS_TOKEN || "").trim();
  if (!accountId || !token) {
    return { body: { ...EMPTY, detail: "meta_not_configured" as const }, status: 503 };
  }

  const url = new URL(`https://graph.facebook.com/v26.0/${accountId}/insights`);
  url.searchParams.set("fields", "spend,impressions,clicks,cpc,cpm,ctr");
  url.searchParams.set("date_preset", "today");
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { cache: "no-store" });
  const data = (await res.json()) as {
    data?: Array<Record<string, unknown>>;
    error?: { message?: string };
  };
  console.log("Meta API Response:", data);

  if (!res.ok) {
    console.error("meta_insights_failed", data.error?.message || res.status);
    return { body: { ...EMPTY, detail: "meta_insights_failed" as const }, status: 502 };
  }

  const row = data.data?.[0];
  if (!row) {
    return { body: EMPTY, status: 200 };
  }

  return {
    body: {
      spend: num(row.spend),
      clicks: Math.round(num(row.clicks)),
      impressions: Math.round(num(row.impressions)),
      cpc: num(row.cpc),
      cpm: num(row.cpm),
      ctr: num(row.ctr),
    },
    status: 200,
  };
}
