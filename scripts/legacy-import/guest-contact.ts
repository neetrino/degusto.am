import { FALLBACK_LAST_NAME, UNKNOWN_PHONE } from "./constants";
import {
  displayName,
  firstNameOf,
  guestEmail,
  lastNameOf,
  normalizeEmail,
} from "./mappers";

export type GuestContactFields = {
  contactEmail: string;
  contactName: string;
  firstName: string;
  lastName: string;
};

export type MatchedContactUser = {
  firstName: string;
  lastName: string;
  email: string;
};

/** Digits-only AM-aware phone normalization (`374…` when possible). */
export function normalizePhoneDigits(
  value: string | null | undefined,
): string {
  const digits = (value ?? "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  if (digits.startsWith("374") && digits.length >= 11) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length >= 9) {
    return `374${digits.slice(1)}`;
  }
  if (digits.length === 8) {
    return `374${digits}`;
  }
  return digits;
}

/** Stable match key: last 8 digits (AM mobiles). */
export function phoneMatchKey(value: string | null | undefined): string {
  const digits = normalizePhoneDigits(value);
  if (digits.length < 8) {
    return digits;
  }
  return digits.slice(-8);
}

/**
 * Guest order contact snapshot from whatever the legacy dump actually had.
 * Never invents the label "Guest" — prefers a matched user, else phone.
 */
export function guestContactFromAvailable(input: {
  oldId: number;
  phone: string | null;
  matched?: MatchedContactUser | null;
}): GuestContactFields {
  if (input.matched?.email.trim()) {
    return {
      contactEmail: normalizeEmail(input.matched.email),
      contactName: displayName(input.matched.firstName, input.matched.lastName),
      firstName: firstNameOf(input.matched.firstName),
      lastName: lastNameOf(input.matched.lastName),
    };
  }

  const phone = input.phone?.trim() ?? "";
  const label =
    phone.length > 0 && phone !== UNKNOWN_PHONE
      ? phone
      : `Order ${input.oldId}`;

  return {
    contactEmail: guestEmail(input.oldId),
    contactName: label,
    firstName: label,
    lastName: FALLBACK_LAST_NAME,
  };
}
