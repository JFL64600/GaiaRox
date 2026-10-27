# GaiaRox developer guide

## Prerequisites

- Node.js 24.15.0 or later in the supported Node 24 line
- npm 11.10.0

## Install and start

```powershell
npm ci
npm start
```

Open `http://localhost:4200/`.

## Quality checks

```powershell
npm run lint
npm run test:ci
npm run build
```

`test:ci` runs the Angular unit-test target once with Vitest.

Automated tests cover the inclusive count boundaries, initial state, shared Start
instant, duplicate-start prevention, independent exact-time stopping, timer teardown,
clock-derived elapsed jumps, formatting, accessible UI/error semantics, state
preservation across routed navigation, and the Resume control's guard conditions,
full-set reset, and repeated stop-then-resume cycles. The fresh-lifetime injector test
verifies that each application lifetime performs one new valid selection.

### Manual refresh check

1. Record the displayed chronometer count and card identities.
2. Navigate to **About**, return to **Chronometers**, and confirm they are unchanged.
3. Perform a full browser refresh and confirm a valid set of 5–10 chronometers appears.
   Random selection means the count is allowed to repeat.

The initialization failure path is automated because normal browser randomness should
not fail.

## Architecture notes

The chronometer store belongs to the application root, so client-side navigation preserves
its state; only a full refresh creates a new application lifetime.

## Cloud sync setup

Cloud sync uses Firebase Firestore; data is stored in the `events` collection.

1. Create a Firebase project and a Firestore database, then deploy `firestore.rules`.
2. Register a web app and paste its public config into `src/app/core/firebase.config.ts`
   (`FIREBASE_CONFIG`).

While `FIREBASE_CONFIG` is `null`, data exists in memory for the current page only and the
sync UI is hidden.

Security notes: the events list is open (anyone can list and open every event) and there is
no authentication, so access relies on event codes staying private. Concurrent edits are
last-write-wins. Local storage only holds the theme and language.
