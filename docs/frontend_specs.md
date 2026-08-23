# Frontend Specs — Next.js Storefront

Stack: **Next.js 15 App Router**, React 19, Tailwind CSS 3, Lucide icons, Framer Motion.  
`html` is `lang="ar"` `dir="rtl"`. Mobile-first. Designed for TikTok / Instagram / Facebook in-app browsers.

---

## 1. Design tokens

```ts
colors: {
  royal: { DEFAULT: "#0B1F3A", 800: "#122C52", 700: "#1A3D6E" },
  emerald: { DEFAULT: "#0F6B4C", 600: "#14805C" },
  gold: { DEFAULT: "#C9A227", 400: "#D4AF37", 300: "#E8D5A3" },
  bronze: { DEFAULT: "#B87333" },
  cream: { DEFAULT: "#FFFBFA" },
}
```

Fonts (`next/font`): **Cairo** (UI Arabic + Latin) and **Cinzel** (logo “Chifaglow”).

---

## 2. Routes

| Path | Purpose |
|---|---|
| `/` | Brand home, 3 USB cards, alternating story sections, social proof |
| `/products/quran` | Holy Quran USB landing |
| `/products/kids` | Children educational USB landing |
| `/products/music` | Music USB landing |
| `/thank-you?order={uuid}` | Confirmation |

Placeholder product art: SVG files in `frontend/public/images/` (`usb-quran.svg`, `usb-kids.svg`, `usb-music.svg`, `hero-still.svg`).

---

## 3. Component map

### Layout

- `TopBar` — التوصيل مجاني + الدفع عند الاستلام لجميع مدن المغرب
- `Header`
  - **Start (visual right in RTL):** gold-ring circle with letter **C**
  - Wordmark `Chifaglow` + `شيفا جلو`
  - Desktop nav: الرئيسية، القرآن، تعليم الأطفال، الموسيقى
  - **End:** cart icon (Lucide `ShoppingBag`) + item count badge
- `Footer` — COD, 24–48h, domain, no card logos

### Product

- `ScarcityBanner` — limited stock + free shipping
- `PricingSelector` — three gold-outlined cards: 1@199, 2@279 (default, “الأكثر طلباً”), 3@349 (“أفضل قيمة”)
- `TrustBadges` — COD, truck, clock, shield
- `Reviews` — 4.9 stars + Darija quotes with city
- `StickyCta` — mobile-only fixed bar, same CTA as hero
- `FeatureRow` — `imageOnStart` boolean to alternate Image/Text vs Text/Image on desktop

### Cart drawer (`CartDrawer.tsx`)

- Framer Motion `x` slide from the **inline-start** (right in RTL)
- Overlay `bg-royal/50`
- Line: product + tier qty + tier price
- Savings line when qty > 1: `وفرّتي X درهم على الثمن الفردي`
- **Cross-sell card:** next catalog product at **199 DH**, toggle add/remove
- CTA: `إتمام الطلب — الدفع عند الاستلام` → opens checkout popup + `InitiateCheckout`

### Checkout popup (`CheckoutPopup.tsx`)

Modal, one page, three fields only:

1. `الاسم الكامل` — min 3 chars
2. `رقم الهاتف` — see phone rules below
3. `المدينة` — `CitySelect` searchable dropdown (Arabic + French + aliases)

Submit → `POST {API}/api/orders` with `event_id`, cookies `fbp`/`fbc`, query `ttclid`/`sccid`, `landing_url`.  
On 201: close checkout, open `UpsellPopup`.

### City dropdown

- All major Moroccan cities from `src/lib/cities.ts` (same list as backend)
- Filter as-you-type on `ar`, `fr`, `aliases`
- Keyboard: arrow + enter
- Must pick from the list (no free-text) so Sheets stay clean

### Upsell popup

- 12 second countdown (`10–15s` spec; 12s mid-range)
- Copy: **أضف USB إضافي فقط بـ 99 DH**
- Product = first catalog item that is not primary and not cross-sell
- Accept → `POST /api/orders/{id}/upsell` then `/thank-you`
- Skip / timeout → `/thank-you` without extra charge

### Pixels (`PixelLoader.tsx`)

- `next/script` is **not** in the document head for fbevents.js
- Hydration: `requestIdleCallback` or `setTimeout(2500)` — first of the two
- Then inject fbq / ttq / snaptr
- Replay queued events from `lib/tracking.ts`
- Full script contract: `docs/tracking_capi.md`

---

## 4. Cart state

`CartProvider` (React context):

```ts
type CartState = {
  productSlug: string | null;
  tierQty: 1 | 2 | 3;
  crossSellSlug: string | null;
  drawerOpen: boolean;
  checkoutOpen: boolean;
  upsellOpen: boolean;
  orderId: string | null;
  eventId: string | null;
};
```

CTA on a product page: set product + tier, `drawerOpen: true`, fire `AddToCart` with a fresh `event_id`.

---

## 5. Moroccan phone validation (client, mirrored on API)

Accept after stripping spaces / dashes / dots:

| Input | Normalized E.164 |
|---|---|
| `06XXXXXXXX` / `07…` / `05…` | `+2126…` / `+2127…` / `+2125…` |
| `+2126XXXXXXXX` | unchanged |
| `002126XXXXXXXX` | `+2126…` |
| `6XXXXXXXX` (9 digits) | `+2126…` |

Reject landline-looking values that are not 05/06/07. Error copy:  
`دخل رقم مغربي صحيح يبدا بـ 05 أو 06 أو 07 أو +212`

---

## 6. API client (`lib/api.ts`)

`NEXT_PUBLIC_API_URL` default `https://api.chifaglow.com`.

| Call | Body highlights |
|---|---|
| `GET /api/products` | catalog (fallback: local `lib/products.ts`) |
| `GET /api/cities` | city list |
| `POST /api/orders` | name, phone, city, slugs, tier, event_id, click ids |
| `POST /api/orders/:id/upsell` | `{ product_slug, event_id }` |
| `POST /api/tracking/events` | CAPI for AddToCart / InitiateCheckout / ViewContent |
| `GET /api/orders/:id` | thank-you summary |

---

## 7. Motion rules (keep PageSpeed)

- Drawer / modal: 280ms `easeOut`, `opacity` + `x` or `scale`
- No layout animations on LCP hero image
- `next/image` not required for SVG placeholders; use `<img>` or inline SVG with width/height to avoid CLS
- Sticky CTA `transform` only

---

## 8. Accessibility (RTL)

- Dialogs: `role="dialog"` `aria-modal` focus trap light (close on overlay + Escape)
- Cart count: `aria-label="السلة، N منتجات"`
- City listbox: `role="listbox"` / `option`

---

## 9. Environment

See `frontend/.env.example`. Pixel IDs empty = loader no-ops (local/dev still converts).
