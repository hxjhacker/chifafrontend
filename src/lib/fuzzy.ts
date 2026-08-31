export function foldCity(value: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ءأإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/(.)\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }
  return prev[b.length];
}

export function similarity(a: string, b: string) {
  const left = foldCity(a);
  const right = foldCity(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const max = Math.max(left.length, right.length);
  return 1 - levenshtein(left, right) / max;
}

export function bestFuzzyMatch<T>(needle: string, candidates: T[], texts: (item: T) => string[], threshold = 0.6): T | null {
  const n = foldCity(needle);
  if (!n || n.length < 3) return null;
  let best: T | null = null;
  let score = threshold;
  for (const item of candidates) {
    for (const text of texts(item)) {
      const folded = foldCity(text);
      if (!folded) continue;
      let s = similarity(n, folded);
      if (folded.includes(n) || n.includes(folded)) s = Math.max(s, 0.86);
      if (s > score) {
        score = s;
        best = item;
      }
    }
  }
  return best;
}
