FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ARG NEXT_PUBLIC_SITE_URL=https://chifaglow.com
ARG NEXT_PUBLIC_API_URL=https://api.chifaglow.com
ARG NEXT_PUBLIC_FB_PIXEL_ID
ARG NEXT_PUBLIC_TIKTOK_PIXEL_ID
ARG NEXT_PUBLIC_SNAPCHAT_PIXEL_ID
ARG NEXT_PUBLIC_ENABLE_PIXELS=true
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS=--max-old-space-size=768 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_FB_PIXEL_ID=$NEXT_PUBLIC_FB_PIXEL_ID \
    NEXT_PUBLIC_TIKTOK_PIXEL_ID=$NEXT_PUBLIC_TIKTOK_PIXEL_ID \
    NEXT_PUBLIC_SNAPCHAT_PIXEL_ID=$NEXT_PUBLIC_SNAPCHAT_PIXEL_ID \
    NEXT_PUBLIC_ENABLE_PIXELS=$NEXT_PUBLIC_ENABLE_PIXELS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=postgres://chifaglow:chifaglow@chifaglow_database:5432/chifaglow?sslmode=disable
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
EXPOSE 3000
CMD ["sh", "-c", "echo \"[chifaglow-web] starting on 0.0.0.0:${PORT:-3000}\"; export HOSTNAME=0.0.0.0; exec npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
