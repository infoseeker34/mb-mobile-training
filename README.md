# Steamers Crew Training — Mobile App (mb-mobile-training)

React Native / Expo mobile app for athletes, parents/guardians, and coaches to consume
training programs from the Magic Board cloud services API.

This is one of three sibling repos under `training-apps/` (see the root `CLAUDE.md` one
level up for shared context: the common Cognito user pool, cross-repo gotchas, etc.).

## Where to look

- **[`docs/WIKI.md`](docs/WIKI.md)** — current-state reference: architecture, the full
  auth flow (native sign-up + hosted-UI sign-in), config, screens, API integration,
  build/run instructions, testing status, and known gotchas.
- **[`docs/ROADMAP.md`](docs/ROADMAP.md)** — future/desired work not yet built (push
  notifications, analytics, deep linking, achievements, testing, etc.), with rationale
  and acceptance criteria per item.

## Quick start

```bash
npm install
npm start          # expo start — press i for iOS simulator, w for web
```

Requires `mb-cloud-services` (the backend) running locally on `:3050`. See
`docs/WIKI.md` for full setup, OAuth configuration, and troubleshooting.

## License

Proprietary - Magic Board, Inc.
