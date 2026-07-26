# mb-mobile-training — Wiki

Current-state reference for the **Steamers Crew Training** mobile app, grounded in the
code as of 2026-07-26. This is one of three sibling repos under `training-apps/` — see
the root `CLAUDE.md` there for cross-repo context. If something here conflicts with a
code comment, the code wins; file paths are cited throughout so claims can be re-checked.

## 1. Purpose & who uses it

A React Native / Expo mobile app that consumes the `mb-cloud-services` backend to give
athletes, parents/guardians, and coaches a training companion: browse/assign training
plans, run timed training sessions, track XP/streaks/progress, and message teammates.

Two account types exist (`src/screens/auth/AccountTypeScreen.js`):
- **Parent/guardian** — manages one or more **athlete** profiles (including minors).
  Athletes are data rows under the parent's account, not separate logins
  (`src/screens/auth/AddAthleteScreen.js` header comment).
- **Independent (18+)** — signs up and uses the app for themselves.

Coaches operate mostly from `mb-admin-portal` (sibling repo) and appear here as the
senders of assignments/messages/invitations the mobile user receives.

## 2. Tech stack & key dependencies

From `package.json`:
- **Expo SDK** ~54.0.13, new architecture enabled (`app.json` → `newArchEnabled: true`)
- **React** 19.1.0 / **React Native** 0.81.5
- **Navigation:** `@react-navigation/native` ^6, `native-stack`, `bottom-tabs`
- **HTTP:** `axios` ^1.6
- **Auth:** `expo-auth-session` (PKCE OAuth), `expo-web-browser`
- **Storage:** `expo-secure-store` (native Keychain/EncryptedSharedPreferences),
  `@react-native-async-storage/async-storage` (non-sensitive cache)
- **UI extras:** `@expo/vector-icons`, `expo-linear-gradient`, `expo-audio` (`src/assets/sounds/*.mp3`),
  `react-native-youtube-iframe` (plan intro videos), `@react-native-community/datetimepicker`,
  `@react-native-picker/picker`
- **Web target:** `react-native-web`, `react-native-web-webview` — the app also runs as an
  Expo web build (`expo start --web`, dev server on `:8081`)
- No push notifications / analytics libs installed yet despite feature flags existing for
  them (see §6, §9)

## 3. Architecture

```
App.js                        # AuthProvider + AppNavigator, entry point
src/
  navigation/
    AppNavigator.js           # Root switch: auth screens vs onboarding steps vs MainNavigator
    MainNavigator.js           # Bottom tabs: Home, Training, Calendar, Messages (+ nested stacks)
  screens/
    auth/                     # Login, SignUp, VerifyEmail, AccountType, Consent, ProfileSetup, AddAthlete
    home/                     # HomeScreen (dashboard)
    training/                 # TrainingScreen, PlanDetailsScreen, ActiveTrainingScreen
    calendar/                 # CalendarScreen
    messages/                 # ConversationList, ThreadDetail, ComposeMessage, Invitations (wired);
                               # MessagesScreen, TeamMessagesScreen, UnifiedMessagesScreen (NOT wired — see §12)
    profile/                  # ProfileScreen
  components/
    common/Button.js
    home/NextTrainingWidget.js, TeamStatusWidget.js
    AssignmentModal.js, InviteDetailModal.js
  contexts/AuthContext.js      # Auth state, OAuth (web + native), token bootstrap
  services/
    auth/cognitoAuth.js        # Native SignUp/ConfirmSignUp/ResendConfirmationCode
    api/*.js                   # One module per backend resource (axios wrapper around apiClient)
    storage/SecureStorage.js, CacheStorage.js
    utils/tokenManager.js      # Refresh-token logic, 401 handling
  constants/Config.js, Colors.js, Layout.js
```

### Navigation & onboarding gating

`src/navigation/AppNavigator.js` is a single `Stack.Navigator` that mounts **exactly one**
of the following at a time, switching on `useAuth()` state — never more than one, so
onboarding screens receive their data via props/callbacks (`onChoose`, `onAccept`), not
`navigation.navigate`, because sibling screens for later steps aren't registered yet
(explicit comment at lines 28-34 and 48-52):

1. **Not authenticated** → `Login` / `SignUp` / `VerifyEmail` (these three *are* real
   navigable siblings, since a user bounces between them pre-auth).
2. **Authenticated, no profile yet** (`!user?.displayName`) → linear onboarding:
   `AccountType` → `Consent` → `ProfileSetup`, each step gated on the previous
   (`needsAccountType` / `needsConsent` / `needsProfile` booleans, lines 53-55).
3. **Has profile, is a parent with zero athletes, hasn't skipped** → `AddAthlete`
   (`needsAthletes`, lines 56-60). The "skip for now" choice is persisted locally per-user
   in `AsyncStorage` under `athlete_onboarding_skipped_<userId>` (`AuthContext.js` lines 20,
   40-63) — it's a client-only UX preference, not sent to the backend.
4. **Otherwise** → `MainNavigator` (bottom tabs) + a modal `Profile` screen pushed on top.

### Main tab app (`src/navigation/MainNavigator.js`)

Bottom tabs: **Home**, **Training** (stack: TrainingScreen → PlanDetailsScreen →
ActiveTrainingScreen), **Calendar** (same nested stack pattern), **Messages** (stack:
ConversationListScreen → ThreadDetailScreen / ComposeMessageScreen / InvitationsScreen).
Unread-message badge polls `messageApi.getConversations()` every 30s (lines 156-177).

## 4. Auth — the full current flow

This was recently rebuilt; the code and its own inline comments are the best source of
truth (`src/services/auth/cognitoAuth.js` lines 1-21 are essentially a design doc).

**Why it's shaped this way:** the shared Cognito user pool (`us-east-1_4CSKmyoGw`, one
pool across all three sibling repos per root `CLAUDE.md`) has `alias_attributes =
["email"]`. An email alias only resolves to a user **after** that user is confirmed.
Consequently:

- **SignUp** (`src/screens/auth/SignUpScreen.js`) — plain email + password form, calls
  `cognitoAuth.signUp(email, password)`. Cognito rejects an email-shaped `Username`
  outright ("Username cannot be of email format..."), so `deriveUsername()`
  (`cognitoAuth.js` line 28-30) turns the email into an opaque, non-email string
  (lowercased, non-alphanumerics → `_`) used as the literal Cognito username. The user
  never sees or picks this value. On success, navigates to `VerifyEmail` with the email.
- **ConfirmSignUp / ResendConfirmationCode** (`VerifyEmailScreen.js`) — must also use the
  *same derived username*, not the email, because while the user is `UNCONFIRMED` the
  email alias isn't resolvable yet; passing the email here surfaces as a bogus
  `CodeMismatch`/`ExpiredCode` error instead of `UserNotFound` (a specific trap called out
  in both `cognitoAuth.js` and the root `CLAUDE.md` gotchas). On success, `VerifyEmailScreen`
  calls `login()` after ~800ms to hand off into the hosted-UI sign-in — no native
  password-based `InitiateAuth` needed.
- **Sign-in** — unchanged, hosted-UI OAuth (`AuthContext.js`), which runs only *after*
  confirmation so the email alias is active and accepts email directly.
- **`describeCognitoError`** (`cognitoAuth.js` lines 76-95) maps Cognito exception
  `__type`s (UsernameExists/AliasExists, InvalidPassword, CodeMismatch, ExpiredCode,
  throttling, etc.) to user-facing copy shown on both SignUp and VerifyEmail screens.

### Hosted-UI sign-in (`src/contexts/AuthContext.js`)

Uses `expo-auth-session`'s PKCE `useAuthRequest` against Cognito's hosted-UI discovery
endpoints (`authorizationEndpoint`/`tokenEndpoint`/`revocationEndpoint` built from
`COGNITO_CONFIG.domain`). Two different code paths depending on platform:

- **Native (iOS/Android):** `promptAsync()` opens an in-app browser; the response comes
  back through the `AuthSession.useAuthRequest` response object and is handled in a
  `useEffect` (lines 85-92) → `handleOAuthSuccess` → `AuthSession.exchangeCodeAsync`
  (with `code_verifier`) → tokens saved via `SecureStorage.saveTokens`.
- **Web:** popups are unreliable across browsers, so `login()` does a **full-page
  redirect** instead (`window.location.href = request.url`, after stashing
  `request.codeVerifier` in `sessionStorage`, lines 292-303). A separate `useEffect`
  (lines 99-141) fires on mount, reads `?code=` from `window.location.search`, retrieves
  the stashed PKCE verifier, and exchanges the code the same way.
- Either path decodes the returned `idToken` (JWT, base64 decode — `decodeJWT`, lines
  144-159) to get `email`/`cognito:username`, then `validateAndLoadUser()`
  (lines 197-267) calls `authApi.validateToken()` → merges ID-token claims → tries
  `userApi.getCurrentUser()` for the full profile (404 = first-time user, falls back to
  bare claims so `AppNavigator` routes into onboarding).
- **Token refresh:** if validation fails, `validateAndLoadUser` attempts
  `authApi.refreshToken()` before giving up and clearing tokens (forcing re-login). A
  parallel refresh path lives in `src/services/utils/tokenManager.js` used by the generic
  `apiClient` 401-interceptor (see §7).
- **Global logout event:** `global.authEventEmitter` (lines 322-335) lets the low-level
  `apiClient` (no React context access) trigger `AuthContext.logout()` on an unrecoverable
  401.

### Token storage

`src/services/storage/SecureStorage.js` wraps `expo-secure-store` (Keychain on iOS,
EncryptedSharedPreferences on Android) for `access_token`/`refresh_token`/`id_token`/
`user_id`. **On web**, `expo-secure-store` has no OS keychain to back it, so this file
falls back to a `webStorage` shim over `window.localStorage` (lines 16-28) — explicitly
called out in the file's own comment as unencrypted-at-rest and fine only for local dev
preview, not production web deployment.

## 5. Config (`src/constants/Config.js`)

- `API_BASE_URL = 'http://localhost:3050'` — hardcoded, no per-environment file/env-var
  switch. Per root `CLAUDE.md`, the backend mounts everything under `/api`; this base URL
  has no `/api` suffix, and every API module below explicitly includes `/api/...` in its
  path, so that's already accounted for here (unlike the deployed-build gotcha the
  admin-portal repo has to work around).
- `COGNITO_CONFIG` — `domain: magic-board-dev-auth.auth.us-east-1.amazoncognito.com`,
  `userPoolId: us-east-1_4CSKmyoGw`, `clientId: 738um5t7qmnne5p6gumi6149ua`,
  `scopes: ['openid','email','profile']`, `responseType: 'code'`.
  `redirectUri` is **platform-conditional**: `mbtraining://auth` on native,
  `http://localhost:8081/auth/callback` on web (comment explains web has no custom URL
  scheme, so hosted UI must redirect to an http(s) page matching the web dev server port).
  Both URLs must be registered as allowed callback URLs on the Cognito app client — see
  `update-cognito-callbacks.sh` (root of repo) which sets exactly these two
  callback/logout URL pairs via `aws cognito-idp update-user-pool-client`. Per root
  `CLAUDE.md` gotcha #7, this CLI call replaces OAuth fields *wholesale* — re-running it
  (or Terraform) without all the same flags will silently wipe others.
- `POLICY_VERSION = '2026-07-placeholder'` — stored with each user's consent record so a
  future policy-text change can force re-consent. Comment explicitly flags the
  `ConsentScreen.js` text as **placeholder copy, not reviewed by counsel**.
- `APP_CONFIG` — pagination (`defaultPageSize: 20`), cache expiry (5 min), session
  auto-save interval (30s, not yet wired to any active-session auto-save call found),
  API timeout (10s), retry settings (defined but not obviously consumed by `apiClient`'s
  interceptors — only the 401/refresh path is implemented, no generic retry-on-network-
  error loop).
- `FEATURES` — feature flags, all currently **off except `offlineMode`**:
  `offlineMode: true`, `pushNotifications: false` ("Enable in Phase 5"),
  `analytics: false` ("Enable in Phase 5"), `deepLinking: false` ("Enable in Phase 5").
  None of these flags are actually referenced/consumed anywhere in `src/` yet (checked
  via grep) — they're placeholders for the roadmap items in `docs/ROADMAP.md`, not gates
  around real code paths.
- `app.json` — `scheme: "mbtraining"` (the deep link scheme Cognito must allow as a
  callback), `bundleIdentifier`/`package`: `com.magicboard.training`, `newArchEnabled:
  true`, `plugins: ["expo-audio"]`.

## 6. Key screens/flows as currently built

| Screen | File | Notes |
|---|---|---|
| Login | `src/screens/auth/LoginScreen.js` | Branding + "Login" (hosted UI) + "Create an Account" → SignUp |
| Sign Up | `src/screens/auth/SignUpScreen.js` | Email/password/confirm, client-side email regex + password-match check, native Cognito `signUp()` |
| Verify Email | `src/screens/auth/VerifyEmailScreen.js` | 6-digit code input, confirm + resend, then auto hands off to hosted-UI login |
| Account Type | `src/screens/auth/AccountTypeScreen.js` | parent vs independent(18+) choice, held in local state until ProfileSetup submits |
| Consent | `src/screens/auth/ConsentScreen.js` | Single checkbox + placeholder ToS/Privacy text, stamps `POLICY_VERSION` |
| Profile Setup | `src/screens/auth/ProfileSetupScreen.js` | Collects displayName, firstName, lastName, DOB (MM/DD/YYYY→ISO), gender, **phone required in current code** (differs from the old PROFILE_SETUP_CHANGES.md claim that phone was optional — see §12), `POST /api/users/me` |
| Add Athlete | `src/screens/auth/AddAthleteScreen.js` | Parent-only step; add N athlete rows (`POST /api/users/me/athletes`), skippable, skip persisted per-user in AsyncStorage |
| Home | `src/screens/home/HomeScreen.js` | Level/streak stat cards, `NextTrainingWidget`, per-team `TeamStatusWidget`s, team milestone feed (celebrate), incomplete-assignment feed (nudge teammates), pull-to-refresh |
| Training | `src/screens/training/TrainingScreen.js` | Hub: browse/search plans, history, progress tabs |
| Plan Details | `src/screens/training/PlanDetailsScreen.js` | Intro video (YouTube iframe) + collapsible task/tips/instructions/safety sections, uses `AssignmentModal` |
| Active Training | `src/screens/training/ActiveTrainingScreen.js` | Sequential task walkthrough with timer and completion tracking (uses `expo-audio` beep/horn sounds in `src/assets/sounds/`) |
| Calendar | `src/screens/calendar/CalendarScreen.js` | Calendar view of sessions/team events |
| Messages (wired) | `ConversationListScreen` → `ThreadDetailScreen` / `ComposeMessageScreen` / `InvitationsScreen` | Actual routed messaging stack (see §3) |
| Profile | `src/screens/profile/ProfileScreen.js` | Read-only profile info (from `user.extensions.*`), account info, settings placeholders ("Coming Soon"), Logout |

## 7. API integration

All API modules live in `src/services/api/` and share one axios instance:

**`apiClient.js`** — base URL `API_BASE_URL`, `Content-Type: application/json`.
- Request interceptor: attaches `Authorization: Bearer <accessToken>` **and**
  `x-id-token: <idToken>` (comment: "so backend can extract email") on every request.
- Response interceptor: on `401` (not already retried), triggers `tokenManager.refreshAccessToken()`, queuing concurrent requests via `subscribeTokenRefresh`/`onTokenRefreshed`
  until the in-flight refresh resolves; on refresh failure, clears tokens and emits the
  `global.authEventEmitter` `'logout'` event consumed by `AuthContext`.

**`tokenManager.js`** — separate refresh path used by the interceptor (distinct from
`AuthContext.validateAndLoadUser`'s own refresh attempt): POSTs
`{refreshToken}` to `${API_BASE_URL}/api/auth/refresh`, distinguishes network errors
(keeps tokens, lets caller retry) from actual invalid/expired-token errors (clears tokens,
forces re-login). Also exposes `isTokenExpired`/`getValidAccessToken` (JWT `exp` decode
with a 60s buffer) though nothing in the read files currently calls
`getValidAccessToken` directly — the interceptor-based reactive refresh is the live path.

**Per-resource clients** (all thin axios wrappers returning `response.data`):
`authApi` (validate/refresh), `userApi` (profile CRUD, athletes CRUD, username
availability, org list), `planApi` (program details, assignment details, browse/search
programs), `sessionApi` (history, start/complete session), `progressApi` (player
progress, streak, streak stats), `assignmentApi` (user/team assignments, create/update/
delete/complete), `teamApi` (teams CRUD, members, streak), `teamActivityApi` (activity
feed, celebrate, incomplete assignments, nudges, today's completions),
`invitationApi`/`messageApi` (invitations by token, accept/decline, team/org/direct
messages, conversations, polling, unread counts), `notificationApi` (list/unread-count/
mark-read/delete), `organizationApi` (orgs, org members).

## 8. Build / run / dev

- `npm install`, then `npm start` (`expo start`) — Metro bundler + Expo dev tools.
- `npm run ios` / `npm run android` — native builds via `expo run:ios`/`run:android`.
- `npm run web` (`expo start --web`) — Expo web dev server, defaults to **port 8081**
  (matches `COGNITO_CONFIG.redirectUri` for web and the callback URL registered by
  `update-cognito-callbacks.sh`).
- `./start-simulator.sh` — convenience script: clears `.expo` cache, boots the "iPhone 17
  Pro" simulator specifically (hardcoded device name), opens Simulator.app, runs
  `expo start --clear --ios`.
- `./update-cognito-callbacks.sh` — one-shot AWS CLI script to (re)set the Cognito app
  client's callback/logout URLs to the current `mbtraining://auth` + `localhost:8081`
  pair. Per root `CLAUDE.md`, this call **replaces OAuth config wholesale**, and
  Terraform (owned by `mb-cloud-services`) is the real source of truth — a manual run of
  this script can be reverted by the next `terraform apply` unless mirrored there.
- Requires `mb-cloud-services` running locally on `:3050` for any API-backed screen to
  work (Docker Compose, per root `CLAUDE.md`).

## 9. Testing

**No test framework is configured.** `package.json` has no `test` script, no `jest`
config, no testing-library dependency. The only `*.test.js` files in the tree are inside
`node_modules` (third-party packages' own tests) — confirmed via search. There is no
`__tests__/` directory despite one being sketched in the old `IMPLEMENTATION_PLAN.md`
(never built — see `docs/ROADMAP.md`).

## 10. Cross-repo touchpoints

- **`mb-cloud-services`** (sibling repo, owned separately) — the backend all
  `src/services/api/*` calls hit at `API_BASE_URL` + `/api/...`. This app only consumes
  those endpoints; it does not define or own them. See that repo for the actual route
  implementations.
- **Shared Cognito user pool** `us-east-1_4CSKmyoGw`, app client `738um5t7qmnne5p6gumi6149ua`
  — shared across all three sibling repos (`mb-cloud-services`, `mb-admin-portal`, this
  app). Pool/client configuration changes are owned by `mb-cloud-services`'s Terraform;
  this repo only consumes the client ID/domain and must keep its two redirect URIs
  registered there (see §5, §8).
- Coordinate any Cognito or `/api` contract changes with the other two repos' owners —
  this document does not assert anything about their internals beyond what's visible from
  this app's config and network calls.

## 11. Known gotchas

Carried forward from the root `CLAUDE.md` (still current, verified applicable to this
repo's code):

- **Email alias activates only after confirmation.** `SignUp` rejects an email-shaped
  username; `ConfirmSignUp`/`ResendConfirmationCode` must use the literal derived
  username (not email) because the alias isn't resolvable while `UNCONFIRMED` — an
  email passed there surfaces as a bogus `CodeMismatch`/`ExpiredCode`, not `UserNotFound`.
  Sign-in (post-confirmation) accepts email normally. See §4 and
  `src/services/auth/cognitoAuth.js`.
- **Local dev DB drifts from the Cognito pool.** The pool can be recreated on backend
  schema changes, issuing fresh `sub`s while `mb-cloud-services`'s `user_profiles` table
  keeps rows keyed to old ones. Since `getProfile` matches by email, stale rows can cause
  username-collision 400s from `POST /api/users/me` during `ProfileSetupScreen` testing.
  Clean test data or use a fresh email when this app's profile-creation flow misbehaves.
- **Cognito's default mailer (`COGNITO_DEFAULT`) is slow/unreliable to Gmail/Yahoo.** A
  verification code shown as "expired" on `VerifyEmailScreen` may just be delivery lag or
  a superseded newer code (the user requested Resend and an earlier email arrived late).
  SES is the real fix if this becomes a recurring blocker; not yet implemented.
- **Backend mounts everything under `/api`.** This app's `API_BASE_URL` has no `/api`
  suffix and every API module path includes it explicitly, so it's handled correctly here
  — but be aware other repos (e.g. deployed admin-portal builds) have gotten this wrong by
  dropping the prefix. If `API_BASE_URL` is ever changed to point at a deployed
  CloudFormation `ServiceEndpoint`, the endpoint is bare and still needs `/api` appended.
- **Cognito `update-user-pool-client` replaces OAuth fields wholesale.** Running
  `update-cognito-callbacks.sh` (or any manual `aws cognito-idp update-user-pool-client`
  call) without every existing flag will silently clear the omitted ones. Prefer a
  reviewed Terraform plan in `mb-cloud-services/infrastructure/` for anything that must
  persist.
- **`ConsentScreen.js` text is placeholder, not counsel-reviewed** — flagged explicitly in
  both the component and `Config.js`'s `POLICY_VERSION` comment. Must be replaced before
  real launch.
- **Feature flags are inert.** `FEATURES.pushNotifications`/`analytics`/`deepLinking` are
  `false` with "Enable in Phase 5" comments and are not referenced anywhere in the app
  yet — don't assume flipping them does anything without also building the feature (see
  `docs/ROADMAP.md`).

## 12. Orphaned / inconsistent code found during this audit

- **`src/screens/messages/MessagesScreen.js`, `TeamMessagesScreen.js`,
  `UnifiedMessagesScreen.js`** are not referenced by any navigator — `MainNavigator.js`
  imports `MessagesScreen` (line 18 — never used in a route or as a component name after
  the import) and wires up `ConversationListScreen`/`ThreadDetailScreen`/
  `ComposeMessageScreen`/`InvitationsScreen` instead. These three files appear to be
  superseded by the current `ConversationListScreen`-based stack; treat as dead code
  pending an explicit cleanup decision (not deleted here — out of scope for a docs pass;
  flagged for follow-up).
- **`ProfileSetupScreen.js` requires phone number** (`phoneNumber.replace(/\D/g,
  '').length !== 10` blocks submit) — this contradicts the old (now-removed)
  `PROFILE_SETUP_CHANGES.md`, which described phone as optional. The **code** requiring it
  is current ground truth; that stale doc's claim was not reflected here.

## 13. Doc audit / consolidation manifest

| File | Disposition | Reason |
|---|---|---|
| `README.md` | KEPT, trimmed | Now a short entry point pointing to `docs/WIKI.md` and `docs/ROADMAP.md`; old content (stale Phase 1/2/3 status, outdated OAuth-only auth flow, wrong client ID) absorbed/corrected into this WIKI. |
| `QUICK_START.md` | REMOVED | Superseded by README + WIKI §8 (Build/run/dev); content (install/run/simulator steps) preserved there. |
| `PROFILE_SETUP_CHANGES.md` | REMOVED | Described a since-superseded profile-field change; current fields verified directly from `ProfileSetupScreen.js` and captured in WIKI §6/§12 (including the phone-required discrepancy this old doc got wrong). |
| `IMPLEMENTATION_PLAN.md` | REMOVED | Planning doc from project's start; already-built items verified against code and folded into this WIKI, genuinely future/unbuilt items moved to `docs/ROADMAP.md`. |
| `TROUBLESHOOTING.md` | REMOVED | File was empty (0 lines) — nothing to absorb. Real troubleshooting content that existed in `README.md`/`QUICK_START.md` was merged into WIKI §11 (gotchas) instead. |
| `docs/WIKI.md` | CREATED | This document. |
| `docs/ROADMAP.md` | CREATED | Future/desired-state doc. |
