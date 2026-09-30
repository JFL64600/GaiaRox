---
status: completed
created: 2026-09-17
updated: 2026-09-17
effort: low
priority: null
initiative: "Synchronized Chronometers"
depends_on: []
---

# Synchronized Chronometers

## Purpose

Provide a simple starting point for timing activities by creating a small random set of chronometers and starting them together.

## User Experience

On a full browser refresh, the user sees 5–10 chronometers, each showing `00:00.000` and a stopped state. One clearly labelled **Start** button starts every chronometer in a single action and then remains disabled. Each card has an aligned **Stop** button that freezes only that chronometer while the others continue. A **Resume** button sits beside Start, disabled until Start has fired and every chronometer is stopped; activating it continues every chronometer from its own frozen elapsed value rather than restarting it from `00:00.000`. Displays refresh once per second using `mm:ss.mmm` formatting.

## Functional Requirements

1. On each full browser refresh, select one whole number from 5 through 10, inclusive.
2. Display exactly the selected number of independently identified chronometers.
3. Initialize every chronometer at `00:00.000` in a stopped state.
4. Provide one clearly labelled Start control that is keyboard operable.
5. A Start action starts all displayed chronometers from zero against the same start instant.
6. Disable the Start control while all chronometers are running.
7. Format elapsed times as `mm:ss.mmm` and refresh displayed values once per second.
8. Navigating within the application without a full browser refresh preserves the existing chronometer set.
9. Show an explicit user-facing error if initialization cannot produce the chronometer set.
10. Provide one aligned, clearly labelled Stop control for every chronometer.
11. Keep Stop disabled before Start and after its chronometer has stopped.
12. Stopping a chronometer freezes it at the click-time clock value without stopping the other chronometers.
13. Do not allow an individual stopped chronometer to restart on its own while other chronometers in the set are still running.
14. Provide one clearly labelled Resume control, beside Start, that is enabled only once Start has fired and every chronometer in the set is stopped.
15. A Resume action continues every chronometer from its own frozen elapsed value, using one freshly read shared clock instant, rather than resetting any chronometer to `00:00.000`.

## Acceptance Criteria

- Initialization displays between 5 and 10 chronometers, inclusive.
- Every displayed chronometer initially shows `00:00.000` and is stopped.
- Activating Start causes every displayed chronometer to begin in the same user action.
- Running chronometers show no visible sequencing or divergence caused by startup order.
- Start becomes disabled while the chronometers are running.
- Running times use `mm:ss.mmm` and refresh once per second.
- In-app navigation does not generate a new set without a full browser refresh.
- The Start control has an accessible name and works with a keyboard.
- Every Stop control has a chronometer-specific accessible name and works with a keyboard.
- Activating one Stop freezes only the corresponding chronometer at its click-time value.
- Stop controls remain aligned across the chronometer cards.
- Start remains disabled after every chronometer has stopped.
- Resume stays disabled before Start has fired and while any chronometer is still running.
- Resume becomes enabled once every chronometer in the set has stopped.
- Activating Resume continues every chronometer from its own frozen elapsed value in the same user action and re-disables Resume.
- The Resume control has an accessible name and works with a keyboard.
- An initialization failure presents a clear error instead of a partial set.

## Edge Cases

- Both random boundaries, 5 and 10, are valid outcomes.
- A full browser refresh creates a new set and makes a fresh random selection.
- In-app component recreation or route navigation must not select a new count.
- Rapid repeated activation cannot trigger another start because the control becomes disabled.
- No chronometer may remain stopped after a successful Start action.
- Stop actions before Start, for unknown identities, or for already stopped chronometers are ignored.
- When the final running chronometer stops, periodic update work ends.
- Resume is a no-op while Start has never fired, while any chronometer is still running, or after an initialization failure.
- Resume may be activated repeatedly across multiple stop-then-resume cycles within the same application lifetime, continuing elapsed time each round rather than resetting it.
- A creation failure must not leave a misleading partial collection.
- Millisecond digits may change by more than `001` because visible updates occur only once per second.

## Non-Functional Requirements

- Use strict Angular and TypeScript settings when implementation begins.
- Keep timing behavior deterministic and independently testable from rendering.
- Use semantic, keyboard-accessible controls and accessible status/error feedback.
- Keep per-card Stop controls visually aligned in responsive layouts.
- Avoid duplicate update work after the Start action.
- Keep initial rendering and Start feedback responsive enough to appear simultaneous.
- Derive all displayed elapsed values from the shared start instant rather than accumulated refresh ticks.

## Scope

### In Scope

- Random selection of a count from 5 through 10 on full browser refresh.
- Initial creation and display of the selected chronometer count.
- A `00:00.000`, stopped initial state.
- One synchronized Start action for all displayed chronometers.
- Millisecond-formatted values refreshed once per second.
- A disabled Start control while chronometers run.
- One independently acting, aligned Stop control per chronometer.
- Permanent per-chronometer stopping until the whole set is stopped or a full application refresh.
- One Resume control that continues the whole set from each chronometer's own frozen elapsed value once every chronometer is stopped.
- Accessible control and explicit initialization failure feedback.

### Out of Scope

- Pausing or resetting an individual chronometer while others in the set keep running.
- Persistence of counts, elapsed times, or sessions.
- Physical chronometer or other hardware integration.
- Timing result ingestion, reporting, authentication, or deployment.
- User-selected chronometer counts.

## Data and UI Considerations

- Each displayed chronometer needs a stable identity within the current view.
- Runtime state requires the selected count, a shared start instant, and running status.
- The selected count and chronometer identities must survive in-app navigation.
- The UI should present the collection clearly without implying different start times.
- Display elapsed time as `mm:ss.mmm`, updating once per second.
- Disable Start when the shared running state is active.
- Keep Start disabled once the set has started and enable Stop only for running entries.
- Capture a fresh clock value for each valid Stop action and freeze that entry independently.
- Enable Resume only once every chronometer is stopped, and capture one fresh shared clock value to derive each entry's continued elapsed time when it is activated.
- No durable data model or API is required for this scope.

## Testing Expectations

- Verify count generation includes both boundaries and never leaves the 5–10 range.
- Verify the rendered count matches the selected count.
- Verify all initial values are `00:00.000` and all states are stopped.
- Verify one Start action gives every chronometer the same logical start instant.
- Verify Start becomes disabled after activation and cannot trigger duplicate update activity.
- Verify `mm:ss.mmm` formatting and one visible refresh per second.
- Verify in-app navigation preserves the set while full refresh creates a fresh selection.
- Verify keyboard operation, accessible naming, and explicit failure feedback.
- Verify independent Stop behavior, exact frozen values, control alignment structure, invalid-action guards, and final timer teardown.
- Verify Resume's disabled/enabled guard conditions, per-entry continuation from frozen elapsed values (including entries stopped at different instants), restarted periodic ticking, and repeated stop-then-resume cycles.
- Use controlled time in focused tests to avoid timing-sensitive flakiness.

## Assumptions and Confidence

| Assumption | Confidence | Basis |
|---|---|---|
| “Choose” means an automatic random selection at initialization. | High | Explicit interpretation supplied for this draft. |
| The random selection occurs only on a full browser refresh. | High | Confirmed during spec validation. |
| “Same user action” means one shared logical start instant. | High | Required to avoid perceptible sequencing. |
| Chronometers display elapsed time only in memory for this scope. | High | Persistence and hardware integration are excluded. |
| A general user operates the feature without role-specific behavior. | Medium | No users or authorization model exists yet. |

## Resolved Decisions

1. Display elapsed time with millisecond precision using `mm:ss.mmm`.
2. Refresh visible elapsed values once per second.
3. Generate a new random chronometer set only after a full browser refresh.
4. Disable Start while the chronometers are running.
5. Render Stop for every card but disable it unless that chronometer is running.
6. An individual stopped chronometer cannot restart on its own while others in the set are still running.
7. Add a Resume control, beside Start, that continues each chronometer from its own frozen elapsed value once every chronometer has stopped.

## Quality Assessment

- **Clarity**: 96%
- **Completeness**: 94%
- **Testability**: 96%
- **Feasibility**: 93%
- **Scope control**: 98%
- **Overall**: 95% — ready for planning
