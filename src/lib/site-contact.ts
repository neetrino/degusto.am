/**
 * Canonical public contact channels for Degusto (single source of truth for UI mailto/tel).
 */

export const SITE_CONTACT_EMAIL = 'info@degusto.am';

export type SiteContactPhone = {
  /** E.164 value for `tel:` links (no spaces). */
  readonly tel: string;
  /** Human-readable display (matches published Armenian numbering style). */
  readonly display: string;
};

export const SITE_CONTACT_PHONES: readonly SiteContactPhone[] = [
  { tel: '+37460388080', display: '(060) 38-80-80' },
  { tel: '+37433808080', display: '(033) 80-80-80' },
  { tel: '+37410388080', display: '(010) 38-80-80' },
];
