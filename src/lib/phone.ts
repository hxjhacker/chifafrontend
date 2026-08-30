const E164 = /^\+212[567]\d{8}$/;

export function digitsOnly(raw: string) {
  return (raw || "").replace(/\D/g, "");
}

export function normalizeMaPhone(raw: string): string | null {
  let digits = digitsOnly(raw);
  if (digits.startsWith("00212")) digits = digits.slice(2);
  let e164 = "";
  if (digits.startsWith("212") && digits.length === 12 && "567".includes(digits[3])) {
    e164 = `+${digits}`;
  } else if (digits.length === 10 && digits[0] === "0" && "567".includes(digits[1])) {
    e164 = `+212${digits.slice(1)}`;
  } else if (digits.length === 9 && "567".includes(digits[0])) {
    e164 = `+212${digits}`;
  } else {
    return null;
  }
  return E164.test(e164) ? e164 : null;
}

export function isValidMaPhone(raw: string) {
  return Boolean(normalizeMaPhone(raw));
}

/** Local Moroccan mobile/landline: exactly 10 digits, starting with 05 / 06 / 07. */
export function isTenDigitMaPhone(raw: string) {
  const digits = digitsOnly(raw);
  if (digits.length !== 10) return false;
  if (digits[0] !== "0" || !"567".includes(digits[1])) return false;
  return Boolean(normalizeMaPhone(digits));
}

/** Display like +212 612-345678 */
export function formatMaPhoneDisplay(raw: string) {
  const e164 = normalizeMaPhone(raw);
  if (!e164) return raw || "";
  const national = e164.slice(4);
  return `+212 ${national.slice(0, 3)}-${national.slice(3)}`;
}
