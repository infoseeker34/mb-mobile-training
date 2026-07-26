# mb-mobile-training — Roadmap

Future / not-yet-built work, extracted from the retired `IMPLEMENTATION_PLAN.md` and the
feature flags in `src/constants/Config.js`, then **verified against current code** so
that anything already implemented is documented in `docs/WIKI.md` instead of repeated
here. Where the old plan's checklist claimed something was done (✅) but the current code
doesn't show it, it's listed here as still-open, not assumed complete.

Grouped by theme; priority/status noted per item where the source material indicated it.

---

## Theme: Notifications & Engagement

### Push notifications
- **Rationale:** `FEATURES.pushNotifications` exists in `Config.js` marked "Enable in
  Phase 5" — currently `false` and unwired. No `expo-notifications` push-token
  registration, permission request, or receive-handler exists in `src/` (the
  `expo-notifications` package is installed per `package.json` but not imported anywhere
  in `src/` — verified via search). In-app notifications exist server-side
  (`notificationApi.js` — list/unread-count/mark-read/delete) but there's no native push
  delivery.
- **Acceptance criteria:**
  - App requests notification permission at an appropriate point (not app launch) and
    registers an Expo push token with the backend.
  - Backend-triggered events (new message, assignment nudge, invitation, team milestone)
    arrive as native push notifications when the app is backgrounded/closed.
  - Tapping a notification deep-links to the relevant screen (assignment, thread, etc.).
  - `FEATURES.pushNotifications` flips to `true` only once the above is wired end-to-end.
- **Priority:** Explicitly deferred to "Phase 5" in the original plan; status: not started.

### Analytics
- **Rationale:** `FEATURES.analytics` flag exists, `false`, "Enable in Phase 5". No
  analytics SDK is installed or referenced anywhere in `src/`.
- **Acceptance criteria:**
  - An analytics SDK (e.g. the `@sentry/react-native`-adjacent tooling mentioned in the
    old plan, or a product-analytics tool — needs a product decision) is integrated.
  - Key funnel events instrumented: sign-up started/completed, first training session
    started/completed, invitation accepted, athlete added.
  - Flag flips to `true` once wired.
- **Priority:** Deferred to "Phase 5"; status: not started.

### Deep linking (beyond auth callback)
- **Rationale:** `FEATURES.deepLinking` flag exists, `false`, "Enable in Phase 5". Today
  the `mbtraining://` scheme (`app.json`) is used **only** for the OAuth callback
  (`mbtraining://auth`) — there is no general-purpose deep-link routing (e.g. a shared
  invitation link opening `InvitationsScreen` directly, or a message link opening
  `ThreadDetailScreen`). The old `IMPLEMENTATION_PLAN.md` Phase 5 called out "deep linking
  for invitations" specifically.
  - Note: `InviteDetailModal.js` and `invitationApi.getInvitationByToken(token)` already
    exist and work from in-app navigation — the gap is specifically *external* links
    (email, SMS, shared URL) opening the app directly to that content.
- **Acceptance criteria:**
  - A shared invitation link (e.g. `mbtraining://invite/<token>` or a universal link)
    opens the app directly to `InvitationsScreen`/`InviteDetailModal` pre-loaded with that
    invitation, working from both a cold start and a backgrounded app.
  - Deep links for at least one additional target (e.g. a specific message thread) are
    documented and tested.
  - `FEATURES.deepLinking` flips to `true` once wired.
- **Priority:** Deferred to "Phase 5"; status: not started. **Coordinate with backend/
  Cognito owners** — any new custom scheme path or universal-link domain needs allowlisting
  wherever `mbtraining://auth` is currently registered (see WIKI §5, §8).

### Offline mode — confirm scope, don't assume complete
- **Rationale:** `FEATURES.offlineMode` is the one flag currently `true`. `CacheStorage.js`
  (AsyncStorage-backed, 5-minute TTL, `getWithFallback` pattern) exists and is a real,
  usable utility — but a grep of `src/screens` and `src/services` shows **no screen
  currently calls `CacheStorage`** (not imported anywhere outside its own file and
  `Config.js`'s `cacheExpiryMinutes` reference). So the flag being `true` does not
  currently mean any screen has offline fallback behavior; the old plan's Phase 5 caching
  strategy (cache profile, plans library, progress, achievements, active session) was
  designed but not applied to the current screen set.
- **Acceptance criteria:**
  - At minimum, `HomeScreen`, `TrainingScreen` (plan library), and `ActiveTrainingScreen`
    use `CacheStorage.getWithFallback` so a network drop shows last-known data instead of
    an empty/error state.
  - An active training session (`ActiveTrainingScreen`) survives an app backgrounding/
    network loss without losing task-completion progress, syncing once connectivity
    returns.
  - A visible (even minimal) "offline" indicator when cached data is being shown instead
    of fresh data.
- **Priority:** Flag is already on; treat as a real, partially-open gap rather than a
  finished feature. Not date-boxed in the source material.

---

## Theme: Testing & Quality

### Establish a test suite
- **Rationale:** No test framework, config, or test files exist in `src/` (verified — see
  WIKI §9). The old `IMPLEMENTATION_PLAN.md` Phase 6 ("Testing & Launch Prep") called for
  unit tests for utilities/services, integration tests for API calls, and a `__tests__/`
  directory structure — none of this exists today.
- **Acceptance criteria:**
  - A test runner (Jest is the natural fit for Expo/RN) is added to `package.json` with a
    working `npm test` script.
  - Unit tests cover the auth-critical, easy-to-regress logic first:
    `deriveUsername()` and `describeCognitoError()` in `cognitoAuth.js`, JWT decode/expiry
    logic in `tokenManager.js`, the onboarding-gating booleans in `AppNavigator.js`
    (`needsAccountType`/`needsConsent`/`needsProfile`/`needsAthletes`).
  - At least smoke-level integration coverage for the sign-up → verify → sign-in flow
    against a test Cognito setup or mocks.
- **Priority:** Was "Phase 6" (last) in the original plan; recommend pulling forward given
  how auth-flow-critical the derived-username logic is (a regression here silently breaks
  all new sign-ups). Status: not started.

### Crash reporting
- **Rationale:** Old plan's Phase 6 mentioned Sentry (`@sentry/react-native` in its
  "Optional (Phase 5+)" dependency list). Not installed in current `package.json`.
- **Acceptance criteria:** Crash reporting SDK integrated, verified to capture a test
  crash from both a native build and (if supported) the web build.
- **Priority:** Optional per original plan; status: not started.

---

## Theme: Gamification depth

The current app has *some* gamification already live (verified in code, so **not**
listed here as open work): level/streak display on `HomeScreen`, `progressApi`
(progress/streak/streak-stats), team milestone feed with celebrate action
(`teamActivityApi.celebrateActivity`). What follows is what the old plan described that
isn't yet visible in the current screen set:

### Achievements screen
- **Rationale:** Old plan's Phase 3 (`AchievementsScreen.js`, unlocked/locked/all tabs,
  secret achievements) — no `AchievementsScreen.js` file exists in `src/screens/`, no
  achievements-specific API client exists (only `progressApi` for level/streak). Treat as
  not built.
- **Acceptance criteria:**
  - A screen lists unlocked and locked achievements with icon, name, description, XP
    reward, and unlock date where applicable.
  - Secret/hidden achievements only reveal name/description after unlock.
  - Reachable from `HomeScreen` or `ProfileScreen`.
- **Priority:** Not date-boxed beyond original "Phase 3"; status: not started.

### Weekly goal tracking
- **Rationale:** Old plan's Phase 3 (`WeeklyGoalScreen.js`, target-days selector, day-by-
  day breakdown). No corresponding screen or API client exists today.
- **Acceptance criteria:**
  - User can set/update a weekly training-day target.
  - Day-by-day (M–S) completion breakdown for the current week is visible.
  - Goal status (Active/Completed/Failed) is computed and shown.
- **Priority:** Not date-boxed; status: not started.

### Streak freezes
- **Rationale:** Old plan mentioned a "streak freeze inventory" and "Use Streak Freeze"
  action on a dedicated `StreakScreen.js`. Current code has `progressApi.getStreakData()`
  / `getStreakStats()` and `teamApi.getTeamStreak()` but no freeze-related endpoint calls
  or screen.
- **Acceptance criteria:**
  - User can see their available streak-freeze count and use one to protect a streak
    after a missed day, with the backend enforcing any earn/spend rules.
- **Priority:** Not date-boxed; status: not started. **Depends on backend support** —
  confirm with `mb-cloud-services` owners whether a freeze concept exists server-side
  before building the client UI.

---

## Theme: Session history

### Date-range / sport filters for session history
- **Rationale:** Verified in `src/screens/training/TrainingScreen.js` (lines 148-283,
  338-421): a "History" segment already exists inside the Training hub, calling
  `sessionApi.getSessionHistory()` with pull-to-refresh and a free-text search
  (`filteredHistory`, line 339) — so history browsing itself is **already built** (see
  WIKI §6) and not a roadmap item. What's confirmed missing (grepped for `dateRange`/
  `startDate`/`sport` filter state — none found beyond text search) is the **date-range
  and sport filtering** the old plan's Phase 4 `SessionHistoryScreen` described.
- **Acceptance criteria:**
  - History tab gains a date-range filter and a sport/category filter, in addition to
    the existing text search.
  - Filters compose with pull-to-refresh and the existing infinite-scroll/pagination.
- **Priority:** Not date-boxed; status: not started (the surrounding screen is otherwise
  functional — this is a scoped enhancement, not a new screen).

---

## Theme: Profile & settings depth

### Real Settings screen
- **Rationale:** `ProfileScreen.js` currently shows three tappable rows (Notifications,
  Privacy, Help & Support) all labeled "Coming Soon →" with no `onPress` handler wired —
  confirmed directly in `src/screens/profile/ProfileScreen.js` lines 70-83. No
  `SettingsScreen.js` exists.
- **Acceptance criteria:**
  - Notifications row opens real notification preferences (ties into the push
    notifications item above).
  - Privacy row surfaces the (eventually counsel-reviewed) privacy policy and any
    data-management controls.
  - Help & Support links to a real support channel/contact.
- **Priority:** Not date-boxed; status: not started (UI placeholders exist, no logic).

### Profile editing
- **Rationale:** `userApi.updateProfile()` exists and works, but no screen currently
  calls it — `ProfileScreen.js` is read-only (no edit button/form). The old plan's Phase 4
  included "implement profile editing."
- **Acceptance criteria:** User can edit display name, phone, and other mutable fields
  from `ProfileScreen` (or a new edit screen), submitting via the existing
  `userApi.updateProfile`.
- **Priority:** Not date-boxed; status: not started.

---

## Theme: Legal / compliance

### Real Terms of Service & Privacy Policy text
- **Rationale:** `ConsentScreen.js` and `Config.js`'s `POLICY_VERSION` comment both
  explicitly flag the current copy as placeholder, "must be replaced with counsel-
  reviewed... text before this ships to real users."
- **Acceptance criteria:**
  - Counsel-reviewed ToS/Privacy Policy text replaces the placeholder in
    `ConsentScreen.js`.
  - `POLICY_VERSION` is bumped to reflect the real text's version, triggering re-consent
    for any users who accepted the placeholder.
- **Priority:** Blocking for real launch (explicitly called a pre-launch requirement in
  the code comment itself, not a "nice to have").

---

## Housekeeping / cleanup (not features, but flagged during this audit)

- **Orphaned messaging screens** — `MessagesScreen.js`, `TeamMessagesScreen.js`,
  `UnifiedMessagesScreen.js` in `src/screens/messages/` are not referenced by any
  navigator (see WIKI §12). Decide whether to delete them or finish wiring one of them in
  as the intended messaging UI, rather than leaving three unreachable near-duplicates in
  the tree.
- **Environment-specific `API_BASE_URL`** — currently a single hardcoded
  `http://localhost:3050` in `Config.js` with no staging/prod switch or `.env` mechanism.
  Worth a decision before any non-local deployment of this app.
