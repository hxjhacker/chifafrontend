const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  A: "wnnnnwnnw",
  B: "nnwnnwnnw",
  C: "wnwnnwnnn",
  D: "nnnnwwnnw",
  E: "wnnnwwnnn",
  F: "nnwnwwnnn",
  G: "nnnnnwwnw",
  H: "wnnnnwwnn",
  I: "nnwnnwwnn",
  J: "nnnnwwwnn",
  K: "wnnnnnnww",
  L: "nnwnnnnww",
  M: "wnwnnnnwn",
  N: "nnnnwnnww",
  O: "wnnnwnnwn",
  P: "nnwnwnnwn",
  Q: "nnnnnnwww",
  R: "wnnnnnwwn",
  S: "nnwnnnwwn",
  T: "nnnnwnwwn",
  U: "wwnnnnnnw",
  V: "nwwnnnnnw",
  W: "wwwnnnnnn",
  X: "nwnnwnnnw",
  Y: "wwnnwnnnn",
  Z: "nwwnwnnnn",
  "-": "nwnnnnwnw",
  ".": "wwnnnnwnn",
  " ": "nwwnnnwnn",
  "*": "nwnnwnwnn",
};

export function barcodeValue(orderId: string) {
  return `CFG${orderId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function encodeCode39(text: string) {
  const payload = `*${text.toUpperCase().replace(/[^0-9A-Z. \-$]/g, "")}*`;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  const narrow = 1;
  const wide = 3;
  for (const ch of payload) {
    const pattern = CODE39[ch];
    if (!pattern) continue;
    for (let i = 0; i < 9; i += 1) {
      const w = pattern[i] === "w" ? wide : narrow;
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    }
    x += narrow;
  }
  return { bars, width: Math.max(x, 1) };
}
