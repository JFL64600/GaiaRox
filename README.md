# GaiaRox

Angular application for collecting synchronized chronometer timing results.

## Prerequisites

- Node.js 24.15.0 or later in the supported Node 24 line
- npm 11.10.0

## Install

```powershell
npm ci
```

## Start

```powershell
npm start
```

Open `http://localhost:4200/`.

## Synchronized chronometers

Each application lifetime creates one random set of 5–10 independently identified
chronometers. They begin stopped at `00:00.000`. Before Start, the **+** tile adds another
chronometer: it first asks for a name (required, trimmed, up to 40 characters, unique
ignoring case), which then labels the card. **Cancel** or <kbd>Esc</kbd> abandons the request.
The native **Start** button starts every
card from one shared clock instant and remains disabled for that application lifetime.
Each card has an aligned **Stop** button that becomes available while its chronometer is
running. Stopping one card freezes its exact click-time value while the other
chronometers continue updating once per second in `mm:ss.mmm` format. A native
**Resume** button sits beside Start; it stays disabled until Start has fired and every
chronometer in the set is stopped. Activating Resume continues every chronometer from its own
frozen elapsed value (rather than resetting it to zero), using one freshly read shared clock
instant, and can be used repeatedly across multiple stop-then-resume cycles within the same
application lifetime. Elapsed time is derived from the clock, so delayed updates do not make
running chronometers lose time.

The store belongs to the application root. Client-side navigation to **About** and back
preserves the count, identities, and running state. Only a full browser refresh starts a
new application lifetime and performs a fresh random selection; the new count may
legitimately match the previous count. If selection fails, the page presents an
accessible error alert rather than a partial set.

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


## Cloud sync (optional)

Chronometers can be shared live across devices through Firebase Firestore, using a shared room code (no login).

1. Create a Firebase project and a Firestore database, then deploy `firestore.rules`.
2. Register a web app and paste its public config into `src/app/core/firebase.config.ts` (`FIREBASE_CONFIG`).
3. Open the app, enter a room code (or click "New code"), and join. Use "Copy share link" to open the same room on another device (`?room=<code>`).

While `FIREBASE_CONFIG` is `null`, the app stays local and the sync UI is hidden. Anyone who knows a room code can read and edit it, so use long random codes. Devices should have reasonably accurate clocks because timers use absolute timestamps. Concurrent edits are last-write-wins.