# Onshape Drawing Comfort Extension — Project State

**Updated:** 2026-09-13  
**Product authority:** HUMAN  
**Manifest version:** 0.1.1  
**Engineering revision:** `named-presets-1`

## Product objective

Improve long-session visual comfort in Onshape drawings by controlling three proven renderer colors through a Chrome extension:

- sheet fill;
- unified foreground for ordinary geometry and dimensions;
- surround behind the sheet.

Unified foreground is the accepted architecture. Independent dimension color is not required for the initial product.

## Filesystem and operational workflow

Chrome loads the unpacked extension from:

```text
C:\Users\swehr\Documents\ONSHAPE DWG THEME EXTENSION
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
→ copy the accepted live file to C:\AI_WORK
→ verify live/Git hashes match
→ commit the synchronized Git copy
```

Do not copy the Git mirror over a live candidate before acceptance; that previously replaced a new candidate with the older validated revision.

## Current accepted baseline

```text
branch: master
commit: fed98993a2a0693651c49c46c9ce8efd996738af
message: Add named drawing theme presets
working tree after commit: clean
```

Accepted file hashes:

```text
manifest.json
1EA4B821EEB2EF12BD181111A3085680D544843AAA0BB9FE4D77D4A91CFE2362

theme.js
2F4C85314E0E1CECE7964E3DE049AC395E999247579EE3EC3D76D88C2FA61CE6
```

The source and live `theme.js` hashes matched before the accepted commit.

## Manifest architecture

The extension remains Manifest V3 version 0.1.1 with minimum Chrome 111. `theme.js` executes in the MAIN world at `document_idle`, in matching Onshape production drawing-editor frames, with `all_frames: true`.

No manifest change was required for the structural resolver, configurable theme engine, or named presets.

## Current engine behavior

The extension:

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

The frozen controller is exposed in the drawing editor realm as:

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

### Warm Drafting — automatic default

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

## Named-preset runtime acceptance

Controlled live testing in a fresh drawing realm established:

- BOOT reported `named-presets-1`.
- Warm Drafting applied automatically with exact expected values.
- The controller exposed all five expected methods.
- `listPresets()` returned the three approved IDs and labels.
- Slate Graphite applied with exact values and immediate redraw.
- Industrial Cyanotype applied with exact values and immediate redraw.
- An unknown preset returned `false`, preserved Cyanotype state and values, and requested no redraw.
- Direct custom application succeeded with `activePreset:null`.
- RESTORE returned the native renderer values and cleared `activePreset` and `activeTheme`.
- Warm Drafting reapplied successfully after RESTORE.
- `sameReferences:true` throughout the sequence.

The named-preset increment is complete.

## Current phase

Documentation reconciliation follows the accepted named-preset commit. After documentation is committed, the next implementation phase is preset persistence and the MAIN/isolated-world bridge.

The intended separation is:

```text
popup/options UI
→ chrome.storage.local
→ isolated-world bridge
→ validated namespaced message/event
→ MAIN-world theme engine
→ Onshape renderer
```

Persistence, messaging, manifest permissions, and UI have not yet been implemented.

## Product backlog and boundaries

Planned order:

1. Preset persistence and bridge handshake.
2. Small preset-selection UI.
3. Lifecycle regression across reloads and drawing tabs.
4. Onshape navigation/title-bar theming.
5. Optional custom-color UI.

Optional backlog:

- title-block treatment;
- persistent white selectable-field treatment;
- selection/highlight tuning;
- independent dimension color only if a new product need justifies its complexity.

The relationship between title-block/selectable-field behavior and selection-highlight controls is plausible but not established. Do not begin renderer or minified-source archaeology for these items during the persistence increment.

## Remaining unknowns and technical debt

- Onshape private renderer structures may change in future builds.
- Behavior across many simultaneous drawing tabs is not yet broadly validated.
- The best bridge transport and startup handshake remain design decisions.
- Stored non-default presets require startup sequencing that avoids an unnecessary Warm-to-stored-theme flash when practical.
- The cause of one historical RESTORE stale-pixel observation remains unknown and is not reproducible in the current runtime.
- The cause of one invalid-input-time visual flicker remains unknown; the rejection path performed no extension write or invalidation.
- No automated browser integration suite exists; renderer validation remains controlled live testing with logs and exact readback.

Do not reopen completed renderer archaeology without contradictory current-runtime evidence.
