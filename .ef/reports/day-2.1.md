# Execution Report: Day 2.1

## Summary
- **Date**: 2026-09-17
- **Phase**: 2 — Synchronized Chronometers
- **Day**: 2.1 — Implement deterministic chronometer state
- **Duration**: approximately 8 minutes
- **Status**: completed

## Tasks Completed

| # | Task | Commit | Notes |
|---|------|--------|-------|
| 1 | Create atomic application-lifetime state | Day 2.1 atomic commit | Root store selects 5–10 stable identities or exposes an explicit atomic failure |
| 2 | Implement shared-start timing | Day 2.1 atomic commit | One clock read starts all entries and one timer source drives derived elapsed values |
| 3 | Cover deterministic state behavior | Day 2.1 atomic commit | Controlled random, clock, timer, and injector tests cover the complete contract |

## Files Created
- `src/app/core/chronometer.model.ts` — readonly state and view contracts.
- `src/app/core/chronometer.tokens.ts` — injectable random, clock, and timer boundaries.
- `src/app/core/chronometer.store.ts` — root-scoped signal store and elapsed formatter.
- `src/app/core/chronometer.store.spec.ts` — deterministic state and timing tests.

## Files Modified
- EF plan, state, checkpoint, event, history, and report artifacts — recorded Day 2.1 completion.

## Decisions Made

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| Inject function boundaries | Production defaults stay lightweight and tests control every nondeterministic input | Global fake timers and patched globals |
| Derive elapsed time from the shared start instant | Timer delays or missed emissions cannot accumulate timing drift | Incrementing elapsed on each tick |
| Freeze published entries and arrays | Readonly ownership is enforced beyond compile-time types | Type-only readonly declarations |

## Deviations

None.

## Test Results

```text
Focused chronometer tests: passed (19 tests)
npm run lint: passed
npm run test:ci: passed (21 tests)
npm run build: passed
git diff --check: passed
```

## Browser Verification

*Browser verification skipped: Day 2.1 is internal state behavior; routed UI is scheduled for Day 2.2.*

## Must-Haves Verification

| Type | Must-Have | Status | Evidence |
|------|-----------|--------|----------|
| truth | Fresh root injector creates exactly 5–10 stable identities | PASS | Controlled boundary and fresh-lifetime tests |
| truth | All chronometers share one clock-read start instant | PASS | Shared-start test asserts one clock call and identical starts |
| truth | Elapsed time derives from the shared start | PASS | Missed-time jump and backwards-clock tests |
| truth | One signal-backed timer source updates state | PASS | Duplicate Start test asserts one timer factory call |
| truth | Invalid randomness produces an error and empty collection | PASS | Invalid values and throwing source tests |
| artifact | Readonly model, deterministic tokens, root store, focused tests | PASS | All four planned core files exist and are non-stub |
| key link | Store is root-provided with no component or route provider | PASS | `@Injectable({ providedIn: 'root' })`; UI files untouched |
| key link | Computed elapsed values depend on signal tick and shared start | PASS | `currentInstant` and `sharedStart` feed the computed view |
| key link | Start guard prevents duplicate timer sources | PASS | Running/error/empty guard plus controlled assertion |

## Manual Test Instructions

No manual testing required for this day.

## Next Steps
- Start a fresh context and run `ef:dev 2.2`.
- Consume the root store from the routed UI without adding feature- or route-level providers.

---

*Generated after Day 2.1 execution.*
