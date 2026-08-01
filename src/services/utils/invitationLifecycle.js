/**
 * Invitation lifecycle helpers (ORG-5)
 *
 * Pure, framework-free logic for the invitee-facing invitation UX. Kept free of
 * React Native imports so it can be unit-tested in plain node.
 *
 * Backend contract (see mb-cloud-services services/invitation-service):
 *   - An invite carries EITHER an org context, a team context, or BOTH (a combo
 *     invite that lands the invitee in an org and one of its teams at once).
 *   - Accept/decline are REVERSIBLE while the invite is OPEN (pending, accepted
 *     or declined). 'closed' is terminal (a permissioned party forcibly removed
 *     the invitee); 'expired' can no longer be acted on either.
 */

// Statuses on which the invitee can still change their response.
export const OPEN_STATUSES = ['pending', 'accepted', 'declined'];

// Terminal statuses — no further invitee action possible.
export const TERMINAL_STATUSES = ['closed', 'expired'];

/**
 * Was this invite past its expiry at the given moment?
 */
export function isExpired(invitation, now = new Date()) {
  if (!invitation || !invitation.expiresAt) return false;
  const expiry = new Date(invitation.expiresAt);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < now.getTime();
}

/**
 * Effective status for UI purposes. A still-'pending' invite whose expiry has
 * passed is surfaced as 'expired' (the backend rejects acting on it). An
 * already-accepted membership is left as 'accepted' even past the token expiry.
 */
export function effectiveStatus(invitation, now = new Date()) {
  const status = invitation && invitation.status ? invitation.status : 'pending';
  if (status === 'pending' && isExpired(invitation, now)) {
    return 'expired';
  }
  return status;
}

/**
 * Normalize a row from GET /api/invitations/pending into the unified shape the
 * screen renders. That endpoint returns rich org + team context, so combo
 * invites (both an org_name and a team_name) are detectable here.
 */
export function normalizePendingRow(row) {
  const orgName = row.org_name || null;
  const teamName = row.team_name || null;
  return {
    token: row.token,
    invitationId: row.invitation_id,
    status: row.status || 'pending',
    orgName,
    teamName,
    orgRole: row.org_role_name || null,
    teamRole: row.team_role_name || null,
    inviterName: row.inviter_name || null,
    isCombo: Boolean(orgName && teamName),
    expiresAt: row.expires_at || null,
  };
}

/**
 * Normalize a row from GET /api/invitations?email=... into the unified shape.
 * That endpoint collapses context into a single context_type/context_name, so
 * combo status is not recoverable from it (isCombo stays false).
 */
export function normalizeByEmailRow(row) {
  const isTeam = row.context_type === 'team';
  return {
    token: row.token,
    invitationId: row.id,
    status: row.status || 'pending',
    orgName: isTeam ? null : row.context_name || null,
    teamName: isTeam ? row.context_name || null : null,
    orgRole: isTeam ? null : row.role || null,
    teamRole: isTeam ? row.role || null : null,
    inviterName: row.inviter_name || null,
    isCombo: false,
    expiresAt: row.expires_at || null,
  };
}

/**
 * Merge normalized invitations from multiple sources, deduped by token. Earlier
 * sources win (pass the richer /pending source first so combo context is kept).
 */
export function mergeInvitations(...lists) {
  const byToken = new Map();
  lists.forEach((list) => {
    (list || []).forEach((inv) => {
      if (inv && inv.token && !byToken.has(inv.token)) {
        byToken.set(inv.token, inv);
      }
    });
  });
  return Array.from(byToken.values());
}

/**
 * Badge metadata for a status. `tone` maps to a semantic color in the screen.
 */
export function getStatusMeta(status) {
  switch (status) {
    case 'accepted':
      return { label: 'Accepted', tone: 'success' };
    case 'declined':
      return { label: 'Declined', tone: 'error' };
    case 'closed':
      return { label: 'Closed', tone: 'neutral' };
    case 'expired':
      return { label: 'Expired', tone: 'neutral' };
    case 'pending':
    default:
      return { label: 'Pending', tone: 'info' };
  }
}

/**
 * Which lifecycle actions the invitee can take, given the current status.
 * Because responses are reversible while open, an accepted invite still offers
 * 'decline' (change your mind) and a declined invite still offers 'accept'.
 */
export function getAvailableActions(status) {
  switch (status) {
    case 'pending':
      return ['accept', 'decline'];
    case 'accepted':
      return ['decline'];
    case 'declined':
      return ['accept'];
    case 'closed':
    case 'expired':
    default:
      return [];
  }
}

/**
 * Human-readable, context-aware label for an action button. When the invite has
 * already been responded to, the label frames the action as a change of mind.
 */
export function getActionLabel(action, status) {
  if (action === 'accept') {
    return status === 'declined' ? 'Accept instead' : 'Accept';
  }
  if (action === 'decline') {
    return status === 'accepted' ? 'Decline instead' : 'Decline';
  }
  return action;
}

/**
 * One-line summary of what the invite grants, used in the card body.
 */
export function describeContext(invitation) {
  const parts = [];
  if (invitation.orgName) {
    parts.push(invitation.orgRole ? `${invitation.orgName} (${invitation.orgRole})` : invitation.orgName);
  }
  if (invitation.teamName) {
    parts.push(invitation.teamRole ? `${invitation.teamName} (${invitation.teamRole})` : invitation.teamName);
  }
  return parts;
}
