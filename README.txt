ONSHAPE DRAWING COMFORT EXTENSION
=================================

Version: 0.1.1
Platform: Google Chrome / Chromium-based desktop browser environment
Tested browser baseline: Chrome 111 or newer
Status: Independent community/personal project


OVERVIEW
--------

Onshape Drawing Comfort Extension is a small Chrome extension intended to make long drawing/detailing sessions in Onshape easier on the eyes.

It changes the appearance of the Onshape Drawing editor without changing the underlying drawing model. The extension provides three coordinated drawing palettes, recolors selected portions of the legacy Drawing interface, remembers the selected preset, and includes a persistent On/Off switch.

The current presets are:

  - Warm Drafting
  - Slate Graphite
  - Industrial Cyanotype

The extension controls the proven drawing-renderer surfaces used for:

  - drawing sheet fill
  - ordinary drawing geometry and dimensions through a unified foreground
  - the area surrounding the drawing sheet

It also applies a coordinated dark treatment to supported Drawing-editor UI surfaces such as the primary toolbar, Sheets area, right-side flyouts, form controls, tables, and related chrome.

The current version also improves the temporary text preview shown while actively creating or editing ordinary Drawing Notes, including on the darker presets.


IMPORTANT: UNOFFICIAL / NO PTC AFFILIATION
------------------------------------------

This is an independent, unofficial project.

It is NOT affiliated with, endorsed by, sponsored by, maintained by, or supported by PTC Inc., Onshape, or the Onshape development team.

"Onshape", "PTC", and any related product names, logos, or trademarks belong to their respective owners.

Questions, bugs, feature requests, or support requests for this extension should NOT be directed to PTC or Onshape support.


IMPORTANT: THIS EXTENSION DEPENDS ON UNDOCUMENTED ONSHAPE INTERNALS
-------------------------------------------------------------------

This project works by interacting with portions of the Onshape Drawing editor that are not documented as a public extension API.

That includes private renderer structures and legacy Drawing-editor DOM/CSS behavior.

As a result:

  - An Onshape update may partially or completely break this extension.
  - PTC can change internal object names, renderer behavior, DOM structure, CSS classes, event behavior, or execution timing without notice.
  - A future Onshape update may require this project to be updated.
  - There is no guarantee that a future incompatibility will be fixable.
  - Compatibility at the time you install the extension does not guarantee compatibility later.

This is the single most important limitation of the project.

If the extension suddenly stops working after an Onshape update, disable it first and confirm that normal Onshape behavior returns before assuming the problem is with your document or browser.


WHAT THIS EXTENSION DOES NOT DO
-------------------------------

The extension does not replace Onshape's native application-wide dark mode.

It is focused specifically on the Drawing editor.

It does not intentionally modify:

  - Part Studio geometry
  - Assembly geometry
  - FeatureScript
  - document data
  - saved drawing geometry
  - title-block field contents
  - drawing dimensions as stored document data
  - exported files as an intentional data transformation

The extension is primarily a presentation-layer tool.

The active-Note preview feature modifies temporary editor preview geometry while the Note editor is active and restores original preview colors as that transient geometry changes or is released. Controlled testing showed that diagnostic preview colors did not persist into the committed Note.


INSTALLATION
------------

This project is currently installed as an unpacked Chrome extension.

1. Download or copy the complete extension folder to a permanent location on your computer.

   Do not install it from a temporary ZIP-extraction directory that you intend to delete later.

2. If the project was distributed as a ZIP file, extract it first.

3. Confirm that the extension folder contains "manifest.json" at its top level.

4. Open Google Chrome.

5. Navigate to:

       chrome://extensions

6. Enable "Developer mode" using the switch in the upper-right corner.

7. Click:

       Load unpacked

8. Select the extension folder that directly contains "manifest.json".

9. The extension should now appear in Chrome's extension list.

10. Open or reload an Onshape Drawing.

11. Optionally pin the extension to the Chrome toolbar using Chrome's Extensions menu.

12. Click the extension icon to open the preset selector.

No separate installer is required.


UPDATING THE EXTENSION
----------------------

When installing a newer copy manually:

1. Back up your current extension folder if you want an easy rollback.

2. Replace the old extension files with the new version, or point Chrome at the new permanent folder.

3. Open:

       chrome://extensions

4. Find the extension and click its Reload button.

5. Reload or reopen any Onshape Drawing tabs that were already open.

Saved extension settings are stored using Chrome's local extension storage and are designed to survive ordinary extension reloads.

Because this is an unpacked extension, Chrome will not automatically update it from a store unless a separately packaged/published version is created in the future.


USAGE
-----

Click the extension's toolbar icon while using Onshape.

Choose one of the available presets:

  Warm Drafting
  -------------
  A warm, low-glare drafting-paper appearance intended for comfortable general use.

  Slate Graphite
  --------------
  A dark neutral drawing environment.

  Industrial Cyanotype
  --------------------
  A dark blue drawing environment with a cool technical-drawing appearance.

The selected preset is remembered locally and is reapplied when compatible Drawing editor realms are opened.

ON/OFF SWITCH

The popup includes a persistent On/Off switch.

When OFF:

  - the selected preset remains saved
  - palette choices are visually disabled in the popup
  - supported Drawing UI styling is released
  - the renderer is returned to its native appearance where the extension had already applied a theme

When turned ON again, the saved preset is reapplied.

The On/Off state is also stored locally.


PRIVACY / NETWORK BEHAVIOR
--------------------------

The extension uses Chrome local extension storage for its own settings.

The accepted design uses local scripts and assets and does not require remote resources for its popup/interface.

The popup does not need to query arbitrary browser tabs or directly traverse the Onshape renderer. Preset and enabled-state changes are stored locally and then handled by the extension components running in compatible Onshape Drawing frames.

As with any browser extension installed in Developer Mode, you should inspect the source yourself if you have security or privacy concerns.


KNOWN LIMITATIONS
-----------------

The project has been tested extensively for its intended use, but it is not an exhaustive compatibility layer for every possible Onshape Drawing state.

Known limitations and boundaries include:

  1. Future Onshape compatibility is not guaranteed.

     The extension relies on undocumented/private renderer behavior and legacy Drawing-editor DOM/CSS structures.

  2. Title-block pale fields / title-block highlight recoloring are NOT implemented.

     Research established that the visible pixels could be recolored mechanically, but no production-safe semantic method was found to identify only the intended title-block fields without risking unrelated text or selection behavior.

     That feature was deliberately left out rather than implemented with a fragile heuristic.

  3. Some native dropdown-list rendering and uncommon interactive UI states have not been exhaustively themed.

     Open dropdown menus, every hover/focus/active/selected/disabled state, and every lazily instantiated panel combination have not all been tested.

  4. Selected existing dimensions can be somewhat harder to read temporarily on some dark themes.

     This occurs during selection/editing and is considered a nonblocking limitation.

  5. A very brief native/light renderer interval may sometimes be visible while a Drawing editor is starting.

  6. Behavior with very large numbers of simultaneous Drawing tabs has not been exhaustively tested.

     Multiple tabs and recreated Drawing realms have been tested successfully.

  7. A populated MBD grid was not available for direct verification during the original UI investigation.

     The surrounding MBD panel/chrome was tested.

  8. Active-Note preview handling has not been exhaustively tested across every possible rich/mixed text-format combination.

  9. Active-Note preview behavior in every possible print/PDF/export path has not been exhaustively tested.

     Controlled testing supports the conclusion that the changed preview is transient editor presentation, not saved Note data, but untested output paths remain unclaimed.

 10. No automated end-to-end browser regression suite currently exists.

     Validation has been performed through controlled live testing, exact source/hash verification, renderer readback, bounded probes, and visual acceptance.


TROUBLESHOOTING
---------------

If the extension appears not to work:

1. Confirm that it is enabled at:

       chrome://extensions

2. Confirm that the extension's own On/Off switch is ON.

3. Reload the extension from chrome://extensions.

4. Reload the Onshape Drawing tab.

5. If necessary, close and reopen the Drawing so that a fresh Drawing editor realm is created.

6. Confirm that you are working in an Onshape Drawing, not a Part Studio or Assembly.

7. If the problem began immediately after an Onshape update, assume compatibility may have changed.

If Onshape itself behaves strangely while the extension is active:

1. Turn the extension OFF from its popup.

2. Reload the Drawing.

3. If necessary, disable the extension completely at chrome://extensions.

4. Re-test the same Onshape behavior without the extension.

If the problem disappears when the extension is disabled, gather the Onshape version/date, Chrome version, affected Drawing behavior, and any browser-console evidence before reporting the extension issue.


RECOVERY / REMOVAL
------------------

To temporarily stop the extension:

  Use its built-in On/Off switch.

To disable it completely:

  1. Open chrome://extensions.
  2. Turn the extension off.

To remove it:

  1. Open chrome://extensions.
  2. Click Remove on the extension.
  3. Delete the local extension folder if you no longer want the source files.


SUPPORTED / TESTED SCOPE
------------------------

The project is intended for desktop Onshape Drawing use in Chrome.

The accepted implementation has been exercised across:

  - repeated Drawing reloads
  - recreated Drawing editor realms
  - multiple Drawing tabs
  - all three included presets
  - persistent preset selection
  - persistent extension On/Off state
  - ordinary drawing geometry
  - dimensions
  - supported Drawing UI chrome
  - new Note creation
  - existing Note editing
  - Note typing/chunk replacement
  - Note cancellation
  - live preset changes while editing a Note
  - OFF/ON transitions while using the Note editor

This does not mean every Onshape Drawing feature or every possible document state has been tested.


TECHNICAL SUMMARY
-----------------

The extension uses a deliberately separated architecture.

  theme.js
    Owns the proven Onshape WebGL Drawing renderer interactions and active-Note preview handling.

  bridge.js
    Runs in the isolated extension world, owns access to Chrome local storage, validates saved settings, and relays accepted state to the page-side logic.

  drawing-ui.css
    Owns the supported legacy Drawing-editor DOM/CSS recoloring.

  popup.html / popup.css / popup.js
    Provide the preset selector and persistent On/Off control.

The public theme boundary uses ordinary #RRGGBB colors.

Internally, Onshape's renderer uses different representations for different drawing surfaces, so the extension performs the necessary conversions inside its renderer-side code.

The project intentionally avoids broad global WebGL interception, global prototype replacement, continuous polling, and overly broad DOM selectors.


WHY SOME THINGS ARE DELIBERATELY NOT THEMED
--------------------------------------------

This project follows a fail-closed approach.

If a visual element can be recolored but cannot be identified safely enough to avoid changing unrelated Onshape behavior, it is left alone.

The title-block field/highlight investigation is the clearest example: narrow color-control seams were found, but a reliable semantic classifier for only the desired title-block fields was not.

Rather than ship a clever-looking heuristic that could affect unrelated text, dimensions, or selections, that feature was closed without production implementation.


SUPPORT EXPECTATIONS
--------------------

This is a small independent project, not a commercial product or supported Onshape integration.

Support, if any, is informal and best-effort.

The license creates no maintenance or support obligation. There is no guaranteed response time, maintenance schedule, compatibility SLA, or promise that any future Onshape change will be repaired.

If you fork or modify the project, you are encouraged to inspect the existing architecture before broadening selectors or renderer hooks. Narrow, evidence-based changes are strongly preferred over global interception.


SOURCE MODIFICATION
-------------------

The source is intended to be readable and modifiable.

If you change it:

  - keep a backup of the last known-good version
  - make one bounded change at a time
  - reload the unpacked extension after edits
  - recreate/reload the Drawing editor before judging the result
  - test ON and OFF behavior
  - test all three presets
  - verify that ordinary geometry, dimensions, and Notes still behave normally
  - be especially cautious with private Onshape renderer objects and CSS selectors

A change that works today may still fail after a future Onshape update.


LICENSE
-------

This project is released under the BSD Zero Clause License (0BSD).

In plain language, the intent is simple: use it, copy it, modify it, fork it, redistribute it, incorporate it into another project, or use it commercially if you want. No attribution requirement is imposed by the software license.

The software remains provided "AS IS", without warranty, and without an obligation by the original author to maintain, repair, support, or update it.

See LICENSE.txt for the controlling license text.

The 0BSD license applies to this project's original source code and assets. It does not grant rights to third-party trademarks, branding, software, services, or other intellectual property owned by PTC, Onshape, Google, or anyone else.


DISCLAIMER
----------

THIS SOFTWARE IS PROVIDED AS AN INDEPENDENT COMMUNITY/PERSONAL PROJECT AND IS USED AT YOUR OWN RISK.

THERE IS NO WARRANTY THAT IT WILL REMAIN COMPATIBLE WITH ONSHAPE, GOOGLE CHROME, OR ANY FUTURE VERSION OF EITHER PRODUCT.

THE AUTHOR IS NOT RESPONSIBLE FOR LOST WORK, LOST TIME, BROWSER PROBLEMS, DISPLAY PROBLEMS, DOCUMENT ISSUES, WORKFLOW INTERRUPTION, OR OTHER DAMAGES ARISING FROM USE, MODIFICATION, OR FAILURE OF THIS EXTENSION.

SAVE YOUR WORK NORMALLY, MAINTAIN APPROPRIATE BACKUPS, AND DISABLE THE EXTENSION IF YOU SUSPECT IT IS INTERFERING WITH ONSHAPE.

PTC / ONSHAPE DOES NOT PROVIDE SUPPORT FOR THIS PROJECT.


PROJECT PHILOSOPHY
------------------

This extension exists because staring at a bright white Drawing environment for long detailing sessions is unpleasant, and because the native Onshape dark theme does not currently provide the same treatment to the Drawing editor.

The goal is not to redesign Onshape.

The goal is to make Drawing work more comfortable while touching as little as practical, preserving native behavior where safe ownership cannot be established, and accepting that undocumented internals make this an inherently maintenance-sensitive project.

If an Onshape update eventually makes this extension unnecessary, that is a perfectly good outcome.
