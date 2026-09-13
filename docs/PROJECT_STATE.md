# Onshape Drawing Comfort Extension — Project State

**Updated:** 2026-09-13
**Product authority:** HUMAN
**Manifest version:** 0.1.1
**MAIN-world revision:** `persistence-main-1`
**Isolated-world revision:** `persistence-bridge-1`

## Product objective

Improve long-session visual comfort in Onshape drawings by controlling three proven renderer colors through a Chrome extension:

- sheet fill;
- unified foreground for ordinary geometry and dimensions;
- surround behind the sheet.

Unified foreground is the accepted architecture. Independent dimension color is not required for the initial product.

## Filesystem and operational workflow

Chrome loads the unpacked extension from:

```text
C:\Users\swehr\Documents\ONSHAPE-COMFORT-EXTENSION-LIVE
```

The Git-controlled mirror and project documentation are stored in:

```text
C:\AI_WORK\ONSHAPE-COMFORT-EXTENSION
```

The established workflow is:

```text
back up current files
→ edit the Chrome-loaded Documents copy
→ reload the extension and recreate the drawing realm
→ perform bounded live acceptance tests
→ copy the accepted live files to C:\AI_WORK
→ verify live/Git hashes match
→ commit the synchronized Git copy
```

Do not copy the Git mirror over a live candidate before acceptance; that previously replaced a new candidate with the older validated revision.

## Current accepted baseline

```text
branch: master
commit: 2e72ae9e5912daa4e06cb29be99bfb32db36fbb3
message: Add persistent preset bridge
working tree after commit: clean
```

Accepted live/source hashes before the commit:

```text
manifest.json
378634A17CB92ED285315A6C84A31EA5FD22385B2E93384867580628E8574178

bridge.js
ABAB436B10B65E5463F30B40C42BDCFB5BB1DB75848F39CDAC1AD857D5A08E97

theme.js
5EF3FC50283AEE8D660A4A0D018C821682AF061CFDE1A1D217BD1149652D88BA
```

All three live files matched their Git-mirror copies byte for byte before staging. Git warned that the working copy of `bridge.js` would be normalized from CRLF to LF when Git next touched it; the staged whitespace check passed, the expected staged file set was exact, and the commit completed successfully.

## Manifest and execution architecture

The extension remains Manifest V3 version 0.1.1 with minimum Chrome 111. It now requests the `storage` permission and loads two scripts at `document_idle` in matching Onshape production drawing-editor frames with `all_frames: true`:

```text
bridge.js → ISOLATED world
theme.js  → MAIN world
```

`bridge.js` owns access to `chrome.storage.local`. `theme.js` retains exclusive ownership of the established Onshape renderer paths. Settings cross the world boundary through a versioned same-window `postMessage` protocol with channel, protocol, direction, type, source, origin, and preset-ID validation.

The DOM message channel is page-observable and potentially spoofable. It is an application coordination boundary, not a privileged security boundary. No sensitive data crosses it.

No fixed manifest `key` was added. The fixed unpacked-extension directory is sufficient for the present local workflow; publishing or requiring a developer-dashboard identity remains outside the current scope.

## Current renderer behavior

The MAIN-world engine:

1. Polls for the expected drawing renderer for at most 60 seconds.
2. Requires exactly one Xe document in the editor realm.
3. Resolves the sheet fill structurally through `PaperOptimized` plus `xegltype === 4`.
4. Retains renderer identities and snapshots native colors.
5. Validates exact three-color `#RRGGBB` theme objects before mutation.
6. Converts user RGB to the renderer's normalized-RGB and `0xBBGGRR` representations.
7. Writes and verifies all three renderer controls.
8. Attempts per-control rollback if mutation/readback fails.
9. Requests immediate redraw with `invalidateScene()`.
10. Restores native renderer values on request.

A redraw exception after verified writes is reported without undoing those verified writes.

The frozen MAIN-world controller remains exposed in the drawing editor realm as:

```javascript
window.__onshapeComfortExtension01
```

Public methods:

```javascript
apply(theme?)
applyPreset(presetId)
listPresets()
restore()
report()
```

Direct custom application retains a normalized `activeTheme` and sets `activePreset:null`. RESTORE clears both fields. `listPresets()` returns serializable copies rather than mutable internal references.

## Accepted named presets

### Warm Drafting — default

```javascript
{
  sheet: "#D8D0BC",
  foreground: "#3F3D38",
  surround: "#50575A"
}
```

Stable ID: `warm_drafting`

### Slate Graphite

```javascript
{
  sheet: "#1D2023",
  foreground: "#929AA4",
  surround: "#42484E"
}
```

Stable ID: `slate_graphite`

### Industrial Cyanotype

```javascript
{
  sheet: "#0E2238",
  foreground: "#8AA9C7",
  surround: "#3A4148"
}
```

Stable ID: `industrial_cyanotype`

## Persistence and startup behavior

`bridge.js` owns the `chrome.storage.local` key:

```text
selectedPreset
```

Valid stored values are the three stable preset IDs. A missing value is initialized to `warm_drafting`. A corrupted or unknown stored value is repaired to `warm_drafting` and propagated to the MAIN-world engine.

The isolated-world diagnostic controller is:

```javascript
globalThis.__onshapeComfortBridge01
```

Its current methods are:

```javascript
getSelectedPreset()
setSelectedPreset(presetId)
reset()
report()
```

The MAIN-world engine waits up to 1000 ms for settings before falling back to Warm Drafting. If settings arrive before renderer resolution, the desired preset is retained and applied once the renderer becomes ready. Duplicate startup messages are deduplicated so they do not cause duplicate renderer applications.

The MAIN-world report now includes bridge state such as `settingsStatus`, `desiredPreset`, and `lastAttemptedPreset` in addition to renderer state.

## Accepted runtime validation

Named-preset validation remains accepted:

- Warm Drafting applied automatically with exact expected values.
- Slate Graphite and Industrial Cyanotype applied with exact values and immediate redraw.
- An unknown preset returned `false`, preserved the prior state, performed no renderer writes, and requested no redraw.
- Direct custom application succeeded with `activePreset:null`.
- RESTORE returned native renderer values and cleared active theme fields.
- Warm Drafting reapplied after RESTORE.
- Renderer references remained stable throughout.

Persistence validation in fresh and recreated drawing realms established:

- both `persistence-bridge-1` and `persistence-main-1` booted;
- first-run missing storage initialized to `warm_drafting`;
- duplicate first-run messages produced one effective Warm application;
- changing extension storage to `slate_graphite` changed the live drawing immediately;
- closing and reopening the Onshape tab restored Slate Graphite from storage with one effective application;
- no Warm application or 1000 ms fallback preceded the stored Slate application;
- a directly inserted invalid value, `not_a_real_preset`, was detected, repaired to `warm_drafting`, propagated, and applied;
- the stored value after recovery was `warm_drafting`;
- the visible native-white startup frame was less than brief and only noticeable when watched closely.

The Extension storage tree may temporarily appear empty in DevTools after a page reload. Refreshing the DevTools Application view restores discovery; this did not indicate lost extension storage.

## Current phase and next gate

Named presets and persistent preset selection are complete and committed. Documentation reconciliation and a fresh-context branch handoff are the next gates.

After those gates, begin the small preset-selection UI. Do not begin navbar, title-block, persistent white-field, highlight, or custom-color work as part of the UI increment unless HUMAN explicitly expands its acceptance criteria.

The preset UI should use `chrome.storage.local` through extension-context code and preserve the accepted bridge/MAIN-world separation. It should select among the three approved preset IDs, show the stored selection, reject unknown values, and update active matching drawings through the existing storage-change path.

## Product backlog and boundaries

Planned order:

1. Reconcile documentation and create branch handoff.
2. Implement and validate a small preset-selection UI.
3. Run lifecycle regression across reloads and multiple drawing tabs.
4. Pursue Onshape navigation/title-bar theming.
5. Consider optional custom-color UI.

Optional backlog:

- title-block treatment;
- persistent white selectable-field treatment;
- selection/highlight tuning;
- independent dimension color only if a new product need justifies its complexity.

The relationship between title-block/selectable-field behavior and selection-highlight controls is plausible but not established. These items remain optional and must not block the preset UI.

## Remaining unknowns and technical debt

- Onshape private renderer structures may change in future builds.
- Behavior across many simultaneous drawing tabs is not yet broadly validated.
- The brief native-white interval before renderer availability is accepted for now.
- The DOM message bridge is intentionally narrow but not a security boundary.
- The cause of one historical RESTORE stale-pixel observation remains unknown and is not reproducible in the current runtime.
- The cause of one invalid-input-time visual flicker remains unknown; the rejection path performed no extension write or invalidation.
- No automated browser integration suite exists; renderer validation remains controlled live testing with logs and exact readback.

Do not reopen completed renderer archaeology, independent dimension-color research, the historical RESTORE anomaly, or speculative DOM/CSS/SVG approaches without contradictory current-runtime evidence or a newly authorized bounded requirement.
