const ARMENIA_COUNTRY_CODE = "374";
const PHONE_PATTERN = /\(?\d{2,3}\)?[\s.-]*\d{2}[\s.-]*\d{2}[\s.-]*\d{2}/g;

export type PhoneLinePart =
  | { kind: "text"; value: string }
  | { kind: "tel"; display: string; href: string };

/** Builds an E.164 `tel:` href from a displayed Armenian phone number. */
export function toTelHref(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length === 0) {
    return "tel:";
  }
  const withoutTrunk = digits.startsWith("0") ? digits.slice(1) : digits;
  const e164 = withoutTrunk.startsWith(ARMENIA_COUNTRY_CODE)
    ? withoutTrunk
    : `${ARMENIA_COUNTRY_CODE}${withoutTrunk}`;
  return `tel:+${e164}`;
}

/** Splits a contact line so each phone number can be rendered as a `tel:` link. */
export function splitPhoneLine(line: string): PhoneLinePart[] {
  const parts: PhoneLinePart[] = [];
  const pattern = new RegExp(PHONE_PATTERN.source, "g");
  let cursor = 0;

  for (const match of line.matchAll(pattern)) {
    const display = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      parts.push({ kind: "text", value: line.slice(cursor, index) });
    }
    parts.push({ kind: "tel", display, href: toTelHref(display) });
    cursor = index + display.length;
  }

  if (cursor < line.length) {
    parts.push({ kind: "text", value: line.slice(cursor) });
  }

  return parts.length > 0 ? parts : [{ kind: "text", value: line }];
}
