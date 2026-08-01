/**
 * Personal-org team-limit helpers (ORG-6)
 *
 * Pure, dependency-free helpers for the personal-organization team cap.
 * The backend (mb-cloud-services) caps personal orgs at a fixed number of
 * teams and, once exceeded, `POST /api/organizations/:orgId/teams` responds
 * HTTP 403 with:
 *   { status: "error", code: "PERSONAL_ORG_TEAM_LIMIT", limit: 3, message }
 * Enterprise orgs are uncapped.
 */

// Client-side default. The backend's `limit` field is the source of truth and
// wins whenever it is present; this is only used for proactive UX (showing
// "x of N teams") and as a fallback when no server value is available.
export const PERSONAL_ORG_TEAM_LIMIT = 3;

export const PERSONAL_ORG_TEAM_LIMIT_CODE = 'PERSONAL_ORG_TEAM_LIMIT';

/**
 * True when an error is the personal-org team-limit 403. Works for both a raw
 * axios error (code lives at `error.response.data.code`) and an error already
 * normalized by teamApi (code lives at `error.code`).
 * @param {any} error
 * @returns {boolean}
 */
export function isPersonalOrgTeamLimitError(error) {
  if (!error) return false;
  return (
    error.code === PERSONAL_ORG_TEAM_LIMIT_CODE ||
    error?.response?.data?.code === PERSONAL_ORG_TEAM_LIMIT_CODE
  );
}

/**
 * The team limit reported by the backend, falling back to the client default.
 * @param {any} error
 * @returns {number}
 */
export function getReportedTeamLimit(error) {
  return error?.limit ?? error?.response?.data?.limit ?? PERSONAL_ORG_TEAM_LIMIT;
}

/**
 * Whether a (non-enterprise) org is treated as a personal org. Mirrors how the
 * rest of the app derives tenancy: enterprise is the only uncapped type.
 * @param {object} org
 * @returns {boolean}
 */
export function isPersonalOrg(org) {
  if (!org) return false;
  if (org.is_personal === true) return true;
  return org.tenancy_type !== 'enterprise';
}

/**
 * Friendly alert copy (title + message) for the personal-org team cap,
 * including the upgrade path and the delete-a-team alternative.
 * @param {number} limit
 * @returns {{ title: string, message: string }}
 */
export function buildTeamLimitAlert(limit = PERSONAL_ORG_TEAM_LIMIT) {
  return {
    title: 'Team limit reached',
    message:
      `Personal organizations are limited to ${limit} teams.\n\n` +
      'To add another team, delete one you no longer need, or ask a system ' +
      'admin to move you into an enterprise organization — enterprise orgs ' +
      'have no team limit.',
  };
}
