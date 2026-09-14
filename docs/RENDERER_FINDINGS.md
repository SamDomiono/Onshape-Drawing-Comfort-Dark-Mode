# Onshape Drawing Comfort Extension — Renderer Findings

**Updated:** 2026-09-14
**Current accepted MAIN revision:** `persistence-main-1`
**Current accepted bridge revision:** `persistence-bridge-1`
**Current accepted popup revision:** `preset-popup-2`

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

The persistence and popup increments did not change any accepted renderer resolver, representation, mutation, verification, rollback, or redraw path.

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

### Right-side flyout toggle tiles

**ESTABLISHED structure:**

```text
.xenon-flyout-widget-container.xenon-flyout-right
→ [data-object-name="flyoutContainerRow"]
→ .toggleButtonContainer
→ .btn.toggleBtn.with-icon
```

There is no opaque common rail between the tiles; the group containers are transparent. Each observed tile owns its native white 33 × 34-pixel background, approximately one-pixel gray border, and a 20 × 20 external SVG image.

A reversible proof matched four buttons and four images: Inspection table, Styles, Drawing properties, and MBD status. It used background `#3A4148`, border `#56616B`, and `brightness(0) invert(80%)` on the images. Some multicolor icon definition was lost, which is accepted provisionally because these controls are low-frequency and familiar through repetition. The separate bottom Measure control was not matched and remains pending.

### Current inference and unknowns

**INFERRED:** The least-coupled implementation is a narrowly scoped Drawing-frame stylesheet, provisionally `drawing-ui.css`, using stable classes and `data-object-name` attributes rather than generated IDs. If chrome backgrounds should follow the selected preset surround, a bounded isolated-world addition can mirror the validated preset ID onto an extension-owned root attribute. `theme.js` must remain the renderer owner and must not become the DOM-style owner.

**UNKNOWN:** The complete selector and state model for open flyout panels, the separate Measure control, selected and active highlights, and stylesheet persistence across all Drawing single-page lifecycle transitions still require bounded inspection. The opened Drawing properties panel establishes the next surface family: title/header, tab strip, section headers, form rows, select-like fields, checkboxes, scrollbar, and footer.

Do not generalize these Drawing DOM colors into renderer-native representations or use Drawing-chrome observations as evidence for WebGL paths.

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

Do not restart broad searches for independent dimension color, canvas highlight control, title-block rendering, persistent white canvas fields, or alternative renderer strategies merely because Drawing-chrome work is active.

Continue authorized Drawing-chrome work through bounded DOM/computed-style inspection and reversible CSS proofs. Do not treat those findings as renderer evidence, modify `theme.js` to own DOM styling, recursively expand the complete DOM, or use generated IDs. Reopen renderer investigation only when a specific newly authorized product requirement or contradictory current-runtime observation supplies a bounded question.
