# GaiaRox user guide

GaiaRox collects synchronized chronometer timing results.

## Synchronized chronometers

Each application lifetime creates one random set of 5–10 independently identified
chronometers. They begin stopped at `00:00.000`.

- **Add**: before Start, the **+** tile adds another chronometer. It first asks for a name
  (required, trimmed, up to 40 characters, unique ignoring case), which then labels the card.
  **Cancel** or <kbd>Esc</kbd> abandons the request.
- **Start**: starts every card from one shared clock instant. It remains disabled for that
  application lifetime.
- **Stop**: each card has an aligned **Stop** button, available while its chronometer is
  running. Stopping one card freezes its exact click-time value while the others keep updating
  once per second in `mm:ss.mmm` format.
- **Resume**: sits beside Start and stays disabled until Start has fired and every
  chronometer is stopped. It continues every chronometer from its own frozen elapsed value,
  using one freshly read shared clock instant, and can be used repeatedly across multiple
  stop-then-resume cycles.

Elapsed time is derived from the clock, so delayed updates do not make running chronometers
lose time.

## Navigation and refresh

Navigating to **About** and back preserves the count, identities, and running state. Only a
full browser refresh starts a new application lifetime with a fresh random selection; the new
count may match the previous one. If selection fails, the page shows an accessible error alert
rather than a partial set.

## Cloud sync (optional)

When cloud sync is configured (see the [developer guide](DEVELOPMENT.md#cloud-sync-setup)),
chronometers can be shared live across devices with an event code (a GUID, no login).

1. Open the app, enter an event code (or click "New code"), and join.
2. Use "Copy share link" to open the same event on another device (`?room=<code>`).

Things to know:

- Anyone who knows an event code can read and edit it, so keep the GUIDs private.
- Devices should have reasonably accurate clocks, because timers use absolute timestamps.
- Concurrent edits are last-write-wins.
- Without cloud sync configured, data exists in memory for the current page only and the sync
  UI is hidden.
- The browser's local storage only holds the theme and language.
