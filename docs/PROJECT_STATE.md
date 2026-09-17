# Onshape Drawing Comfort Extension — Project State

**Updated:** 2026-09-17 — accepted V2 promoted to the primary deployed directory and authoritative Git source
**Product authority:** HUMAN
**Manifest version:** 0.2.0
**Authoritative MAIN-world revision:** `note-preview-main-1`
**September 16 baseline MAIN revision:** `persistent-toggle-main-1`
**Work-laptop corroborating MAIN revision:** `note-preview-main-1`
**Isolated-world revision:** `drawing-ui-toggle-bridge-1`
**Drawing CSS revision:** `drawing-ui-toggle-css-1`
**Popup revision:** `preset-popup-toggle-1`

## Product objective

Improve long-session visual comfort in Onshape drawings by controlling three proven renderer colors through a Chrome extension:

- sheet fill;
- unified foreground for ordinary geometry and dimensions;
- surround behind the sheet.

Unified foreground is the accepted architecture. Independent dimension color is not required for the initial product.

## Filesystem and operational workflow

The current primary deployed, known-good V2 extension is:

```text
C:\Users\swehr\Documents\ONSHAPE-COMFORT-EXTENSION-V2
```

The Git-controlled mirror and project documentation are stored in:

```text
C:\AI_WORK\ONSHAPE-COMFORT-EXTENSION
```

Historical backups and Drawing research are under `C:\AI_WORK\ONSHAPE-COMFORT-EXTENSION-BACKUPS`. The former primary-workstation `ONSHAPE-COMFORT-EXTENSION-LIVE` directory is historical only and is preserved there; it is no longer an active deployment directory under Documents. `C:\AI_WORK\BB` is a separate local-agent workspace; its historical backup is not an extension deployment backup. Preserve dated backups as revision snapshots rather than mixing them into the current source tree.

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

## Historical verified baseline — before Drawing UI and On/Off toggle

```text
branch: master
HEAD at that milestone: 6d4cba687e4394d8bbaab86dbaeafb95eb515cea
HEAD message at that milestone: Document preset popup and icons
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

## Preset selection popup

The accepted extension-context popup is implemented by:

```text
popup.html
popup.css
popup.js → preset-popup-2
```

It presents the three stable preset IDs as native radio controls inside full-card labels. Each card contains a code-native miniature drawing preview using the exact accepted sheet, foreground, and surround colors. The popup reads and writes only `chrome.storage.local.selectedPreset`, mirrors storage changes while open, repairs missing or invalid values to `warm_drafting`, reports storage failures visibly, and skips a redundant write when the active preset is selected again.

The popup does not query tabs, message drawing frames, traverse Onshape objects, or duplicate renderer orchestration. Existing `bridge.js` instances observe its storage write and relay the allowlisted preset ID through the accepted path.

The accepted visual design is an approximately 400 × 563 px charcoal panel with three 112 px preview cards, a saved-state footer, and no remote resources or inline script. The split drafting-sheet icon family uses progressively simplified vector geometry at small sizes; the manifest consumes PNG assets at 16, 32, 48, and 128 px while retaining editable SVG masters.

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
→ .navbar-inner
→ .container
```

`.navbar-inner` owns the native white 36-pixel toolbar field through `style.css`; its child `.container` is transparent. A temporary `#333333` background recolored only the toolbar.

Toolbar actions use individual external SVG files through 28 × 28 `.toolbar-button > img` elements. The sampled `hatch_button.svg` used a fixed `#333333` path fill and no `currentColor`, style block, or filter. Applying `brightness(0) invert(80%)` to 16 matched action images produced approximately `#CCCCCC` icons that remained visible on charcoal. Disabled icons remained subdued and blue dropdown indicators remained visible.

Hover boundaries remained readable. The native light selected-tool field reduced icon contrast; HUMAN classified selected-state refinement as wishlist work rather than a blocker. Tooltips remain out of scope.

### Proven Sheets-panel surfaces

The large Sheets field resolves through:

```text
[data-object-name="OsDrawingExplorer"]
→ .content.flyoutContent
```

The blank field's native background was `rgb(250,250,250)`. Its intervening tree containers were transparent. The tree's native `#666666` text was independent of the renderer foreground.

A temporary proof using Industrial Cyanotype's surround `#3A4148` plus neutral UI text `#C8D0D8` materially improved readability. The same background and text treatment worked on the Sheets header and sort tabs while preserving the functional blue active-tab underline. Selected Sheets rows remain imperfect but understandable and are wishlist refinement.

### Proven right-side toggle and Measure surfaces

The right-side flyout group has no common opaque rail. Its containers are transparent and each `.btn.toggleBtn.with-icon` owns its own white 33 × 34 tile and gray border:

```text
.xenon-flyout-widget-container.xenon-flyout-right
→ [data-object-name="flyoutContainerRow"]
→ .toggleButtonContainer
→ .btn.toggleBtn.with-icon
```

A temporary proof matched four tiles and four 20 × 20 external SVG images for Inspection table, Styles, Drawing properties, and MBD status. Tile background `#3A4148`, border `#56616B`, and `brightness(0) invert(80%)` icon filtering produced a coherent dark result. Some multicolor icon definition was lost; HUMAN accepted that tradeoff for these recognizable, lower-frequency functions.

The independent bottom Measure control is:

```text
[data-object-name="btnElementProperties"].measurementBtn.with-icon
→ img
```

It owns a native white 33 × 34 surface, `#CCCCCC` border, and separate 20 × 20 `measure-button.svg` image. The corresponding proof matched one tile and one image and successfully applied the same dark tile, border, and icon-filter treatment.

### Proven shared flyout shell

The right-side content stack contains four direct Xenon flyout panels:

```text
.xenon-flyout-widget-container.xenon-flyout-right
→ [data-object-name="flyoutContentStackedWidget"]
→ .xenon-flyout-widget
```

Observed panel object names:

- `OsInspectionPanelFlyout`;
- `OsStylePropertyFlyout`;
- `OsDrawingPropertyFlyout`;
- `OsMBDStatusPanelFlyout`.

The stack surface accepted `#3A4148` with border `#56616B`. Each panel exposes direct `flyoutHeader`, `flyoutBody`, and `flyoutFooter` regions. Flyout titles resolve under `flyoutHeader` through `[data-object-name="Title"]` and accepted neutral text `#C8D0D8`.

The header has a dynamic sticky state:

```text
[data-object-name="flyoutHeader"].header.headerUnderLineSticky
```

Onshape's sticky rule forces `#FAFAFA !important` plus a blue inset underline. A repeated, equally specific extension override is required to keep the header dark while preserving the useful native blue underline. A shared proof matched five instantiated flyout headers, including two in sticky state.

Temporary rules must be installed in the live Drawing iframe document. After realm recreation, a stale DevTools `$0` can retain an old `ownerDocument`; selecting a fresh element in the live editor restored correct matching. This explains earlier valid selectors returning zero matches.

### Proven shared flyout controls

The following reusable control families were established without generated IDs:

| Surface | Stable selector family | Accepted proof treatment |
| --- | --- | --- |
| Standard dropdown | `select.XeDropdown`, `input.XeDropdown` | `#2F353B` background, `#C8D0D8` text, `#56616B` border |
| Numeric spinbox | `input.XeSpinBox.Wt-spinbox` | same field palette; native spinner background image preserved |
| Body label | direct flyout-body descendants `.XeLabel` | `#C8D0D8` text |
| Checkbox caption | `label.checkbox > input + span` | `#C8D0D8`; disabled `#7F8A94` |
| Hatch/custom dropdown | `.OsDropdown.OsPropertyPanelDropdown` | same field palette; native caret preserved |

The standard dropdown proof matched 14 instantiated controls in the current right-side stack, with one visible in the Inspection panel. The same rule carried into Drawing properties and MBD status. A shared body-label proof matched 28 instantiated labels, three visible in the tested state. Match counts vary because Onshape instantiates some hidden panels and tab contents lazily.

The Styles flyout exposed one visible enabled spinbox during testing. The dark treatment preserved the native increment/decrement affordance. Disabled field colors were provisionally separated as background `#353B41`, text `#7F8A94`, and border `#4A535C`.

### Proven Drawing Properties surfaces

The Drawing properties body uses `.XeDialogSectionTabContainer` for section surfaces and `.XeDialogSectionTabHeader` plus `.XeDialogSectionTabHeaderTitle` for section bars and titles. Successful proofs used:

```text
section/body background: #3A4148
section header:          #50575A
section/title text:      #C8D0D8
field background:        #2F353B
border:                  #56616B
```

The top icon tabs use:

```text
[data-object-name="OsDrawingPropertyTab"]
→ ul.nav-tabs
→ li
→ a
```

The icons are background images rather than child `<img>` nodes, so filtering only the artwork is not available through a simple descendant rule. HUMAN accepted a contrast-preserving compromise: inactive tile `#737A80` with border `#8A9299`, and active tile `#365F78` with border `#6F8798`.

### Proven Inspection and MBD table-panel surfaces

Inspection and MBD share `.os-table-description` filter and section bars. Collapsible rows contain `.OsCollapsibleButton.btn > img` arrows and `.XeLabel.OsCollapsibleText` titles. The shared proof applied `#50575A`, `#C8D0D8`, border `#56616B`, and `brightness(0) invert(80%)` to the arrow images. It matched six instantiated bars and four arrows. HUMAN verified the arrow appearance in both expanded and collapsed positions.

Shared information notices use `.IntimationMessageContainerStyle`. A proof matched six notices and ten descendant labels across Inspection, Styles, and MBD. The accepted notice palette was background `#294B5F`, text `#C8D0D8`, and border `#6F8798`.

After HUMAN added three datums, Inspection exposed both `datumsTable` and `inspectionTable`. Both are Wt table views. Stable cell families are:

```text
body:   .Wt-tv-contents .Wt-tv-c:not(.Wt-delegate-edit)
header: .Wt-header .Wt-tv-c.headerrh
label:  .Wt-header .Wt-label
```

The shared grid proof matched two grids, 70 body cells, and 10 header cells. Body cells accepted `#3A4148` with `#C8D0D8` text; header surfaces accepted `#50575A`; both used border `#56616B`. A populated MBD grid was not available for direct verification, but its empty-panel shell, filter, section bars, notice, and dropdown all followed the shared rules.

Table scrollbars are rendered through CSS pseudo-elements on `.tcontainer`, not separate selectable DOM children. A right-side table-scoped proof used track/corner `#2F353B`, thumb `#68737D`, a two-pixel track-colored thumb border, six-pixel radius, and hover thumb `#7D8A95`. It matched 16 instantiated table scroll containers, four visible, and produced an accepted cohesive result. General flyout-body vertical scrollbars were not separately proved.

### Proven flyout footers

The Styles footer is:

```text
[data-object-name="OsStylePropertyFlyout"]
→ [data-object-name="flyoutFooter"].footerStylePanel
```

It contains `.revertButtonStyle`, `.RevertLabelStyle`, and `.helpStyle`. The proof matched one footer, two icon tiles, and one label. The footer accepted `#3A4148`; the background-image icon tiles used the same medium-gray compromise as the Drawing-property tabs; disabled Revert text used `#7F8A94`.

The Drawing Properties footer is:

```text
[data-object-name="OsDrawingPropertyFlyout"]
→ [data-object-name="flyoutFooter"].templatepanelfooter
→ [data-object-name="OsTemplatePropertiesPanel"]
```

It contains the template-update label, Browse tile, hidden template-name input, Lock drawing properties checkbox, and Help tile. The proof matched one footer, two icon tiles, one update label, and one checkbox caption. The same dark footer and medium-gray icon-tile treatment was accepted; the disabled Lock caption remained intentionally subdued.

### Unrelated native table-click error

Clicking certain Inspection table cells repeatedly produced Onshape's native:

```text
TypeError: Cannot read properties of undefined (reading 'objectName')
```

The stack pointed to Onshape `app.js` mouse handlers. A controlled comparison with the temporary theme disabled reproduced the same error. It is unrelated to the extension CSS proof and is not an extension blocker.

### Accepted UI palette and leading architecture

All accepted preset surrounds are dark and may serve as preset-coherent Drawing-chrome backgrounds:

| Preset | Candidate UI background |
| --- | --- |
| Warm Drafting | `#50575A` |
| Slate Graphite | `#42484E` |
| Industrial Cyanotype | `#3A4148` |

Neutral UI text `#C8D0D8`, field background `#2F353B`, section background `#50575A`, border `#56616B`, and selected field `#365F78` were visually accepted with Industrial Cyanotype. Ordinary external `<img>` icons accepted `brightness(0) invert(80%)`. Background-image icon controls require a medium-gray tile rather than an image-only filter.

The leading deployment hypothesis remains a narrowly scoped Drawing-frame stylesheet, provisionally `drawing-ui.css`. Every selector must be anchored under `.xenon-flyout-widget-container.xenon-flyout-right` or another proven surface root to avoid affecting similarly named left-side controls. If backgrounds follow the selected preset, a bounded isolated-world addition may mirror the validated preset ID into one extension-owned root attribute. `theme.js` must remain the renderer owner and must not absorb DOM styling responsibilities.

## Work-laptop Drawing UI implementation — accepted sandbox candidate

On 2026-09-14, HUMAN authorized a separate deployment trial on the work laptop. This machine was a test/deployment sandbox, not the authoritative Git workstation. At that time the home repository remained at the documented `6d4cba6` baseline; later home consolidation and toggle synchronization are recorded in the closeout section.

Work-laptop paths:

```text
LIVE:
C:\Users\swehrli\Documents\ONSHAPE-COMFORT-EXTENSION-LIVE

baseline recovery copy:
C:\Users\swehrli\Documents\ONSHAPE-COMFORT-EXTENSION-BACKUP
```

Before implementation, all 13 files present in LIVE, including historical `theme_REV0.js`, were copied to BACKUP and verified byte-for-byte. The twelve authoritative implementation files matched the documented accepted baseline hashes. `theme_REV0.js` remained an extra historical file and was not treated as authoritative source.

### Accepted work-laptop file set

The persistent Drawing-chrome implementation changes only the following relative to the pre-UI baseline:

```text
manifest.json     modified — declares drawing-ui.css in the existing ISOLATED Drawing-frame content script
bridge.js         modified — mirrors an already-validated preset ID to data-oce-preset
drawing-ui.css    new — Drawing DOM/CSS ownership layer
```

Renderer and popup ownership remain unchanged:

```text
theme.js          unchanged
popup.html        unchanged
popup.css         unchanged
popup.js          unchanged
icons\             unchanged
```

Accepted work-laptop candidate hashes after `drawing-ui-css-2`:

```text
manifest.json
884FAC5A719CFC62E0CB56A03BA92D12B3E31B368ED2AC8300B527DF2E266ECE

bridge.js
BF8D33B197F12376C5A35453556D9B61C0D65DD5AE48ACF6E49545FA102E0186

theme.js
5EF3FC50283AEE8D660A4A0D018C821682AF061CFDE1A1D217BD1149652D88BA

drawing-ui.css
D68F359B1E13DB104237CC1ACA359106578928C82565D8A0C6DD315C4BDF7E69
```

Accepted work-laptop revision markers:

```text
MAIN:   persistence-main-1
bridge: drawing-ui-bridge-1
UI CSS: drawing-ui-css-2
popup:  preset-popup-2
```

The failed attempt to create a secondary byte-exact recovery copy of the intermediate `drawing-ui-css-1` file did not modify the accepted LIVE candidate. The original complete pre-UI BACKUP remains the recovery boundary on the work laptop. The four final candidate hashes above were re-read after that failed recovery attempt and matched exactly.

### Manifest and bridge increment

`drawing-ui.css` is declared only in the same ISOLATED content-script entry already constrained by:

```text
matches:       https://*.onshape.com/*
include_globs: https://production-drawing-*.onshape.com/editor*
all_frames:    true
run_at:        document_idle
```

`theme.js` remains the separate MAIN-world script and remains byte-identical to the accepted renderer baseline.

The work-laptop bridge adds one DOM-facing responsibility: after the existing preset allowlist has accepted `selectedPreset`, the bridge mirrors that ID onto the Drawing document root as:

```html
<html data-oce-preset="warm_drafting">
<html data-oce-preset="slate_graphite">
<html data-oce-preset="industrial_cyanotype">
```

The marker does not replace validation, storage, messaging, or renderer orchestration. `postSettings()` synchronizes the marker from the already-validated bridge state. Storage/message semantics otherwise remain the accepted persistence design. On storage-initialization failure the marker is removed rather than advertising an unestablished preset.

### Persistent Drawing UI architecture

`drawing-ui.css` owns legacy Drawing-editor DOM/CSS surfaces only. `theme.js` remains the exclusive owner of sheet fill, unified foreground, surround, renderer mutation/readback/rollback, and redraw.

Preset-coherent shell backgrounds use the root marker and the accepted surround colors:

| Preset | Root ID | Drawing UI background |
| --- | --- | --- |
| Warm Drafting | `warm_drafting` | `#50575A` |
| Slate Graphite | `slate_graphite` | `#42484E` |
| Industrial Cyanotype | `industrial_cyanotype` | `#3A4148` |

Supporting UI colors remain stable across presets. Right-side rules remain rooted beneath `.xenon-flyout-widget-container.xenon-flyout-right` unless a separately proven surface root is required, such as the primary toolbar or Sheets explorer. No generated runtime IDs are used in production CSS.

### First persistent deployment result

After Chrome extension reload and Drawing-realm recreation, the first CSS candidate persistently recolored:

- the primary Drawing toolbar and its ordinary external SVG action icons;
- the main Sheets field;
- the four right-side toggle tiles and their external images;
- the independent Measure tile;
- the common flyout shell, ordinary and sticky headers, titles, and bodies;
- standard dropdowns, spinboxes, labels, checkbox captions, and custom Drawing-property dropdowns;
- Drawing Properties section bodies/headers/tabs;
- Inspection/MBD section bars, arrows, notices, populated cells, headers, and proven table scrollbars;
- Styles and Drawing Properties footer shells.

Drawing Properties and MBD were visually accepted. The initial persistent candidate left a small bounded punch list: the Sheets sort tabs, Sheets flyout tile, subdued Sheets view names, unused Inspection table viewport, the Styles Revert label background, Inspection sticky-header remainder, and visible Inspection scrollbars.

### Bounded refinement probes

The stragglers were investigated with read-only DOM/computed-style probes and reversible temporary `<style>` proofs. Generated IDs observed during probes were diagnostic only and were not used in production CSS.

#### Sheets refinements

The sort-tab anchors were established beneath:

```text
[data-object-name="OsDrawingExplorerTab"]
→ ul.nav-tabs
→ li
→ a
```

The independent Sheets flyout toggle was established as:

```text
[data-object-name="flyoutToggleButton_OsDrawingExplorer"]
```

The subdued view labels such as Front/Right/Top/Isometric were established beneath the Sheets root as leaf nodes matching:

```text
[data-object-name="OsDrawingExplorer"]
.xenon-sheet-nondangling-item
[data-object-name="t"]
```

A combined proof matched two sort tabs, one Sheets toggle, and five view-name labels in the tested realm. The tabs retained the native blue active indication while losing their white field; the toggle integrated with the shell; and subordinate view names became clearly readable with neutral UI text.

#### Inspection unused viewport and sticky headers

The unused white Datums viewport was owned by the table-view surface itself rather than the populated cells:

```text
[data-object-name="OsInspectionPanelFlyout"]
.Wt-itemview.Wt-tableview
```

A reversible proof recolored two Inspection table views in the tested state.

The remaining light area beside populated Name/Sheet header cells was established as a separate sticky header container:

```text
.Wt-header.headerrh.tcontainer.inspection-panel-sticky-header
```

A scoped proof under `OsInspectionPanelFlyout` matched two sticky headers, corresponding to Datums and Characteristics. Applying the accepted section/header tone `#50575A` removed the remaining light header field while preserving the table hierarchy.

#### Inspection scrollbar ownership

A live overflow probe distinguished the scrolling owners instead of inferring them from class names.

The populated Characteristics table exposed a `.tcontainer` with:

```text
clientWidth: 698
scrollWidth: 1116
overflow-x: auto
overflow-y: auto
```

The whole Inspection table stack exposed:

```text
[data-object-name="tablesContainerWidget"].stylePanelScrollBar
clientHeight: 701
scrollHeight: 733
overflow-x: auto
overflow-y: auto
```

The final reversible scrollbar proof matched eight table scrollers and one panel scroller in the tested realm. Both families accepted:

```text
width/height: 12px
track/corner: #2F353B
thumb:        #68737D
thumb hover:  #7D8A95
thumb border: 2px solid #2F353B
radius:       6px
```

The previously white scrollbar tracks/corners were eliminated and the resulting Inspection panel was visually accepted.

#### Styles Revert control

The Styles footer itself was already correctly themed. The remaining light rectangle was established as the `.RevertLabelStyle` element retaining a native `rgb(249,249,249)` background. A scoped proof under `OsStylePropertyFlyout` set only that background to transparent and was visually accepted.

### `drawing-ui-css-2` acceptance

The exact successful reversible refinements were consolidated into `drawing-ui-css-2`; no new unproved selector families were added during consolidation. After writing CSS-2, exact hashes established that `manifest.json`, `bridge.js`, and `theme.js` had not changed.

Chrome was then reloaded and a genuinely fresh Drawing realm was created **without reinstalling any DevTools proof styles**. HUMAN visually verified that the permanent CSS alone reproduced the accepted treatment, including:

- toolbar and Sheets surfaces;
- Sheets sort tabs, flyout tile, and view labels;
- Inspection Datums and Characteristics tables;
- unused Inspection viewport;
- both sticky Inspection header fields;
- persistent dark table/panel scrollbars;
- right-side tiles and flyout chrome;
- Drawing Properties;
- Styles;
- MBD;
- the accepted WebGL renderer palette.

Styling also persisted while switching among Drawing tabs/editor realms. This establishes current-runtime persistence across the tested realm reconstruction/tab lifecycle. HUMAN accepted the work-laptop candidate and froze further source edits on that machine.

## Accepted toggle and technical closeout

HUMAN accepted a compact On/Off switch in the popup's upper-right space. The deployed switch persists its state across extension reloads and multiple Drawing tabs, as observed by HUMAN. A read-only workstation audit proved that the six archived toggle-candidate files matched the six Chrome-loaded LIVE files byte for byte. A guarded sync then copied exactly these six accepted LIVE files to Git. The former Git files were copied and verified in `C:\AI_WORK\ONSHAPE-COMFORT-EXTENSION-BACKUPS\Git-pre-toggle-sync-20260915-191826`. All 13 implementation files now match LIVE/Git by SHA-256, and `git diff --check` passed. The seven-file candidate ZIP, including its README, was reviewed against these hashes; Node syntax checks passed for `bridge.js`, `theme.js`, and `popup.js`.

The popup uses a keyboard-accessible checkbox switch and writes only `chrome.storage.local.enabled`. `selectedPreset` remains the saved palette. Missing or invalid `enabled` values repair to `true`, so upgrades retain the prior ON behavior. OFF retains the selected radio, disables/mutes palette cards, and shows the paused status; ON applies the saved palette. The isolated-world bridge validates and relays the `{ selectedPreset, enabled }` pair and mirrors `data-oce-enabled="true|false"` on the Drawing root. All 62 CSS rule groups require the enabled root marker, so OFF releases Drawing DOM styling to Onshape. When an already themed realm transitions OFF, MAIN-world `theme.js` calls its internal reversible renderer `restore()` and requests redraw; a newly paused realm avoids a theme mutation. The public `restore()` retains its separate permanent-stop behavior. These are source findings; HUMAN's live observation establishes successful persistence and visual behavior across the tabs/reloads tested, without claiming every renderer readback was captured for the toggle.

| File | Accepted LIVE, candidate, and synchronized Git SHA-256 |
| --- | --- |
| `bridge.js` | `80CFD4DFB3B69436E69DBE620EFB3E19AF329F86290BC811BECA15978BB569A4` |
| `theme.js` | `1BC69A4C4CFD370316454F33F354CD92ED7F29E3864F1126799DF6C2A58A807F` |
| `drawing-ui.css` | `92ABBAFC4AC69D633BAB631942C21EFDFFCD7BBB2B881E7242E4A6FD33A36CFE` |
| `popup.html` | `F8FF29DCC7FAA11BF86825CE5C3B1BE4762562FAB99F19C41580FD6DFC2F02D8` |
| `popup.css` | `69A020C198476ADE5AA606FCB35AEFF0F2E0775EA3BB279986981F78AE4B39B3` |
| `popup.js` | `FD0CCCBA1BE23D21816D962130330E90313E02A7CC7E604336A6DE35041181AC` |

The unchanged `manifest.json` is `884FAC5A719CFC62E0CB56A03BA92D12B3E31B368ED2AC8300B527DF2E266ECE`; the six icons retain the hashes in the historical baseline above. The archived `TOGGLE_CANDIDATE_README.md` is 3,530 bytes and hashes to `9E7D14FA168D541C18624FB0CA1409F76E5DC0ADFB68CDC081C06A33C258C69C`.

The six implementation files were committed on `master` as `3cdff15fafecd11cefd5e6ca2e6a8e2479638b03` (`Add persistent Drawing comfort toggle`), with 335 insertions and 135 deletions. Before that commit, HEAD was `73cef83808973c93272c2d92bcf52065ba5351bf` (`Preserve native detail in selected Drawing icons`). The workstation checked manifest version 0.1.1, Node syntax for the three changed JavaScript files, exact LIVE/Git hashes, staged file names, and `git diff --cached --check` before committing. The implementation commit left only `docs/PROJECT_STATE.md` and `docs/RENDERER_FINDINGS.md` modified. This document describes the accepted implementation commit; the documentation commit ID is recorded separately by Git after these files are committed.

The September 16 product baseline remains technically closed and accepted for personal use at commit `3cdff15fafecd11cefd5e6ca2e6a8e2479638b03`. Subsequent bounded V2 work did not invalidate that historical closeout. The title-block branch has been closed without production implementation, while the separately scoped active-Note preview problem produced the accepted V2 implementation described below. On September 17, byte parity between the primary deployed V2 and work-laptop transfer was established before that V2 was promoted into authoritative Git; this is a later integration milestone, not a rewrite of the September 16 baseline.

The current implementation can be shared on its accepted feature set with the repository's `README.txt`, developer roadmap in `AGENTS.md`, and BSD Zero Clause License in `LICENSE.txt`. The README documents installation, known limitations, reliance on undocumented Onshape internals, and best-effort support. No publication or public repository is claimed here.

The 2026-09-14 sandbox hashes and `6d4cba6` remain historical milestones. Neither is the verified September 16 toggle baseline.

## Closed title-block research branch — no production implementation

The September 15–16 title-block investigation established that the visible pale field backgrounds and the broad selected-field band are renderer-owned surfaces with narrow reversible color seams. The pale field geometry was observed as direct-color `#E0E0E0` (`0xC2E0E0E0`) rather than palette-index-7 output; an instance-only draw-argument override recolored it without changing the sheet, ordinary geometry, selection band, or grips. The selected-field band was traced through `CFxHighlightTracker` / `XeEntityPreview`; changing only the existing selected-field preview decoration recolored that band independently and restoration succeeded. These experiments proved *mechanical color feasibility*, not a production-safe title-block classifier.

A guarded Stage A was then authorized specifically to establish a defensible title-field discriminator before any V2 source edit. That gate failed. Editable fields and sampled static title-block text shared `XeText` / `AcDbMText`, generic `_CLIENTEDIT` behavior, `editorType: 1`, paper-space ownership, and overlapping style/entity characteristics. `Onshape-Standard-Fields` remained a useful correlation but did not prove semantic title-field ownership; owner block `*Paper_Space` was also generic. No safely queryable combination of entity class, layer, owner, paper-space membership, editability, editor type, or observed style established the isolation standard required by the project.

Therefore the correct closeout is **not** “the pixels cannot be recolored.” It is: **no defensible production classifier was established that can guarantee the extension is recoloring only the intended title-block fields/highlights.** Stage A stopped at guard validation, no title-block source change was installed, and Stage B was not opened. The pre-stage backup was created, but `theme.js` remained the accepted September 16 value `1BC69A4C4CFD370316454F33F354CD92ED7F29E3864F1126799DF6C2A58A807F`. All temporary runtime probes were cleaned up.

This branch is closed as **technically color-feasible but product-infeasible under the current isolation standard**. Do not reopen title-block Stage A/B, generic selection/highlight archaeology, or style-based title-field heuristics unless a future Onshape API/runtime change exposes a genuinely semantic discriminator or HUMAN explicitly authorizes a weaker scoping rule.

## Accepted V2 active-Note preview implementation — `note-preview-main-1`

A separate bounded investigation addressed the transient black text shown while creating or editing an ordinary Drawing Note. Unlike the title-block branch, this investigation found a deterministic editor-owned runtime seam. CDP reached the cross-origin production Drawing execution context directly and established that active Note text is transient WebGL geometry, not the offscreen DOM input delegate.

The preview appears in `getXeApplication().m_XeDocuments[0].m_XeGsDevice.m_Chunks` as `XeGsSimpleChunk` objects containing `XeGsTextItem` glyph geometry. Tested preview chunks carried `m_TrackerName = "CFxNoteEditorTracker"`, `m_Owner = -2`, `m_OwnerBlock = "0"`, and `m_Type = "WS"`. Chunk identity is intentionally treated as ephemeral: typing can destroy one preview chunk and replace it with multiple new chunks. The chunk collection's `Update_XeGsGeometryChunks` event provides event-driven reacquisition without polling.

Controlled runtime proof changed only qualifying preview chunks' `m_Color`, called `invalidateServerTrackers()`, and visibly changed only the active typed Note text. The diagnostic color did not persist into the committed Note. Reopening the committed Note created fresh native preview geometry. The implementation therefore preserves the existing committed-note and palette-index-7 behavior rather than changing Note data.

ASTRA implemented the guarded prototype solely in V2 `theme.js` as revision `note-preview-main-1`. The implementation uses active Note-editor/command guards, strict `CFxNoteEditorTracker` filtering, `Update_XeGsGeometryChunks` reacquisition, per-object original-color retention, restoration/release of replaced objects, `invalidateServerTrackers()` redraw, and listener cleanup on OFF/Restore/page lifecycle. No polling, prototype override, or palette-index-7 redesign was introduced.

V2 `theme.js` transition:

```text
pre-Note accepted baseline:
1BC69A4C4CFD370316454F33F354CD92ED7F29E3864F1126799DF6C2A58A807F

accepted Note-preview V2:
43FDAAFB66C9B110312B4DA6FA7F1E519484536E19DEF21600EAF0961AFCD5FC
```

ASTRA's live acceptance matrix passed Warm Drafting, Slate Graphite, Industrial Cyanotype, existing-Note editing, commit isolation, live preset changes while the editor remained open, OFF restoration, ON reacquisition, and reload/realm replacement without listener accumulation. An explicit-color probe produced distinct black and red preview runs (`0xC2000000` and `0xC2FF0000`); V2 captured and restored each object's actual original color independently, and commit/reopen preserved the native explicit colors. At final instrumented closeout the editor was closed with zero retained preview objects and no runtime instrumentation remaining.

HUMAN then visually accepted the feature on the primary workstation and physically transferred the V2 folder to the work laptop. The work-laptop V2 was loaded and the revised Note editor was again confirmed functional through the established presets/toggle/tab/reload behavior. This provides independent cross-machine HUMAN acceptance of the implementation.

Remaining Note-specific UNKNOWN items are exhaustive formatting combinations, exhaustive print/PDF/export behavior, and future compatibility of these private Onshape interfaces. The commit-isolation evidence strongly supports presentation-only ownership but does not convert untested output paths into established facts.

Primary-workstation consolidation verified the complete authoritative implementation set against the work-laptop V2 transfer, promoted the accepted primary V2 bytes into Git, and completed local syntax, manifest, hash, and diff validation. No further renderer archaeology is required unless later filesystem evidence or HUMAN testing contradicts the established model.

## 2026-09-17 work-laptop promotion and transfer closeout

Read-only inventory on the work laptop found no current authoritative Git checkout under `C:\Users\swehrli\Documents`. The only Git repository available was the explicitly historical USB baseline:

```text
D:\ONSHAPE-COMFORT-EXTENSION-REPO_BASELINE_20260914_29cd918
HEAD: 29cd918ecbbc3f672def78a64dbe19c931aac143
message: Document Drawing chrome investigation
```

That repository predates the accepted Drawing UI/toggle baseline and was preserved without modification. Under the release instructions this was Case B, so no Git commit was created on the work laptop; commit `3cdff15fafecd11cefd5e6ca2e6a8e2479638b03` remained the latest documented authoritative implementation commit until the later primary-workstation V2 integration.

The complete non-backup file sets in local V2 and USB V2 were byte-identical. Both accepted V2 `theme.js` files were 19,385 bytes and hashed to:

```text
43FDAAFB66C9B110312B4DA6FA7F1E519484536E19DEF21600EAF0961AFCD5FC
```

Source review confirmed that `note-preview-main-1` materially matches the accepted architecture documented above. Node syntax checking passed before work-laptop promotion. The work-laptop production LIVE manifest remained at version `0.1.1` with SHA-256 `884FAC5A719CFC62E0CB56A03BA92D12B3E31B368ED2AC8300B527DF2E266ECE`. The later authoritative primary V2 and corroborating V2 transfer instead agree on the accepted version `0.2.0` manifest with SHA-256 `AB7E5B4825158FB771185E8239B1E6C305AF665FA52E5536F262180F126B4A0C`; that complete V2 implementation set was promoted to Git during final consolidation.

Before promotion, the exact production `theme.js` was copied to:

```text
C:\Users\swehrli\Documents\Codex\2026-09-17\from-sol-chat-to-codex-gpt\outputs\ONSHAPE-COMFORT-RECOVERY-pre-note-promotion-20260917-071741\theme.js
```

The source and recovery copy both hashed to the pre-Note value `1BC69A4C4CFD370316454F33F354CD92ED7F29E3864F1126799DF6C2A58A807F`. Only `theme.js` was then promoted into:

```text
C:\Users\swehrli\Documents\ONSHAPE-COMFORT-EXTENSION-LIVE
```

The promoted LIVE file is byte-identical to the accepted local/USB V2 candidate and hashes to `43FDAAFB66C9B110312B4DA6FA7F1E519484536E19DEF21600EAF0961AFCD5FC`. All other 12 production implementation files retained the accepted September 16 hashes.

A fresh Drawing realm reported `note-preview-main-1`, exact Warm Drafting renderer readback, and successful Apply/redraw. HUMAN-visible browser smoke showed readable themed active-Note text, continued typing through preview replacement, and successful cancellation with the temporary uncommitted Note removed and no Note-preview runtime errors logged. Chrome's automation boundary did not permit operating `chrome://extensions`, so an automated click of the unpacked-extension Reload control and a complete popup-driven OFF/ON/preset matrix were not re-executed during this consolidation. This does not replace the already established cross-machine HUMAN acceptance; it records the narrower evidence produced during work-laptop promotion.

The primary-workstation transfer set is:

```text
ONSHAPE-COMFORT-EXTENSION-PRIMARY-TRANSFER-20260917\theme.js
ONSHAPE-COMFORT-EXTENSION-PRIMARY-TRANSFER-20260917\docs\PROJECT_STATE.md
ONSHAPE-COMFORT-EXTENSION-PRIMARY-TRANSFER-20260917\docs\RENDERER_FINDINGS.md
```

That historical transfer set intentionally excluded the V2 manifest and unchanged implementation files. Final primary-workstation consolidation instead compared all 13 authoritative implementation files, established byte parity between primary V2 and the work-laptop V2 transfer, promoted the complete accepted V2 set into Git, and verified primary/Git byte parity before commit.

## Product backlog and boundaries

Optional polish remains intentionally outside the accepted Drawing UI increment:

- open native dropdown-list rendering;
- exhaustive hover/focus/active/selected/disabled tuning;
- toolbar selected-state refinement;
- Sheets selected-row refinement;
- populated MBD-grid confirmation if a suitable live state becomes available;
- title-block/persistent-field implementation is closed under the current isolation standard; do not reopen without new semantic evidence or explicit HUMAN authorization;
- generic canvas selection/highlight archaeology remains closed; the proven title-field preview color seam is not a safe global selection-color rule;
- independent dimension color only if a new product requirement justifies reopening it.

The work-laptop implementation proved the general Inspection table-stack scrollbar owner as well as table scrollers, so the prior uncertainty about that specific panel scrollbar is closed for the tested runtime. Do not generalize that evidence to every unrelated flyout scrollbar without a bounded observation.

## Remaining unknowns and technical debt

- Onshape private renderer and legacy DOM structures may change in future builds.
- Behavior across many simultaneous Drawing tabs is not exhaustively validated, although multiple Drawing realms/tabs were successfully exercised on the work laptop.
- The brief native-white renderer interval before renderer availability remains accepted.
- Open native dropdown lists and every interactive state have not been exhaustively tested.
- A populated MBD grid was not available for direct proof during the original investigation.
- The DOM message bridge remains an application coordination boundary, not a privileged security boundary.
- The cause of one historical RESTORE stale-pixel observation remains unknown and is not reproducible in the current runtime.
- The cause of one historical invalid-input-time visual flicker remains unknown; the rejection path performed no extension write or invalidation.
- Active-Note preview exhaustive formatting combinations and exhaustive print/PDF/export behavior are not tested; private `CFxNoteEditorTracker` / chunk-event internals may change in future Onshape builds.
- No automated browser integration suite exists; renderer and DOM validation remain controlled live testing with logs, exact hashes/readback, bounded probes, and HUMAN visual acceptance.

Do not reopen completed renderer archaeology, title-block Stage A/B, generic selection/highlight archaeology, independent dimension-color research, or the historical RESTORE anomaly without contradictory current-runtime evidence or a newly authorized bounded requirement. Do not use generated IDs, unscoped iframe-wide selectors, or recursive full-DOM expansion. Keep renderer ownership in `theme.js` and Drawing DOM styling in `drawing-ui.css`.
