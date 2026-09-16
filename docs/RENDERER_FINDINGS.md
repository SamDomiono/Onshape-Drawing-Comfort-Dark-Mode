# Onshape Drawing Comfort Extension — Renderer Findings

**Updated:** 2026-09-16 — accepted toggle implementation and technical closeout
**Current accepted MAIN revision:** `persistent-toggle-main-1`
**Current accepted bridge revision:** `drawing-ui-toggle-bridge-1`
**Current accepted Drawing CSS revision:** `drawing-ui-toggle-css-1`
**Current accepted popup revision:** `preset-popup-toggle-1`

## Evidence language

- **ESTABLISHED:** Directly supported by current source, captured source paths, exact runtime readback, or HUMAN's visual observation.
- **INFERRED:** A conclusion one step beyond direct evidence, with its basis stated.
- **UNKNOWN:** Required evidence is missing, historical, contradictory, or not captured.

## Accepted renderer architecture

The accepted product exposes three user-facing standard-RGB controls:

```text
sheet fill
+ unified foreground for geometry and dimensions
+ surround behind the sheet
```

These controls do not share one renderer-native representation. Standard `#RRGGBB` is the public boundary; conversion occurs inside MAIN-world `theme.js`.

The earlier persistence and preset-popup increments did not change any accepted renderer resolver, representation, mutation, verification, rollback, or redraw path. Source review of the accepted toggle increment established a reversible internal `restore()` call on OFF without changing the existing renderer resolver, representation, mutation/readback/rollback, or redraw mechanism. The public `restore()` remains a permanent stop for that realm.

## Surround

**ESTABLISHED path:**

```text
doc.m_XeDatabase.m_XeLayout.m_Paper.m_PaperBackColor
```

**ESTABLISHED representation:** `0xBBGGRR`.

The downstream path established by prior source inspection is:

```text
getPaperBackColor()
→ clearScreen(renderer, value, 1)
→ renderer.setClearColor(value, alpha)
→ THREE.Color.set(number)
→ THREE.Color.setHex(number)
→ gl.clearColor(...)
```

Example:

```text
human #50575A → renderer 0x5A5750 → 5920592
```

## Sheet fill

**ESTABLISHED path:**

```text
doc.m_XeDatabase.m_XeLayout.m_Paper.m_Scene.children
→ material.shader.shaderName === "PaperOptimized"
→ xegltype === 4
→ material.uniforms.color
```

**ESTABLISHED representation:** normalized RGB array `[R/255, G/255, B/255]`.

The structural resolver requires:

- exactly one `PaperOptimized` object with `xegltype === 4`, used as the sheet fill;
- at least one `PaperOptimized` object with `xegltype === 1`, used as the expected outline companion;
- a valid three-channel normalized color array on the selected fill material.

The former brightness heuristic has been removed. Current identity checks retain and revalidate the fill mesh type, shader name, material identity, and uniform-array identity.

## Unified foreground

**ESTABLISHED path:**

```text
doc.m_XeGsDevice.getPalette().getPalette()[7]
```

**ESTABLISHED representation:** `0xBBGGRR`.

Example:

```text
human #3F3D38 → renderer 0x383D3F → 3685695
```

Palette index 7 controls ordinary drawing geometry and the sampled dimensions. Prior chunk inspection found the sampled visible dimension chunks using ByACI 7. That sample does not prove identical behavior for every possible Onshape entity, but controlled visual testing established the unified foreground as sufficient for the current product.

## Mutation and rollback boundary

The current transaction is:

```text
validate and encode complete theme
→ verify retained renderer identity
→ snapshot current renderer values
→ write foreground, sheet, and surround
→ verify exact readback
→ update status, activePreset, and activeTheme
→ request redraw
```

Malformed custom themes and unknown preset IDs are rejected before renderer mutation. Controlled named-preset testing established that unknown-preset rejection returns `false`, preserves status and active values, performs no writes, and requests no redraw.

If mutation/readback fails after writing begins, the engine attempts per-control rollback to the immediately preceding snapshot. If redraw alone throws after exact writes have been verified, the engine reports the redraw failure without undoing the verified colors.

## Redraw

**ESTABLISHED path:**

```javascript
doc.m_XeGsDevice.invalidateScene()
```

Controlled current-runtime tests repeatedly produced immediate APPLY and RESTORE redraws without zoom, pan, click, resize, or other drawing interaction.

An earlier exploratory session reported restored renderer values with stale themed pixels until interaction. Two later controlled cycles, including a recreated editor realm, did not reproduce that behavior. Its historical cause is **UNKNOWN**. Do not resume redraw archaeology unless the problem recurs under controlled current-runtime conditions.

## Named-preset live readback

### Warm Drafting

```text
ink:      3685695
paper:    [0.8470588235294118, 0.8156862745098039, 0.7372549019607844]
surround: 5920592
```

### Slate Graphite

```text
ink:      10787474
paper:    [0.11372549019607843, 0.12549019607843137, 0.13725490196078433]
surround: 5130306
```

### Industrial Cyanotype

```text
ink:      13085066
paper:    [0.054901960784313725, 0.13333333333333333, 0.2196078431372549]
surround: 4735290
```

### Native RESTORE snapshot in the tested realm

```text
ink:      0
paper:    [1, 1, 1]
surround: 14474460
```

All tested preset transitions and RESTORE retained `sameReferences:true`.

## Persistence orchestration boundary

Renderer mutation remains entirely in MAIN-world `theme.js`. Isolated-world `bridge.js` cannot and does not traverse the Onshape renderer. Its responsibilities are limited to validating and storing a stable preset ID and relaying that setting to the MAIN world. Extension-context `popup.js` is an additional validated writer of the same `selectedPreset` storage key; it does not message or traverse drawing frames.

**ESTABLISHED startup path:**

```text
chrome.storage.local selectedPreset
→ isolated-world bridge validation
→ versioned same-window message
→ MAIN-world desiredPreset
→ renderer-ready application through applyPreset()
```

The MAIN world waits up to 1000 ms for settings, retains settings that arrive before renderer resolution, and falls back to Warm Drafting only if no valid settings message arrives. Duplicate startup messages are accepted at the protocol boundary but deduplicated before effective renderer mutation.

The message protocol validates channel, protocol version, direction, type, `event.source === window`, same origin, and the exact preset-ID allowlist. Because page scripts can observe or imitate DOM messages, this is not a privileged security boundary. It is sufficient for the non-sensitive local preset selection transported here.

## Persistence live validation

**ESTABLISHED by logs, storage inspection, and HUMAN's visual observation:**

- First-run missing storage initialized to `warm_drafting`.
- Duplicate first-run bridge messages resulted in one effective Warm application.
- Editing `selectedPreset` to `slate_graphite` propagated immediately and produced exact Slate renderer readback.
- Closing and reopening the Onshape tab loaded Slate from storage and produced one effective Slate application.
- The persisted Slate startup contained no intervening Warm application and no settings fallback.
- The native-white interval before the renderer became available was less than brief and only detectable while watching for it.
- Direct storage corruption with `not_a_real_preset` was detected and repaired to `warm_drafting`.
- The repaired value propagated through the standard settings path and produced exact Warm renderer readback.
- DevTools could temporarily show no extension storage after page reload; refreshing the Application panel restored the tree without storage loss.

These findings establish persistence orchestration without changing the accepted renderer architecture.

## Popup-path live validation

**ESTABLISHED by source, stored-value behavior, and HUMAN's visual observation:**

- `preset-popup-2` presents exactly the three accepted stable preset IDs.
- Opening the popup reflects the stored selection.
- Selecting each card writes the selected stable ID to `chrome.storage.local.selectedPreset`.
- Existing bridge instances observe that change and produce an immediate live drawing update without reload, zoom, pan, or direct popup-to-renderer communication.
- Warm Drafting, Slate Graphite, and Industrial Cyanotype each displayed consistently between the popup preview and the active drawing.
- The popup footer and selection indicator tracked all three choices.
- The completed popup and icon increment left `bridge.js` and `theme.js` byte-identical to the accepted persistence revisions.

The toolbar icon and popup drawing thumbnails are extension UI assets. Their use of accepted palette colors does not make them renderer evidence or a second theme-definition path; `theme.js` remains authoritative for renderer mutation.

## Drawing-chrome DOM/CSS findings — non-renderer

The authorized Drawing-chrome investigation did not change `theme.js`, `bridge.js`, `popup.js`, any renderer path, or the accepted live/Git implementation files. Every visual change described below was a temporary DevTools/Console mutation and cleared when the Drawing editor realm was recreated. Industrial Cyanotype then reapplied through the accepted persistence and renderer path.

### Ownership boundary

**ESTABLISHED:** The Drawing editor toolbar, Sheets panel, and right-side flyout controls are ordinary DOM/CSS surfaces inside the production Drawing `editor` iframe. The iframe URL receives `theme=dark`, but its legacy roots remain light Wt/Xenon markup:

```text
html.Wt-layout
body.Wt-layout.Wt-ltr
```

These surfaces are architecturally separate from the WebGL drawing renderer. Recoloring them with CSS does not establish or alter renderer behavior.

### Primary toolbar

**ESTABLISHED structure:**

```text
.xenon-menu.xenon-toolbar.navbar.active-toolbar
→ .navbar-inner
→ .container
```

`.navbar-inner` owns the native 36-pixel white toolbar surface through Drawing `style.css`; its `.container` child is transparent. A temporary `#333333` override recolored the toolbar independently of the Sheets panel and right-side controls.

Toolbar actions use external SVG `<img>` elements sized 28 × 28 by `.toolbar-button > img`. The sampled `hatch_button.svg` was 422 characters, used a fixed `#333333` fill, and contained no `currentColor`, style block, or filter definition. A temporary `brightness(0) invert(80%)` filter matched 16 toolbar images and produced an approximately `#CCCCCC` neutral icon tone. Disabled tools remained subdued and blue dropdown indicators remained visible.

The native hover boundary remains legible. The native selected-tool background reduces icon contrast against the dark toolbar; improving that highlight is a wishlist item, not a blocker. Native white tooltips are currently out of scope.

### Sheets explorer

**ESTABLISHED surface path:**

```text
[data-object-name="OsDrawingExplorer"]
→ .content.flyoutContent
```

The native field background is `rgb(250, 250, 250)` and the intervening containers are transparent. Native tree text is `#666666`; it is not the renderer foreground color. A reversible proof used the Industrial Cyanotype surround `#3A4148` for the panel surface and neutral UI text `#C8D0D8`. The same pair worked for the header and sort tabs while preserving the blue active-tab underline.

A separate UI-text color is necessary because renderer foreground colors are chosen for the drawing sheet and do not guarantee contrast on chrome surfaces. For example, Warm Drafting's dark renderer foreground would disappear against a dark Sheets panel. The selected-sheet row remains imperfect but understandable and is a wishlist refinement.

### Right-side toggle and independent Measure tiles

**ESTABLISHED structure for the four main toggles:**

```text
.xenon-flyout-widget-container.xenon-flyout-right
→ [data-object-name="flyoutContainerRow"]
→ .toggleButtonContainer
→ .btn.toggleBtn.with-icon
```

There is no opaque common rail between the tiles; the group containers are transparent. Each observed tile owns its native white 33 × 34-pixel background, approximately one-pixel gray border, and a 20 × 20 external SVG image.

A reversible proof matched four buttons and four images: Inspection table, Styles, Drawing properties, and MBD status. It used background `#3A4148`, border `#56616B`, and `brightness(0) invert(80%)` on the images. Some multicolor icon definition was lost, which HUMAN accepted for these recognizable, lower-frequency controls.

**ESTABLISHED independent Measure structure:**

```text
[data-object-name="btnElementProperties"].measurementBtn.with-icon
→ img[src*="measure-button.svg"]
```

The Measure tile owns a separate native white 33 × 34 surface and `#CCCCCC` border. A proof matched one tile and one 20 × 20 image and successfully applied the same dark tile, border, and icon-filter treatment.

### Shared flyout shell and lifecycle

**ESTABLISHED panel stack:**

```text
.xenon-flyout-widget-container.xenon-flyout-right
→ [data-object-name="flyoutContentStackedWidget"]
→ .xenon-flyout-widget
```

Observed direct panels were `OsInspectionPanelFlyout`, `OsStylePropertyFlyout`, `OsDrawingPropertyFlyout`, and `OsMBDStatusPanelFlyout`. They share direct `flyoutHeader`, `flyoutBody`, and `flyoutFooter` regions. The stack accepted background `#3A4148`, border `#56616B`, and title text `#C8D0D8`.

The header can acquire `.headerUnderLineSticky`, whose native rule forces `#FAFAFA !important` and a blue inset underline. A sufficiently specific dark override must include the sticky state. The proof preserved the blue underline and matched five instantiated headers, two sticky at the time.

**ESTABLISHED DevTools realm behavior:** Recreating the Drawing editor replaces its document realm. `$0.ownerDocument` can therefore refer to a detached former document even when a Console command remains syntactically valid. A fresh element-picker selection in the live editor restored nonzero selector matches. Temporary style elements disappear with the old realm while the accepted renderer preset reapplies through normal persistence.

### Shared form-control families

**ESTABLISHED selectors and accepted proof colors:**

| Control | Selector family | Background | Text | Border |
| --- | --- | --- | --- | --- |
| Native/select-like dropdown | `select.XeDropdown`, `input.XeDropdown` | `#2F353B` | `#C8D0D8` | `#56616B` |
| Numeric spinbox | `input.XeSpinBox.Wt-spinbox` | `#2F353B` | `#C8D0D8` | `#56616B` |
| Hatch/custom dropdown | `.OsDropdown.OsPropertyPanelDropdown` | `#2F353B` | `#C8D0D8` | `#56616B` |
| Body label | flyout-body `.XeLabel` | transparent | `#C8D0D8` | inherited |
| Checkbox caption | `label.checkbox > input + span` | transparent | `#C8D0D8` | inherited |

Disabled controls/captions used provisional background `#353B41`, text `#7F8A94`, and border `#4A535C`. The standard dropdown proof matched 14 instantiated right-side controls in one realm; the shared label proof matched 28 labels. Counts vary with Onshape's instantiated hidden panels and tabs. The visible Styles spinbox retained its native increment/decrement background image after recoloring. Dropdown carets and the custom hatch-dropdown affordance were preserved.

### Drawing Properties body and tabs

**ESTABLISHED section families:**

```text
.XeDialogSectionTabContainer
.XeDialogSectionTabHeader
.XeDialogSectionTabHeaderTitle
```

Successful proofs used body `#3A4148`, section header `#50575A`, title/body text `#C8D0D8`, field `#2F353B`, and border `#56616B`.

The top Drawing-property tabs use anchors beneath `[data-object-name="OsDrawingPropertyTab"] ul.nav-tabs`. Their icons are background images, not descendant `<img>` elements, so an icon-only CSS filter is unavailable. HUMAN accepted inactive tiles `#737A80`/border `#8A9299` and active tile `#365F78`/border `#6F8798` as a legible compromise.

### Inspection and MBD table panels

**ESTABLISHED shared section bars:** `.os-table-description` rows include `.OsCollapsibleButton.btn > img` and `.XeLabel.OsCollapsibleText`. The shared proof matched six bars and four arrows. It used background `#50575A`, text `#C8D0D8`, border `#56616B`, and `brightness(0) invert(80%)` for arrows. HUMAN verified both expanded and collapsed arrow positions.

**ESTABLISHED shared notices:** `.IntimationMessageContainerStyle` appears across Inspection, Styles, and MBD. A proof matched six notices and ten descendant labels and used background `#294B5F`, text `#C8D0D8`, and border `#6F8798`.

**ESTABLISHED grid families:** After three datums were added, `datumsTable` and `inspectionTable` exposed two populated Wt table views. Body cells resolve through `.Wt-tv-contents .Wt-tv-c:not(.Wt-delegate-edit)`; headers resolve through `.Wt-header .Wt-tv-c.headerrh` and `.Wt-label`. The proof matched two grids, 70 body cells, and 10 header cells. Body background was `#3A4148`; header background was `#50575A`; text was `#C8D0D8`; borders were `#56616B`.

The MBD empty state successfully inherited the shared shell, title, dropdown, section bars, arrows, and notice styling. A populated MBD grid was not available for direct verification.

**ESTABLISHED table-scrollbar behavior:** The horizontal/vertical table scrollbars are CSS pseudo-elements on `.tcontainer`, not DOM children. A scoped proof matched 16 instantiated table scroll containers, four visible. It used track/corner `#2F353B`, thumb `#68737D`, hover thumb `#7D8A95`, and a two-pixel track-colored border. HUMAN accepted the visual result. General flyout-body vertical scrollbars were not separately proved.

### Flyout footer controls

**ESTABLISHED Styles footer:** `[data-object-name="flyoutFooter"].footerStylePanel` contains `.revertButtonStyle`, `.RevertLabelStyle`, and `.helpStyle`. One footer, two icon tiles, and one label were matched. The footer used `#3A4148`; background-image icon tiles used medium gray `#737A80` with border `#8A9299`; disabled text used `#7F8A94`.

**ESTABLISHED Drawing Properties footer:** `[data-object-name="flyoutFooter"].templatepanelfooter` contains `OsTemplatePropertiesPanel`, the template-update label, Browse tile, hidden template-name input, Lock drawing properties checkbox, and Help tile. One footer, two icon tiles, one update label, and one checkbox caption were matched and accepted with the same footer/icon treatment.

### Native Inspection table click error

Clicking certain Inspection cells triggered Onshape `app.js` mouse-handler exceptions reading `objectName` from `undefined`. The same error repeated with the temporary theme disabled. **ESTABLISHED:** the error is independent of the recoloring proof. Its internal Onshape cause remains **UNKNOWN** and is outside extension scope.

### Work-laptop persistent Drawing UI implementation

The least-coupled deployment inference was tested and accepted on the work-laptop sandbox. The implementation uses `drawing-ui.css` for Drawing DOM/CSS and a bounded ISOLATED-world preset marker in `bridge.js`. `theme.js` remained byte-identical to the accepted renderer baseline throughout the implementation and validation.

**ESTABLISHED work-laptop candidate boundary:**

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

**ESTABLISHED revision markers in the accepted sandbox candidate:**

```text
MAIN:   persistence-main-1
bridge: drawing-ui-bridge-1
UI CSS: drawing-ui-css-2
popup:  preset-popup-2
```

These are accepted September 14 sandbox hashes, not the final September 16 Git or LIVE hashes. The later toggle deployment and home reconciliation are documented in Project State.

### Preset-coherent DOM marker

The bridge retains the same exact preset allowlist used by persistence. After `selectedPreset` has already been validated, it mirrors the ID to the Drawing document root as `data-oce-preset`. The marker does not replace or broaden storage/message validation and does not perform renderer traversal.

**ESTABLISHED ownership boundary after implementation:**

```text
bridge.js
→ validate/store/relay selectedPreset
→ mirror validated preset ID to data-oce-preset

drawing-ui.css
→ consume data-oce-preset for Drawing shell variables

theme.js
→ remain exclusive owner of WebGL renderer resolution/mutation/readback/redraw
```

The three shell backgrounds use the accepted surround colors: Warm `#50575A`, Slate `#42484E`, and Industrial Cyanotype `#3A4148`. Supporting UI colors remain independent neutral chrome colors rather than renderer foreground colors.

### Persistent Sheets refinements

Initial CSS persistently recolored the large Sheets field but left three minor native-light/subdued surfaces. Bounded probes established their actual owners.

**ESTABLISHED sort-tab path:**

```text
[data-object-name="OsDrawingExplorerTab"]
→ ul.nav-tabs
→ li
→ a
```

A proof matched two anchors and preserved the native blue active-tab indication while replacing the white tab field.

**ESTABLISHED Sheets toggle:**

```text
[data-object-name="flyoutToggleButton_OsDrawingExplorer"]
```

This is independent of the right-side flyout root and therefore receives its own exact semantic rule.

**ESTABLISHED subordinate view-name path:**

```text
[data-object-name="OsDrawingExplorer"]
.xenon-sheet-nondangling-item
[data-object-name="t"]
```

The leaf labels carried native `rgb(102,102,102)` and overrode inherited neutral text. A proof matched five view-name labels in the tested realm and promoted them to neutral UI text.

### Inspection viewport ownership

The first persistent implementation successfully styled populated Inspection cells and headers but exposed the native white table background wherever no cell occupied the viewport.

A direct probe of the blank Datums region established the enclosing table view as the background owner:

```text
DIV.Wt-itemview.Wt-tableview
[data-object-name="datumsTable"]
```

The exact generated ID seen during probing is intentionally discarded. Production CSS uses the semantic Inspection root plus `.Wt-itemview.Wt-tableview`. A combined proof matched two table views and recolored the unused viewport without changing populated cells.

### Inspection sticky-header remainder

After the table-view background was fixed, a light remainder persisted beside the populated Name/Sheet header cells. Direct probing established the owner as:

```text
DIV.Wt-header.headerrh.tcontainer.inspection-panel-sticky-header
```

The tested element reported a native `rgb(235,235,235)` background and `position: sticky`. Its enclosing `datumsTable` was already correctly themed. A scoped proof matched two sticky headers, corresponding to Datums and Characteristics, and applied the accepted section/header background `#50575A` with neutral text/border treatment.

### Inspection scrollbar ownership — refined evidence

The earlier reversible research correctly established `.tcontainer` pseudo-element scrollbar styling, but the persistent candidate revealed a separate visible whole-panel scrollbar. A live overflow probe was used rather than inferring ownership from class names.

**ESTABLISHED Characteristics table scroller in the tested realm:**

```text
DIV.tcontainer
clientWidth:  698
scrollWidth: 1116
clientHeight: 476
scrollHeight:476
overflow-x: auto
overflow-y: auto
```

**ESTABLISHED Inspection panel/table-stack scroller:**

```text
[data-object-name="tablesContainerWidget"].stylePanelScrollBar
clientWidth:  701
scrollWidth: 701
clientHeight: 701
scrollHeight:733
overflow-x: auto
overflow-y: auto
```

A final reversible proof under `OsInspectionPanelFlyout` matched eight table scrollers and one panel scroller in the tested realm. Both families accepted:

```text
scrollbar width/height: 12px
track/corner:           #2F353B
thumb:                  #68737D
thumb hover:            #7D8A95
thumb border:           2px solid #2F353B
thumb radius:           6px
```

**ESTABLISHED:** the resulting horizontal Characteristics scrollbar and vertical Inspection-panel scrollbar were visually coherent and accepted. This closes the prior tested-runtime uncertainty about the Inspection table-stack scrollbar. It does not establish ownership for every unrelated flyout scrollbar.

The overflow probe also showed `.Wt-tv-contents` surfaces retaining native white computed backgrounds. No broader `.Wt-tv-contents` production rule was added because the proven table-view background fixed the visible unused area; invisible/native values were not changed without a demonstrated artifact.

### Styles Revert leaf background

The Styles footer shell was already correctly themed, but the visible `Revert to drawing properties` rectangle remained light. Direct probing established `.RevertLabelStyle` itself as the remaining owner with native `rgb(249,249,249)` background. A scoped `background-color: transparent` proof under `OsStylePropertyFlyout` was visually accepted and was added to CSS-2.

### Persistent CSS-2 lifecycle validation

The successful temporary refinements were consolidated into `drawing-ui-css-2`. Chrome was reloaded and a genuinely fresh Drawing editor realm was created without reinstalling any temporary DevTools style elements.

**ESTABLISHED by exact hashes and HUMAN observation:**

- `theme.js` remained exactly `5EF3FC50283AEE8D660A4A0D018C821682AF061CFDE1A1D217BD1149652D88BA`;
- the permanent CSS reproduced the toolbar, Sheets, right-side tiles, flyouts, fields, notices, tables, headers, footers, and scrollbar treatment;
- Sheets sort tabs, toggle, and view-name refinements persisted;
- the Inspection unused viewport and both sticky headers remained dark;
- Inspection table/panel scrollbars remained dark without temporary proof styles;
- Styles, Drawing Properties, and MBD remained coherent;
- the accepted WebGL renderer appearance remained intact;
- styling persisted while switching among tested Drawing tabs/editor realms.

This establishes static stylesheet persistence across the specific current-runtime reload/recreated-realm and multi-tab scenarios tested on the work laptop. It does not guarantee future Onshape DOM compatibility.

### Current inference and unknowns

**ESTABLISHED for the tested runtime:** a narrowly scoped Drawing-frame stylesheet plus one validated isolated-world root marker is sufficient to deploy the accepted Drawing chrome treatment without moving DOM ownership into `theme.js`.

**UNKNOWN or optional:** open native dropdown-list rendering; exhaustive hover/focus/active/disabled states; toolbar selected-state refinement; Sheets selected-row refinement; populated MBD-grid behavior; and compatibility with future Onshape DOM/private renderer changes.

Do not generalize Drawing DOM colors into renderer-native representations or use Drawing-chrome observations as evidence for WebGL paths. The work-laptop candidate is accepted historical evidence, not the final authoritative Git implementation.

## Selection and active dimensions

**ESTABLISHED by HUMAN:**

- Object selection remains clear against Industrial Cyanotype.
- Selecting an existing dimension makes its text somewhat harder to read.
- This is transient and normally occurs only while moving or editing the dimension.
- During new-dimension creation, selected entities illuminate correctly and the moving dimension remains themed and readable until placement.

Selection/highlight behavior is therefore optional backlog, not a canvas-theme blocker. Selection geometry is architecturally distinct from ordinary visible dimension geometry; do not infer its control path from identifier names.

## Known nonblockers

The following messages occurred while Onshape and the extension continued operating successfully:

```text
Unchecked runtime.lastError: Could not establish connection. Receiving end does not exist.
document.domain mutation is ignored because the surrounding agent cluster is origin-keyed.
Permissions policy violation: unload is not allowed in this document.
127.51.68.120:8181/3dconnexion/nlproxy ERR_CONNECTION_REFUSED
[Violation] setTimeout handler took approximately 50–64 ms
```

## Boundaries

**ESTABLISHED by HUMAN, 2026-09-15:** the compact popup On/Off switch was deployed and visually accepted; state persisted across extension reloads and multiple Drawing tabs. **ESTABLISHED by hashes and guarded synchronization:** all six changed toggle files in Chrome-loaded LIVE, the archived candidate, and the Git working copy now match exactly. The manifest and six icons also match LIVE/Git. All 13 implementation files have byte parity; the exact toggle hashes and backup path are recorded in Project State.

**ESTABLISHED by the accepted source:** `chrome.storage.local.enabled` is Boolean, repairs missing/corrupt values to ON, and does not erase `selectedPreset` while OFF. The popup writes storage only and disables palette selection while paused. `bridge.js` validates and relays the settings pair and sets `data-oce-enabled="true|false"`; all 62 CSS rule groups are gated by `:root[data-oce-enabled="true"]`. `theme.js` calls the existing internal renderer `restore()` when a previously enabled realm transitions OFF, leaves a freshly resolved paused realm native, and reapplies the saved preset on ON. This internal toggle path is distinct from the permanently stopping public `restore()`. Settings received before the one-second fallback prevent a default Warm application in a saved OFF realm; storage delay beyond that fallback remains a possible brief default theme interval. The six-file implementation was committed as `3cdff15fafecd11cefd5e6ca2e6a8e2479638b03`. Full toggle-specific renderer log/readback evidence was not captured in this closeout; HUMAN's visual and lifecycle acceptance covers the exercised live behavior.

Title-block and related persistent white/highlight surfaces are optional research. If a bounded source/runtime probe cannot establish an actionable owner, record that result and close the current product without treating it as a failed renderer implementation. An Onshape update may change undocumented internals and selectors; published documentation should state that limitation plainly.

Do not restart broad searches for independent dimension color, canvas highlight control, title-block rendering, persistent white canvas fields, or alternative renderer strategies merely because Drawing-chrome work is active.

The accepted work-laptop Drawing UI implementation keeps DOM styling in `drawing-ui.css`, validated preset state and the DOM marker in isolated-world `bridge.js`, and renderer ownership in MAIN-world `theme.js`. Do not treat Drawing-chrome findings as renderer evidence, move DOM styling into `theme.js`, recursively expand the complete DOM, or use generated IDs in production selectors. Reopen renderer investigation only when a specific newly authorized product requirement or contradictory current-runtime observation supplies a bounded question.
