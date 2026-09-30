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
chronometers. They begin stopped at `00:00.000`. The native **Start** button starts every
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
