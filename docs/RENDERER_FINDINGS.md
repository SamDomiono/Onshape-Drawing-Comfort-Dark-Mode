# Onshape Drawing Comfort Extension — Renderer Findings

**Updated:** 2026-09-13  
**Current accepted revision:** `named-presets-1`

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

These controls do not share one renderer-native representation. Standard `#RRGGBB` is the public boundary; conversion occurs inside `theme.js`.

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

The 3Dconnexion request is Onshape checking for optional local SpaceMouse integration. The remaining lines are browser/platform warnings or isolated performance notices. None correlated with a renderer mutation failure.

## Boundaries for future work

Do not generalize one renderer structure's encoding to another. Do not restart broad searches for independent dimension color, highlight control, title-block rendering, or navbar styling during persistence work.

Reopen renderer investigation only when a specific new product requirement or contradictory current-runtime observation supplies a bounded question.
