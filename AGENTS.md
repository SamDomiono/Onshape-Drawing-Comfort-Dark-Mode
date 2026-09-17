# AGENTS.md — Onshape Drawing Comfort Extension

## A note for curious humans

If you opened this file wondering what an `AGENTS.md` is, nothing here is required to **use** the extension.

This file is a technical roadmap written primarily for AI coding agents and developers who want to modify, debug, fork, or extend the project. A likely workflow for this project is that somebody downloads the repository, gives the folder or ZIP file to an AI coding model, and asks it to change something. This document gives that fresh model the architectural context and hard-won project boundaries it would otherwise have to rediscover.

Think of it as a shop drawing for the codebase.

If you only want to install and use the extension, start with `README.txt`.

If you want to modify it, this file should save time. The deeper engineering record lives in:

- `docs/PROJECT_STATE.md` — current product state, accepted implementation, validation history, and project boundaries.
- `docs/RENDERER_FINDINGS.md` — renderer, DOM/CSS, lifecycle, and experimental evidence behind the implementation.

The project is intentionally open-ended and released under the 0BSD license. Fork it, modify it, learn from it, or turn it into something else. The cautions below are not restrictions on what you may do; they are a record of what has already been learned so you do not have to repeat the expensive mistakes unless you have a reason.

---

# Instructions for coding agents

## 1. Mission

This repository contains the **Onshape Drawing Comfort Extension**, an independent Chrome extension that improves visual comfort in the Onshape Drawing editor.

The accepted product provides:

- three drawing presets:
  - `warm_drafting`
  - `slate_graphite`
  - `industrial_cyanotype`
- coordinated control of:
  - drawing sheet fill
  - unified ordinary geometry/dimension foreground
  - surround behind the drawing sheet
- preset-coherent dark styling for supported legacy Drawing-editor UI surfaces
- persistent selected-preset storage
- persistent extension ON/OFF state
- a popup UI for presets and ON/OFF control
- active Drawing Note preview recoloring while the Note editor is open

The project is **not affiliated with PTC or Onshape**.

It depends on undocumented/private Onshape renderer and DOM behavior. Future Onshape changes may break it.

Do not mistake currently working private internals for a stable public API.

---

## 2. Read this before editing

For a small, obvious change, this file may provide enough context.

For changes involving renderer behavior, lifecycle, Onshape internals, UI ownership, or an area marked CLOSED below, read the relevant sections of:

```text
docs/PROJECT_STATE.md
docs/RENDERER_FINDINGS.md
```

Do not ingest the engineering history merely to change a label, icon, or isolated CSS value. Use the deeper documentation when the requested change crosses an architectural boundary or when current behavior contradicts this roadmap.

When evidence conflicts:

1. Current source and reproducible runtime evidence outrank this summary.
2. `PROJECT_STATE.md` records accepted product state and project chronology.
3. `RENDERER_FINDINGS.md` records the detailed evidence supporting renderer/DOM conclusions.
4. Historical comments, backups, experimental snippets, and old hashes are not automatically authoritative.

Do not silently "fix" documented history to make it agree with a new hypothesis.

---

## 3. Repository map

### `manifest.json`

Chrome Manifest V3 configuration.

Responsibilities include:

- extension metadata/version
- storage permission
- toolbar action
- icon declarations
- content-script declarations
- separation of ISOLATED-world and MAIN-world execution

Treat manifest execution-world assignments as architectural, not incidental.

---

### `bridge.js`

Runs in Chrome's **ISOLATED world**.

Primary responsibilities:

- access `chrome.storage.local`
- validate persistent extension state
- manage/repair:
  - `selectedPreset`
  - `enabled`
- relay validated state toward MAIN-world code through the established page message protocol
- mirror validated state to extension-owned Drawing-root attributes used by CSS

Important root markers include the validated preset state and:

```text
data-oce-enabled="true|false"
```

The bridge is an application coordination layer.

It is **not** the owner of Onshape WebGL renderer traversal or mutation.

Do not move renderer archaeology into `bridge.js`.

---

### `theme.js`

Runs in the Onshape Drawing frame's **MAIN world**.

This is the renderer-sensitive part of the project.

Responsibilities include:

- resolve the Onshape Drawing application/document/renderer
- retain accepted renderer identities
- convert public `#RRGGBB` theme colors to Onshape's renderer representations
- mutate and verify the three established renderer controls
- rollback failed writes
- request redraw
- restore native values
- honor persistent preset and enabled state
- own active Drawing Note preview recoloring/lifecycle

The accepted V2 MAIN revision is:

```text
note-preview-main-1
```

At final V2 acceptance, the expected `theme.js` SHA-256 was:

```text
43FDAAFB66C9B110312B4DA6FA7F1E519484536E19DEF21600EAF0961AFCD5FC
```

Treat hashes as release evidence, not as a reason to reject an intentional future edit.

Any modification to `theme.js` should be treated as renderer-sensitive until proven otherwise.

---

### `drawing-ui.css`

Owns supported **Drawing-editor DOM/CSS presentation**.

Examples include:

- primary Drawing toolbar
- Sheets explorer
- right-side control tiles
- flyout shells
- Drawing Properties
- Styles
- Inspection surfaces/tables
- MBD chrome
- supported form controls
- supported scrollbars

Core rule:

> DOM styling belongs here; WebGL renderer ownership belongs in `theme.js`.

Do not solve renderer problems with broad CSS guesses.

Do not move ordinary DOM recoloring into `theme.js`.

Prefer semantic, scoped selectors.

Avoid:

- generated runtime IDs
- unscoped iframe-wide selectors
- selectors proven only against one accidental DOM instance
- recursive full-DOM manipulation

---

### `popup.html`, `popup.css`, `popup.js`

Extension-context user interface.

Responsibilities:

- display the three accepted preset choices
- display the persistent ON/OFF control
- read/write extension storage
- show selected/paused state

The popup should remain a settings UI.

It should not directly traverse Onshape renderer objects.

It should not become an alternate renderer orchestration path.

---

### `icons/`

Extension UI assets.

These are presentation assets, not renderer evidence.

Do not infer Onshape renderer behavior from icon colors or popup preview artwork.

---

### `docs/PROJECT_STATE.md`

Primary project-state record.

Use it for:

- accepted implementation state
- revision/commit history
- accepted hashes at documented milestones
- deployment workflow
- validation history
- feature boundaries
- known unknowns
- closed research branches

Read this before substantial integration or release work.

---

### `docs/RENDERER_FINDINGS.md`

Technical evidence record.

Use it when work requires understanding:

- Onshape renderer paths
- internal color representations
- redraw behavior
- Drawing DOM/CSS ownership
- selection/highlight research
- title-block investigation
- active Note preview ownership/lifecycle
- experimentally established versus inferred behavior

Do not replace evidence in this file with assumptions based on identifier names.

---

### `README.txt`

Human-facing installation, usage, compatibility, troubleshooting, disclaimer, and support information.

Changes to public behavior should normally be reflected here.

---

### `LICENSE.txt`

Project license.

Current intended release license:

```text
BSD Zero Clause License (0BSD)
```

The project is intended to be maximally permissive.

The license does not grant rights to third-party trademarks or intellectual property.

---

## 4. Execution architecture

There are three relevant execution/presentation domains.

### A. Extension context

Primarily the popup.

```text
popup.js
    ↓
chrome.storage.local
```

The popup writes settings. It does not directly control the renderer.

---

### B. ISOLATED world

Owned by `bridge.js`.

Conceptually:

```text
chrome.storage.local
        ↓
     bridge.js
        ↓
validated extension state
        ↓
Drawing-root data attributes
+
versioned same-window settings message
```

This world has Chrome extension API access.

---

### C. MAIN world

Owned by `theme.js`.

Conceptually:

```text
validated settings message
        ↓
desired enabled/preset state
        ↓
Onshape Drawing renderer resolution
        ↓
theme application / native restoration
        ↓
redraw
```

This world can reach the private Onshape Drawing renderer objects required by the project.

Preserve this separation unless there is strong evidence that a requested change requires a different architecture.

---

## 5. Persistent state

The established storage keys are:

```text
selectedPreset
enabled
```

Accepted preset IDs:

```text
warm_drafting
slate_graphite
industrial_cyanotype
```

`enabled` is Boolean.

Important behavior:

- missing/corrupt preset state repairs to the accepted default
- missing/corrupt enabled state repairs to ON
- turning the extension OFF does not erase the selected preset
- turning it ON reapplies the saved preset
- OFF releases supported Drawing UI styling
- OFF restores native renderer values when an already themed realm transitions to the paused state

Do not create a second competing persistent-state mechanism without a concrete reason.

---

## 6. Accepted visual presets

### Warm Drafting

```text
sheet:      #D8D0BC
foreground: #3F3D38
surround:   #50575A
```

### Slate Graphite

```text
sheet:      #1D2023
foreground: #929AA4
surround:   #42484E
```

### Industrial Cyanotype

```text
sheet:      #0E2238
foreground: #8AA9C7
surround:   #3A4148
```

These are human-facing standard RGB values.

Do not assume Onshape stores every target using the same internal representation.

---

## 7. Renderer map

### Surround

Established renderer path:

```text
doc.m_XeDatabase.m_XeLayout.m_Paper.m_PaperBackColor
```

Established representation:

```text
0xBBGGRR
```

---

### Sheet fill

Established path:

```text
doc.m_XeDatabase.m_XeLayout.m_Paper.m_Scene.children
→ PaperOptimized
→ xegltype === 4
→ material.uniforms.color
```

Established representation:

```text
[R/255, G/255, B/255]
```

The resolver is structural.

Do not reintroduce an old brightness heuristic merely because it appears simpler.

---

### Unified ordinary foreground

Established path:

```text
doc.m_XeGsDevice.getPalette().getPalette()[7]
```

Established representation:

```text
0xBBGGRR
```

This accepted unified foreground controls ordinary drawing geometry and the sampled dimensions.

Independent dimension color is not part of the accepted initial architecture.

---

### Primary renderer redraw

Established path:

```javascript
doc.m_XeGsDevice.invalidateScene()
```

Historical stale-pixel behavior was investigated and was not reproducible in later controlled current-runtime testing.

Do not reopen that archaeology unless the problem actually recurs.

---

## 8. Active Drawing Note preview

This is a separate transient-renderer feature and should not be confused with ordinary committed Note geometry.

Established preview location:

```text
getXeApplication().m_XeDocuments[0]
  .m_XeGsDevice.m_Chunks
```

Observed qualifying preview chunks are `XeGsSimpleChunk` objects containing text geometry and were identified using the strict accepted Note-preview guards.

Important established fields in tested qualifying chunks included:

```text
m_TrackerName = "CFxNoteEditorTracker"
m_Owner       = -2
m_OwnerBlock  = "0"
m_Type        = "WS"
```

### Critical rule

**Do not identify Note preview geometry by color.**

Native preview text can carry different explicit original colors.

The accepted implementation captures and restores each qualifying object's actual original `m_Color`.

### Lifecycle

Preview chunks are ephemeral.

Typing may destroy one preview object and create replacement objects.

Therefore:

- do not retain one chunk ID and assume it survives
- do not rely on fixed chunk offsets
- do not poll continuously if the existing event seam remains available

Established reacquisition event:

```text
Update_XeGsGeometryChunks
```

The accepted implementation combines that event with strict Note editor/command guards and chunk filtering.

Redraw for this transient preview uses:

```text
invalidateServerTrackers()
```

The accepted design restores/releases replaced objects and removes listeners during OFF/Restore/lifecycle cleanup.

It does not globally override WebGL or renderer prototypes.

---

## 9. Hard architectural boundaries

Preserve these unless new evidence justifies changing them.

### Renderer ownership

```text
theme.js
```

owns WebGL renderer resolution, mutation, verification, rollback, restoration, renderer redraw, and active Note preview handling.

### Extension state / coordination

```text
bridge.js
```

owns extension storage access, validation, relay, and Drawing-root state markers.

### Drawing DOM presentation

```text
drawing-ui.css
```

owns supported legacy Drawing UI recoloring.

### User settings interface

```text
popup.*
```

owns user interaction with preset and ON/OFF state.

A model proposing to solve everything from one file is probably moving in the wrong direction.

---

## 10. CLOSED / deliberately abandoned work

A future agent should not interpret "closed" as legally forbidden. It means the project already spent substantial effort here and did not establish a production-safe implementation.

Reopen only when:

- new Onshape behavior provides materially new evidence,
- current runtime contradicts the established model,
- or the maintainer explicitly chooses to accept broader/riskier behavior.

### Title-block pale fields and selection highlight

Research proved that the target pixels have narrow mechanical color seams.

That was **not** the problem.

The blocker was semantic isolation.

Editable title fields and static title-block text shared overlapping entity characteristics. No defensible production classifier was established that guaranteed only the desired title-block fields/highlights would be changed.

Therefore:

> Title-block recoloring is technically color-feasible but product-infeasible under the project's established fail-closed isolation standard.

Do not resurrect this with:

- all-`XeText` matching
- all paper-space text
- style-only matching
- screen-region matching
- fixed offsets/chunk IDs
- generic selection-preview recoloring

unless the requested fork explicitly accepts those broader side effects.

---

### Generic canvas selection/highlight recoloring

The title-field selection research proved a specific preview seam.

It did **not** prove a safe global selection-color architecture.

Dimensions and other entities can share general preview mechanisms.

Do not generalize the title-field proof into global selection recoloring without new bounded evidence.

---

### Independent dimension color

Unified foreground is the accepted architecture.

Do not reopen independent dimension-color research unless there is an actual new product requirement.

---

### Historical RESTORE anomaly

An early exploratory session reported stale restored pixels until user interaction.

Later controlled sessions, including recreated realms, did not reproduce it.

Do not resume broad redraw archaeology unless a current reproducible failure exists.

---

## 11. Fail-closed engineering philosophy

This project intentionally prefers a missing cosmetic enhancement over a broad rule that may damage unrelated Onshape behavior.

If you can recolor something but cannot safely establish **what it is**, leave it alone until you can.

Good:

```text
specific proven owner
→ narrow guard
→ reversible mutation
→ exact readback/observation
→ cleanup
```

Bad:

```text
"this class name looks right"
→ recolor every matching object
→ visual result happens to look okay once
→ ship it
```

Identifier names are clues, not proof.

One successful screenshot is evidence of appearance, not necessarily evidence of safe ownership.

---

## 12. Evidence language

When doing deeper investigation, preserve the project's evidence discipline.

### ESTABLISHED

Directly supported by current source, captured source paths, exact runtime readback, or controlled human visual observation.

### INFERRED

A conclusion one step beyond direct evidence, with its basis stated.

### UNKNOWN

Required evidence is missing, contradictory, historical-only, or not captured.

Do not promote inference into fact merely to make a handoff sound more complete.

---

## 13. Safe modification workflow

For source changes, prefer this sequence.

### 1. Establish the current baseline

Before editing:

```text
git status
git rev-parse HEAD
hash relevant files if integrity matters
```

Know whether the tree was clean before your change.

---

### 2. Back up accepted source when appropriate

For renderer-sensitive, broad CSS, storage, or multi-file changes, preserve a known-good recovery copy before editing.

Do not store operational backups inside the active source tree.

---

### 3. Make the narrowest viable change

Avoid unrelated refactoring.

Do not beautify working private-internal code during an unrelated functional change.

A small diff is easier to reason about against unstable undocumented interfaces.

---

### 4. Perform static checks

As applicable:

```text
node --check bridge.js
node --check theme.js
node --check popup.js
git diff --check
```

Validate `manifest.json`.

Inspect the actual diff.

---

### 5. Reload the unpacked extension

Use:

```text
chrome://extensions
```

Reload the extension after source edits.

---

### 6. Recreate the Drawing realm

Reload/reopen the Drawing as needed.

Remember that Onshape Drawing editor realms can be replaced. A DevTools reference to an old document/object may become stale even though a Console expression still executes.

Do not mistake a detached former realm for the current live Drawing.

---

### 7. Test the affected surface

Do not automatically repeat the entire project's historical research.

Use a bounded regression matrix appropriate to the change.

---

### 8. Verify source integrity

For a release/integration change:

- compare expected files
- calculate hashes if needed
- verify only intended files changed
- preserve an evidence trail

---

### 9. Commit only accepted state

Do not commit temporary probes, generated runtime IDs, console archaeology, or experimental instrumentation unless intentionally preserving research in documentation.

---

## 14. Minimum regression checklist

Scale this to the risk of the change.

For a renderer/state/lifecycle change, test at least:

### Presets

- Warm Drafting
- Slate Graphite
- Industrial Cyanotype

### Persistence

- select a preset
- reload Drawing
- confirm saved preset
- open/recreate another Drawing realm if relevant

### ON/OFF

- ON → OFF restores/releases extension presentation
- OFF → ON reapplies saved preset
- selected preset survives OFF

### Ordinary drawing

- ordinary geometry remains correct
- dimensions remain correct/readable
- selection remains usable

### Drawing UI

If CSS/bridge state changed:

- toolbar
- Sheets area
- right-side tiles/flyouts
- representative fields/tables
- enabled/disabled behavior

### Notes

If `theme.js`, state orchestration, or Note code changed:

- create new Note
- continue typing
- cancel
- edit existing Note
- commit and reopen
- change preset while Note editor is open
- OFF while Note editor is open
- ON/reacquire
- reload/recreate realm
- verify native explicit text colors are restored/preserved where relevant

Do not claim untested print/PDF/export behavior as established.

---

## 15. CSS editing guidance

Use the narrowest stable semantic root available.

Right-side Drawing flyout work should remain scoped beneath proven Drawing roots rather than broad generic class names wherever possible.

Do not use generated IDs observed in DevTools as production selectors.

Remember:

- some Onshape controls use descendant `<img>` icons
- some use CSS background images
- some visible scrollbars are pseudo-elements
- instantiated hidden panels can change selector match counts
- sticky headers can introduce higher-specificity native rules
- open native dropdown lists may use behavior/surfaces different from the closed control

A selector matching 20 elements is not inherently safer than one matching 2. Ownership matters more than count.

---

## 16. Renderer editing guidance

Assume private renderer structures are fragile.

Before changing a renderer path:

1. Determine whether the current path is already established in `RENDERER_FINDINGS.md`.
2. Verify the current runtime if the path appears to have changed.
3. Prefer structural validation over incidental numeric appearance.
4. Retain exact original values before mutation.
5. Verify mutation when practical.
6. Restore/rollback on failure.
7. Use the narrowest known redraw path.
8. Clean up listeners/instrumentation.

Do not:

- globally intercept every WebGL draw call for a local cosmetic feature
- permanently override renderer prototypes without a compelling reason
- identify objects solely by current color
- assume an object ID survives editor lifecycle
- infer semantics solely from names such as "highlight", "text", or "preview"

---

## 17. Chrome / Onshape lifecycle cautions

The Drawing editor can use separate/recreated execution realms.

Consequences:

- retained JS object references may become stale
- retained DOM nodes may belong to detached documents
- temporary injected styles disappear when their document realm is replaced
- fresh content scripts will execute in new matching frames
- renderer resolution must tolerate startup timing

Always determine whether you are observing the live current realm before treating a failed selector or object lookup as architectural evidence.

---

## 18. Security / privacy boundary

This is a local visual extension, not a security-sensitive data product.

The bridge uses a same-window message protocol with validation appropriate to this coordination task.

The page can potentially observe or imitate DOM/window messages.

Therefore:

> The message channel is an application coordination boundary, not a privileged security boundary.

Do not transport secrets through it.

Do not advertise it as a security isolation mechanism.

---

## 19. Public-release expectations

If public behavior changes, review whether these also need updates:

```text
README.txt
AGENTS.md
docs/PROJECT_STATE.md
docs/RENDERER_FINDINGS.md
```

Not every CSS tweak requires rewriting historical renderer findings.

Update documentation at the level appropriate to the change.

If a release introduces a new private Onshape dependency, disclose the compatibility risk rather than hiding it.

---

## 20. If Onshape updates and the extension breaks

Do not begin by rewriting everything.

First isolate the failure domain.

### If presets/popup state fail

Inspect:

```text
popup.js
chrome.storage.local
bridge.js
message/state flow
```

### If Drawing UI chrome remains native/light but renderer themes correctly

Inspect:

```text
bridge root attributes
drawing-ui.css
Onshape DOM/class/ownership changes
```

### If UI chrome themes correctly but sheet/geometry/surround do not

Inspect:

```text
theme.js
getXeApplication()
document count
renderer object paths
palette/paper structures
redraw behavior
```

### If only active Note typing preview fails

Inspect:

```text
Note editor/command lifecycle
m_Chunks
CFxNoteEditorTracker
qualifying chunk fields
Update_XeGsGeometryChunks
invalidateServerTrackers()
```

### If everything fails at once

Check first:

- manifest frame matching
- Onshape Drawing iframe URL/host changes
- content-script execution
- extension errors
- large Onshape architectural changes

Localize before redesigning.

---

## 21. Things a fresh AI should NOT do automatically

Do not:

- assume this repository needs refactoring because some private-internal code looks unusual
- replace established paths with cleaner-looking guesses
- convert all logic into one execution world
- migrate DOM styling into JavaScript without need
- create a second state store
- remove validation because values currently come from the popup
- broaden CSS selectors for convenience
- use generated Onshape IDs in production selectors
- identify Note preview chunks by black color
- use fixed Note chunk IDs/offsets
- resurrect title-block recoloring from old experimental evidence
- generalize a title-field highlight seam into all selection behavior
- repeat expensive browser archaeology when existing evidence answers the question
- claim future compatibility
- claim exhaustive testing where none exists
- treat PTC/Onshape as responsible for this extension

---

## 22. Things a fresh AI SHOULD do

Do:

- read the request first and solve only the requested problem
- preserve the current separation of concerns
- inspect the relevant current source before proposing edits
- use the existing evidence docs when touching private internals
- state what is established versus inferred
- prefer reversible, bounded changes
- fail closed when ownership is ambiguous
- test the smallest meaningful regression surface
- preserve original values before runtime mutation
- compare source diffs carefully
- leave the repository cleaner in evidence, not merely prettier in style
- document newly discovered private dependencies
- respect that the user may intentionally choose a different tradeoff in a fork

---

## 23. Maintainer intent

The original project goal is modest:

> Make long Onshape Drawing sessions more visually comfortable without unnecessarily disturbing native behavior.

This is not an attempt to replace the Onshape UI, create a general renderer framework, or prove that every Drawing surface can be themed.

A cosmetic feature should earn its complexity.

If a native Onshape update eventually provides equivalent Drawing theming and makes this extension obsolete, that is a successful outcome.

---

## 24. License and forks

This project is released under the BSD Zero Clause License (`0BSD`).

That means downstream users are intentionally given very broad freedom to:

- use
- copy
- modify
- fork
- redistribute
- incorporate into other work
- use commercially

subject to the actual license text in `LICENSE.txt`.

The architectural cautions in this file are not license restrictions.

If your fork wants different behavior or accepts broader heuristics, you are free to make that choice. Just distinguish your new assumptions from what this repository actually established.

---

## 25. Compact orientation for an AI receiving only the ZIP

If you are an AI coding agent and the user handed you this repository with little context, start here:

```text
USER REQUEST
    ↓
Is it installation/usage/public documentation?
    → README.txt

Is it popup/preset/ON-OFF UI?
    → popup.*
    → bridge.js if persistent state propagation is involved

Is it Drawing DOM chrome?
    → drawing-ui.css
    → bridge.js only if root state markers are involved

Is it sheet / ordinary geometry / dimensions / surround?
    → theme.js
    → read relevant RENDERER_FINDINGS.md first

Is it active Note typing preview?
    → theme.js
    → read Active Drawing Note sections in RENDERER_FINDINGS.md

Is it title-block pale fields/highlights?
    → STOP
    → read the closed title-block research before proposing anything

Is behavior inconsistent with documented architecture?
    → gather current evidence
    → do not force reality to match the old documentation
```

Core ownership shorthand:

```text
popup.*         = user controls
bridge.js       = Chrome storage + validated coordination
drawing-ui.css  = legacy Drawing DOM/CSS
theme.js        = Onshape WebGL renderer + active Note preview
PROJECT_STATE   = accepted project state/history
RENDERER_FINDINGS = technical evidence
```

Core principle:

> Narrow evidence beats clever guessing.

That principle is responsible for much of the current extension's reliability despite its dependence on undocumented Onshape internals.
