# Chifaglow Storefront

Next.js 15 App Router storefront for **Chifaglow / شيفا جلو** — Moroccan COD USB shop (`html lang="ar"` `dir="rtl"`).

- Site: `https://chifaglow.com`
- API: `https://api.chifaglow.com`

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

App: http://localhost:3000

## Docker

```bash
docker build -t chifaglow-web \
  --build-arg NEXT_PUBLIC_SITE_URL=https://chifaglow.com \
  --build-arg NEXT_PUBLIC_API_URL=https://api.chifaglow.com \
  -t chifaglow-web .
docker run -p 3000:3000 chifaglow-web
```

`NEXT_PUBLIC_*` values are baked in at build time. See `.env.example`.

## Docs

- `docs/frontend_specs.md` — routes, components, cart/checkout
- `docs/positioning_cro.md` — Moroccan CRO copy system
- `docs/architecture.md` — system map
- `docs/tracking_capi.md` — pixels + CAPI `event_id`
