import { Pool } from "pg";

const DEFAULT_URL =
  "postgres://chifaglow:chifaglow@chifaglow_database:5432/chifaglow?sslmode=disable";

function connectionString() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  if (process.env.NODE_ENV !== "production") {
    return "postgres://chifaglow:chifaglow@127.0.0.1:5432/chifaglow?sslmode=disable";
  }
  return DEFAULT_URL;
}

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function getPool() {
  if (!pool) {
    const url = connectionString();
    pool = new Pool({
      connectionString: url,
      max: 5,
      ssl: /sslmode=require/i.test(url) ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY,
  slug varchar(64) NOT NULL UNIQUE,
  name_ar varchar(160) NOT NULL,
  name_en varchar(160) NOT NULL,
  tagline_ar varchar(240) NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  accent varchar(32) NOT NULL DEFAULT 'gold',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_products_slug ON products (slug);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY,
  full_name varchar(120) NOT NULL,
  phone varchar(20) NOT NULL,
  phone_national varchar(20) NOT NULL DEFAULT '',
  city varchar(80) NOT NULL,
  address text,
  quartier varchar(120),
  street varchar(160),
  building varchar(80),
  landmark varchar(160),
  delivery_window varchar(32),
  courier_notes text,
  region_id varchar(32),
  bundle_enabled boolean NOT NULL DEFAULT false,
  secondary_qty integer NOT NULL DEFAULT 1,
  product_slug varchar(64) NOT NULL,
  tier_qty integer NOT NULL,
  tier_price_cents integer NOT NULL,
  cross_sell_slug varchar(64),
  cross_sell_price_cents integer NOT NULL DEFAULT 0,
  upsell_slug varchar(64),
  upsell_price_cents integer NOT NULL DEFAULT 0,
  subtotal_cents integer NOT NULL,
  total_cents integer NOT NULL,
  currency varchar(8) NOT NULL DEFAULT 'MAD',
  status varchar(32) NOT NULL DEFAULT 'pending',
  payment_method varchar(16) NOT NULL DEFAULT 'COD',
  event_id varchar(80) NOT NULL UNIQUE,
  fbp varchar(255),
  fbc varchar(512),
  ttclid varchar(512),
  sccid varchar(512),
  client_ip varchar(64),
  user_agent text,
  landing_url text,
  source varchar(32) NOT NULL DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  meta_livraison_code varchar(80),
  meta_livraison_sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS ix_orders_phone ON orders (phone);
CREATE INDEX IF NOT EXISTS ix_orders_status ON orders (status);
CREATE UNIQUE INDEX IF NOT EXISTS ix_orders_event_id ON orders (event_id);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES orders(id),
  product_slug varchar(64) NOT NULL,
  role varchar(32) NOT NULL,
  quantity integer NOT NULL,
  unit_price_cents integer NOT NULL,
  line_total_cents integer NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_order_items_order_id ON order_items (order_id);

CREATE TABLE IF NOT EXISTS tracking_events (
  id uuid PRIMARY KEY,
  event_id varchar(80) NOT NULL,
  event_name varchar(64) NOT NULL,
  platform varchar(32) NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_tracking_events_event_id ON tracking_events (event_id);

CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY,
  kind varchar(32) NOT NULL,
  product_slug varchar(32),
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_page_views_created_at ON page_views (created_at);
CREATE INDEX IF NOT EXISTS ix_page_views_slug_created ON page_views (product_slug, created_at);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_push_subscriptions_endpoint ON push_subscriptions (endpoint);
`;

const SCHEMA_ALTERS = [
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS address text`,
  `ALTER TABLE orders ALTER COLUMN address TYPE text USING address::text`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS region_id varchar(32)`,
  `ALTER TABLE orders ALTER COLUMN region_id TYPE varchar(32)`,
  `ALTER TABLE orders ALTER COLUMN full_name TYPE varchar(160)`,
  `ALTER TABLE orders ALTER COLUMN city TYPE varchar(120)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS quartier varchar(120)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS street varchar(160)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS building varchar(80)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS landmark varchar(160)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_window varchar(32)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_notes text`,
  `ALTER TABLE orders ALTER COLUMN courier_notes TYPE text USING courier_notes::text`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS bundle_enabled boolean DEFAULT false`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS secondary_qty integer DEFAULT 1`,
  `ALTER TABLE orders ALTER COLUMN upsell_price_cents SET DEFAULT 0`,
  `ALTER TABLE orders ALTER COLUMN cross_sell_price_cents SET DEFAULT 0`,
  `ALTER TABLE orders ALTER COLUMN phone_national SET DEFAULT ''`,
  `ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'MAD'`,
  `ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'`,
  `ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'COD'`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS source varchar(32) DEFAULT 'website'`,
  `ALTER TABLE orders ALTER COLUMN source SET DEFAULT 'website'`,
  `ALTER TABLE orders ALTER COLUMN created_at SET DEFAULT now()`,
  `ALTER TABLE orders ALTER COLUMN updated_at SET DEFAULT now()`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_livraison_code varchar(80)`,
  `ALTER TABLE orders ADD COLUMN IF NOT EXISTS meta_livraison_sent_at timestamptz`,
  `CREATE TABLE IF NOT EXISTS page_views (
    id uuid PRIMARY KEY,
    kind varchar(32) NOT NULL,
    product_slug varchar(32),
    path text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS ix_page_views_created_at ON page_views (created_at)`,
  `CREATE INDEX IF NOT EXISTS ix_page_views_slug_created ON page_views (product_slug, created_at)`,
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id uuid PRIMARY KEY,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS ix_push_subscriptions_endpoint ON push_subscriptions (endpoint)`,
];

const PRODUCT_SEED = [
  {
    slug: "quran",
    name_ar: "USB القرآن الكريم",
    name_en: "Holy Quran USB",
    tagline_ar: "القرآن كامل بجودة عالية… يتسمع في الدار والسيارة.",
    description_ar: "مكتبة قرآنية فاخرة على USB جاهز للتشغيل.",
    accent: "gold",
  },
  {
    slug: "kids",
    name_ar: "USB تعليم الأطفال",
    name_en: "Children Learning USB",
    tagline_ar: "محتوى تربوي جاهز… ولادك يتعلمو وأنت مرتاح.",
    description_ar: "تجميعة تعليمية للأطفال بلا إعلانات وبلا نت.",
    accent: "emerald",
  },
  {
    slug: "music",
    name_ar: "USB الأغاني والموسيقى",
    name_en: "Music & Songs USB",
    tagline_ar: "موسيقى جاهزة، بلا نت وبلا تقطيعة.",
    description_ar: "مكتبة أغاني مرتبة للسيارة والمحل.",
    accent: "bronze",
  },
  {
    slug: "educative",
    name_ar: "الفلاشة التعليمية الذكية للأطفال",
    name_en: "Smart Educational USB for Kids",
    tagline_ar: "100% بدون إنترنت — رفيق التفوق المدرسي.",
    description_ar: "فلاشة تربوية جاهزة للتلفاز والحاسوب.",
    accent: "emerald",
  },
  {
    slug: "taalim",
    name_ar: "فلاشة Taalim Kids التعليمية",
    name_en: "Taalim Kids Educational USB",
    tagline_ar: "حوّل التلفاز إلى مدرسة ذكية لطفلك.",
    description_ar: "مكتبة تعليمية بدون إنترنت للتلفاز والحاسوب.",
    accent: "emerald",
  },
] as const;

const SCHEMA_ALTER_VERSION = 9;
let appliedAlterVersion = 0;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      const client = await getPool().connect();
      try {
        await client.query(SCHEMA_SQL);
        for (const product of PRODUCT_SEED) {
          await client.query(
            `INSERT INTO products (id, slug, name_ar, name_en, tagline_ar, description_ar, accent, is_active, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, now())
             ON CONFLICT (slug) DO UPDATE SET
               name_ar = EXCLUDED.name_ar,
               name_en = EXCLUDED.name_en,
               tagline_ar = EXCLUDED.tagline_ar,
               description_ar = EXCLUDED.description_ar,
               accent = EXCLUDED.accent,
               is_active = true`,
            [
              crypto.randomUUID(),
              product.slug,
              product.name_ar,
              product.name_en,
              product.tagline_ar,
              product.description_ar,
              product.accent,
            ],
          );
        }
      } finally {
        client.release();
      }
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  await schemaReady;
  await ensureOrderAlters();
}

export async function ensureOrderAlters() {
  const client = await getPool().connect();
  try {
    for (const sql of SCHEMA_ALTERS) {
      try {
        await client.query(sql);
      } catch (err) {
        console.error("schema_alter_skipped", sql, err);
      }
    }
    appliedAlterVersion = SCHEMA_ALTER_VERSION;
  } finally {
    client.release();
  }
}
