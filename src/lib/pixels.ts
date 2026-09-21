/** Public Meta Pixel / Dataset ID. Env wins at build time; fallback so Easypanel rebuilds still ship the snippet. */
export const PIXELS_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PIXELS !== "false";

export const FB_PIXEL_ID = PIXELS_ENABLED
  ? process.env.NEXT_PUBLIC_FB_PIXEL_ID ||
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ||
    "1380665090820653"
  : "";

export const TIKTOK_PIXEL_ID = PIXELS_ENABLED
  ? process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || ""
  : "";

export const SNAPCHAT_PIXEL_ID = PIXELS_ENABLED
  ? process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID || ""
  : "";
