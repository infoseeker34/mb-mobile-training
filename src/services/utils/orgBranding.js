/**
 * Enterprise org branding helpers (ORG-3a)
 *
 * Pure, dependency-free helpers for consuming the ORG-3a backend branding
 * contract. Enterprise orgs (`tenancyType === 'enterprise'` / `is_personal ===
 * false`) may carry a `branding` object:
 *   { logoUrl, primaryColor, accentColor, displayName, tagline }
 * All fields are optional. Colors are hex strings (`#1a2b3c`), `logoUrl` is an
 * http(s) URL. Personal orgs carry no branding.
 *
 * These helpers are display-only: they never mutate the app-wide theme
 * (`constants/Colors.js`) — callers apply the returned values to an individual
 * org's own card/section, degrading gracefully when a field is missing or
 * malformed.
 */

// Exactly `#` followed by 3 or 6 hex digits.
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * True when `value` is a valid hex color string (`#abc` or `#a1b2c3`).
 * @param {any} value
 * @returns {boolean}
 */
export function isValidHexColor(value) {
  return typeof value === 'string' && HEX_COLOR_RE.test(value.trim());
}

/**
 * True when `value` looks like an http(s) URL suitable for an <Image> source.
 * @param {any} value
 * @returns {boolean}
 */
export function isValidLogoUrl(value) {
  return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim());
}

/**
 * Whether an org is treated as enterprise (the only tenancy that carries
 * branding). Works across both payload shapes the app sees: the snake_case
 * `/api/organizations` list (`is_personal` / `tenancy_type`) and the camelCase
 * `/api/users/me/organizations` shape (`isPersonal` / `tenancyType`). Mirrors
 * `isPersonalOrg` in teamLimit.js: anything not clearly enterprise is personal.
 * @param {object} org
 * @returns {boolean}
 */
export function isEnterpriseOrg(org) {
  if (!org) return false;
  if (org.is_personal === false || org.isPersonal === false) return true;
  const type = org.tenancy_type || org.tenancyType;
  return type === 'enterprise';
}

/**
 * Normalize a raw branding object, keeping only well-formed fields. Returns
 * `null` when the input is absent, not an object, or has no usable field — so
 * callers can treat a falsy result as "no branding, render as default".
 * @param {any} branding
 * @returns {{ logoUrl?: string, primaryColor?: string, accentColor?: string,
 *            displayName?: string, tagline?: string } | null}
 */
export function normalizeBranding(branding) {
  if (!branding || typeof branding !== 'object') return null;

  const result = {};
  if (isValidLogoUrl(branding.logoUrl)) result.logoUrl = branding.logoUrl.trim();
  if (isValidHexColor(branding.primaryColor)) result.primaryColor = branding.primaryColor.trim();
  if (isValidHexColor(branding.accentColor)) result.accentColor = branding.accentColor.trim();
  if (typeof branding.displayName === 'string' && branding.displayName.trim()) {
    result.displayName = branding.displayName.trim();
  }
  if (typeof branding.tagline === 'string' && branding.tagline.trim()) {
    result.tagline = branding.tagline.trim();
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * The normalized branding to display for an org, or `null` when none should be
 * shown. Combines both guards required by ORG-3a: branding is only applied to
 * enterprise orgs with a non-empty, well-formed `branding` object. Personal
 * orgs (and enterprise orgs without branding) yield `null`.
 * @param {object} org
 * @returns {ReturnType<typeof normalizeBranding>}
 */
export function getOrgBranding(org) {
  if (!isEnterpriseOrg(org)) return null;
  return normalizeBranding(org && org.branding);
}
