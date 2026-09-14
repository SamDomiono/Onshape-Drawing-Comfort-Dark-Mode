# Onshape Drawing Comfort Extension â€” Project State

**Updated:** 2026-09-14
**Product authority:** HUMAN
**Manifest version:** 0.1.1
**MAIN-world revision:** `persistence-main-1`
**Isolated-world revision:** `persistence-bridge-1`
**Popup revision:** `preset-popup-2`

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
â†’ edit the Chrome-loaded Documents copy
â†’ reload the extension and recreate the drawing realm
â†’ perform bounded live acceptance tests
â†’ copy the accepted live files to C:\AI_WORK
â†’ verify live/Git hashes match
â†’ commit the synchronized Git copy
```

Do not copy the Git mirror over a live candidate before acceptance; that previously replaced a new candidate with the older validated revision.

## Current accepted baseline

```text
branch: master
current HEAD: 6d4cba687e4394d8bbaab86dbaeafb95eb515cea
current HEAD message: Document preset popup and icons
accepted implementation commit: c54141024aab40f4ec57d575870db32cb1eb9a32
accepted implementation message: Add preset selection popup and icons
last verified worktree: clean
```

Accepted live/source hashes at the commit:

```text
manifest.json
1AA0A67CD8BAF2A53E1FFC289441A3206DF584E128A6B1C217DD55E3D1363D9D

bridge.js
ABAB436B10B65E5463F30B40C42BDCFB5BB1DB75848F39CDAC1AD857D5A08E97

theme.js
5EF3FC50283AEE8D660A4A0D018C821682AF061CFDE1A1D217BD1149652D88BA

popup.html
24519025C2132D0D95C11B551FF8A5A5EBF6EBB5B6E745647DA16D9DB39A15EE

popup.css
5A04E4F61FFB8CEC6190DB1FA98BEDD3B28213363F2115AB56C5AADC91FC0ED9

popup.js
16EA6F89B893286BE17E03B406567E26F4A697240EF54D6801ABF1B190689F94

icons\icon16.png
A6B7FBB97A23EB2AE2B4ACC3611105F4DEA9B9D01CA6ECE79304863473C50F2A

icons\icon32.png
363E083FC33B8A7AB7AE9C4A8A53E834C9F3AE6CB61FEA22D07CA7E330068A30

icons\icon48.png
BB71828579596077104E8028244D1D6082EBE4379FEEB51BA04807F11A5D3F49

icons\icon128.png
8B44812AA6C848430C275DF4C0C5BAFE37178F2B178138ECF8595D0405652B3D

icons\icon-master.svg
BF13AA3C45CE2B6D01970745DA034C86AA03B544E0858148EEC16BE32408F524

icons\icon-small.svg
D1E1B0395E091D95110DE81A4F9CDFBF3BDD42F0EFD0BC29E39AF2B7D5AA2D4F
```

All twelve authoritative live files matched their Git-mirror copies byte for byte before the UI commit. The exact ten-file UI and icon set was staged, `git diff --cached --check` passed, the commit completed successfully, the temporary development directory was removed, and the worktree was clean at `c541410`.

The popup/icon documentation reconciliation was subsequently committed at `6d4cba6`. A later read-only commissioning check established branch `master`, exact HEAD `6d4cba6`, a clean worktree, matching live/Git hashes for all twelve authoritative implementation files, and the expected three revision markers. The Drawing-chrome investigation described below did not modify extension files, the live directory, or the Git mirror.

## Manifest and execution architecture

The extension remains Manifest V3 version 0.1.1 with minimum Chrome 111. It requests the `storage` permission, declares a toolbar action with `popup.html`, provides 16/32/48/128 px icons, and loads two scripts at `document_idle` in matching Onshape production drawing-editor frames with `all_frames: true`:

```text
bridge.js â†’ ISOLATED world
theme.js  â†’ MAIN world
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

### Warm Drafting â€” default

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

## Preset selection popup

The accepted extension-context popup is implemented by:

```text
popup.html
popup.css
popup.js â†’ preset-popup-2
```

It presents the three stable preset IDs as native radio controls inside full-card labels. Each card contains a code-native miniature drawing preview using the exact accepted sheet, foreground, and surround colors. The popup reads and writes only `chrome.storage.local.selectedPreset`, mirrors storage changes while open, repairs missing or invalid values to `warm_drafting`, reports storage failures visibly, and skips a redundant write when the active preset is selected again.

The popup does not query tabs, message drawing frames, traverse Onshape objects, or duplicate renderer orchestration. Existing `bridge.js` instances observe its storage write and relay the allowlisted preset ID through the accepted path.

The accepted visual design is an approximately 400 Ã— 563 px charcoal panel with three 112 px preview cards, a saved-state footer, and no remote resources or inline script. The split drafting-sheet icon family uses progressively simplified vector geometry at small sizes; the manifest consumes PNG assets at 16, 32, 48, and 128 px while retaining editable SVG masters.

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

Popup and icon acceptance established:

- the stored preset was selected correctly when the popup opened;
- all three full cards changed the active drawing immediately through the existing storage path;
- the footer and selection indicator followed Warm Drafting, Slate Graphite, and Industrial Cyanotype;
- the popup proportions, previews, behavior, and overall visual design were accepted by HUMAN;
- the toolbar icon deployed after Chrome restart and remained plainly visible against HUMAN's dark Chrome theme;
- the split warm/cyan field remained the primary icon signal at toolbar size;
- `bridge.js` and `theme.js` remained byte-identical to the persistence baseline.

The Extension storage tree may temporarily appear empty in DevTools after a page reload. Refreshing the DevTools Application view restores discovery; this did not indicate lost extension storage.

## Drawing editor chrome research

The next authorized product expansion is the **Drawing editor chrome** surrounding the WebGL canvas, not the already-dark global Onshape document header. Read-only DOM/CSS inspection and temporary reversible Console mutations established that the Drawing editor receives `theme=dark` in its iframe URL but retains a legacy light Wt/Xenon interface.

No extension source or Git-controlled file was modified during these proofs. Recreating the Drawing editor realm cleared the temporary mutations and the stored Industrial Cyanotype preset reapplied normally.

### Proven toolbar surfaces

The primary toolbar is ordinary DOM inside the Drawing `editor` iframe:

```text
.xenon-menu.xenon-toolbar.navbar.active-toolbar
â†’ .navbar-inner
â†’ .container
```

`.navbar-inner` owns the native white 36-pixel toolbar field through `style.css`; its child `.container` is transparent. A temporary `#333333` background recolored only the toolbar.

Toolbar actions use individual external SVG files through 28 Ã— 28 `.toolbar-button > img` elements. The sampled `hatch_button.svg` used a fixed `#333333` path fill and no `currentColor`, style block, or filter. Applying `brightness(0) invert(80%)` to 16 matched action images produced approximately `#CCCCCC` icons that remained visible on charcoal. Disabled icons remained subdued and blue dropdown indicators remained visible.

Hover boundaries remained readable. The native light selected-tool field reduced icon contrast; HUMAN classified selected-state refinement as wishlist work rather than a blocker. Tooltips remain out of scope.

### Proven Sheets-panel surfaces

The large Sheets field resolves through:

```text
[data-object-name="OsDrawingExplorer"]
â†’ .content.flyoutContent
```

The blank field's native background was `rgb(250,250,250)`. Its intervening tree containers were transparent. The tree's native `#666666` text was independent of the renderer foreground.

A temporary proof using Industrial Cyanotype's surround `#3A4148` plus neutral UI text `#C8D0D8` materially improved readability. The same background and text treatment worked on the Sheets header and sort tabs while preserving the functional blue active-tab underline. Selected Sheets rows remain imperfect but understandable and are wishlist refinement.

### Proven right-side toggle surfaces

The right-side flyout group has no common opaque rail. Its containers are transparent and each `.btn.toggleBtn.with-icon` owns its own white 33 Ã— 34 tile and gray border:

```text
.xenon-flyout-widget-container.xenon-flyout-right
â†’ [data-object-name="flyoutContainerRow"]
â†’ .toggleButtonContainer
â†’ .btn.toggleBtn.with-icon
```

A temporary proof matched four tiles and four 20 Ã— 20 external SVG images for Inspection table, Styles, Drawing properties, and MBD status. Tile background `#3A4148`, border `#56616B`, and `brightness(0) invert(80%)` icon filtering produced a coherent dark result. Some multicolor icon definition was lost; HUMAN accepted that tradeoff for these recognizable, lower-frequency functions.

The separate bottom Measure tile was not matched and remains a bounded follow-up target.

### Emerging UI palette and architecture

All accepted preset surrounds are dark and may serve as preset-coherent Drawing-chrome backgrounds:

| Preset | Candidate UI background |
| --- | --- |
| Warm Drafting | `#50575A` |
| Slate Graphite | `#42484E` |
| Industrial Cyanotype | `#3A4148` |

Neutral UI text `#C8D0D8` and filtered ordinary icons near `#CCCCCC` can remain constant across all three presets. The provisional border is `#56616B`; a provisional selected-state field is `#365F78`, not yet selector-verified or accepted.

The leading deployment hypothesis is a narrowly scoped Drawing-frame stylesheet. If UI backgrounds follow the selected preset, a future bounded isolated-world addition may mirror the already validated preset ID into one extension-owned root attribute for CSS selectors. `theme.js` must remain the renderer owner and must not absorb DOM styling responsibilities.

## Current phase and next gate

Named presets, persistent preset selection, the preset-selection popup, and the split drafting-sheet icon family are complete and committed. Read-only commissioning and the Drawing toolbar/Sheets/right-toggle DOM/CSS proofs are complete.

The next primary gate is mapping and temporarily recoloring the content of the flyout panels themselves, beginning with the open **Drawing properties** panel. Its native-white title, tabs, section headers, form rows, fields, checkboxes, scrollbar, and footer should be inspected in layers. Establish shared semantic selectors before proposing implementation or applying broad rules.

The separate Measure tile is the secondary target. Toolbar selected-state and Sheets selected-row tuning remain wishlist work. ASTRA is not yet justified; bounded DevTools inspection remains sufficient.

## Product backlog and boundaries

Planned order:

1. Map and prove the shared flyout-panel body, header, section, field, and text surfaces.
2. Identify and recolor the independent bottom Measure tile.
3. Decide whether a static neutral shell or preset-coherent backgrounds should be implemented.
4. Propose the smallest Drawing-frame CSS and optional preset-marker architecture.
5. Consider selected-state refinement and optional custom-color UI only after the primary chrome surfaces are accepted.

Optional backlog:

- title-block treatment;
- persistent white selectable-field treatment;
- Drawing toolbar and Sheets-row selected/highlight tuning;
- independent dimension color only if a new product need justifies its complexity.

The relationship between title-block/selectable-field behavior and selection-highlight controls is plausible but not established. These items remain optional and must not reopen the accepted popup increment.

## Remaining unknowns and technical debt

- Onshape private renderer structures may change in future builds.
- Behavior across many simultaneous drawing tabs is not yet broadly validated.
- The brief native-white interval before renderer availability is accepted for now.
- The DOM message bridge is intentionally narrow but not a security boundary.
- Exact shared selectors for flyout-panel bodies, headers, sections, fields, and scrollbars remain unknown.
- The Measure tile's exact semantic container remains unknown.
- Static-CSS behavior across every Drawing SPA reconstruction is not yet established.
- The cause of one historical RESTORE stale-pixel observation remains unknown and is not reproducible in the current runtime.
- The cause of one invalid-input-time visual flicker remains unknown; the rejection path performed no extension write or invalidation.
- No automated browser integration suite exists; renderer validation remains controlled live testing with logs and exact readback.

Do not reopen completed renderer archaeology, independent dimension-color research, or the historical RESTORE anomaly without contradictory current-runtime evidence or a newly authorized bounded requirement. Continue Drawing-chrome work through the established bounded DOM/computed-style/reversible-proof methodology; do not recursively expand the full Drawing DOM or use generated IDs as production selectors.
