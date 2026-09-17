(() => {
  "use strict";
  const VERSION = "0.1.1";
  const REVISION = "note-preview-main-1";
  const KEY = "__onshapeComfortExtension01";
  const CHANNEL = "onshape-comfort-extension";
  const PROTOCOL = 1;
  const SETTINGS_WAIT_MS = 1000;
  const PRESETS = Object.freeze({
    warm_drafting: Object.freeze({
      label: "Warm Drafting",
      theme: Object.freeze({
        sheet: "#D8D0BC",
        foreground: "#3F3D38",
        surround: "#50575A"
      })
    }),
    slate_graphite: Object.freeze({
      label: "Slate Graphite",
      theme: Object.freeze({
        sheet: "#1D2023",
        foreground: "#929AA4",
        surround: "#42484E"
      })
    }),
    industrial_cyanotype: Object.freeze({
      label: "Industrial Cyanotype",
      theme: Object.freeze({
        sheet: "#0E2238",
        foreground: "#8AA9C7",
        surround: "#3A4148"
      })
    })
  });
  const DEFAULT_PRESET = "warm_drafting";
  const DEFAULT_THEME = PRESETS[DEFAULT_PRESET].theme;
  const THEME_KEYS = ["sheet", "foreground", "surround"];
  const HEX_COLOR = /^#[0-9A-F]{6}$/i;
  if (Object.prototype.hasOwnProperty.call(window, KEY)) return;
  const id = crypto.randomUUID().slice(0, 8);
  const log = (message, data = {}) =>
    console.log(`[Comfort EXT ${id}] ${message} ${JSON.stringify(data)}`);
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const packed = n => Number.isInteger(n) && n >= 0 && n <= 0xFFFFFF;
  const rgb = c => Array.isArray(c) && c.length === 3 &&
    c.every(n => Number.isFinite(n) && n >= 0 && n <= 1);

  function normalizeTheme(theme) {
    check(theme && typeof theme === "object" && !Array.isArray(theme),
      "theme must be an object");
    const keys = Object.keys(theme);
    check(keys.length === THEME_KEYS.length &&
      THEME_KEYS.every(key => Object.prototype.hasOwnProperty.call(theme, key)),
      "theme must contain exactly: sheet, foreground, surround");
    const normalized = {};
    for (const key of THEME_KEYS) {
      check(typeof theme[key] === "string" && HEX_COLOR.test(theme[key]),
        `${key} must be a #RRGGBB color`);
      normalized[key] = theme[key].toUpperCase();
    }
    return Object.freeze(normalized);
  }

  const hexBytes = hex => [1, 3, 5].map(i =>
    parseInt(hex.slice(i, i + 2), 16));
  const packBgr = ([r, g, b]) => (b << 16) | (g << 8) | r;

  function encodeTheme(theme) {
    const normalized = normalizeTheme(theme);
    const sheet = hexBytes(normalized.sheet);
    return {
      theme: normalized,
      values: {
        ink: packBgr(hexBytes(normalized.foreground)),
        paper: sheet.map(channel => channel / 255),
        surround: packBgr(hexBytes(normalized.surround))
      }
    };
  }

  const listPresets = () =>
    Object.entries(PRESETS).map(([presetId, preset]) => ({
      id: presetId,
      label: preset.label,
      theme: { ...preset.theme }
    }));

  let controller = null;
  let stopped = false;
  let timer = null;
  let status = "waiting";
  let desiredPreset = null;
  let desiredEnabled = null;
  let lastAttemptedPreset = null;
  let lastAttemptedEnabled = null;
  let settingsStatus = "waiting";
  let settingsTimer = null;
  const started = performance.now();

  function applyDesiredPreset(reason) {
    if (stopped || !controller || desiredPreset === null ||
        desiredEnabled === null ||
        (lastAttemptedPreset === desiredPreset &&
         lastAttemptedEnabled === desiredEnabled)) return;
    const wasEnabled = lastAttemptedEnabled;
    lastAttemptedPreset = desiredPreset;
    lastAttemptedEnabled = desiredEnabled;
    if (!desiredEnabled) {
      // In a newly resolved realm the native snapshot has not been themed.
      const restored = wasEnabled === true ? controller.restore() : true;
      log("SETTINGS OFF", { reason, desiredPreset, restored });
      return;
    }
    const applied = controller.applyPreset(desiredPreset);
    log("SETTINGS APPLY", { reason, desiredPreset, applied });
  }

  function receiveSettings(presetId, enabled, reason) {
    if (typeof presetId !== "string" ||
        !Object.prototype.hasOwnProperty.call(PRESETS, presetId) ||
        typeof enabled !== "boolean") {
      log("SETTINGS REJECTED", {
        reason: "invalid preset ID or enabled value",
        received: { presetId, enabled }
      });
      return;
    }
    clearTimeout(settingsTimer);
    settingsStatus = "received";
    desiredPreset = presetId;
    desiredEnabled = enabled;
    log("SETTINGS RECEIVED", { desiredPreset, desiredEnabled, reason });
    applyDesiredPreset("settings-received");
  }

  window.addEventListener("message", event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin ||
        !data || typeof data !== "object" ||
        Array.isArray(data) || data.channel !== CHANNEL ||
        data.protocol !== PROTOCOL ||
        data.direction !== "isolated-to-main" ||
        data.type !== "settings") return;
    receiveSettings(data.selectedPreset, data.enabled, data.reason);
  });

  // Note previews use 0xC2RRGGBB true color, unlike the accepted BGR palette.
  function createNotePreview(doc, dev, rendererIdentity) {
    const eventName = "Update_XeGsGeometryChunks";
    const originals = new Map(); // Only the currently themed object set is retained.
    let targetColor = null;
    let listening = false;
    let suspended = false;
    let busy = false;

    const qualifies = chunk =>
      chunk?.m_ClassName === "XeGsSimpleChunk" &&
      chunk.m_TrackerName === "CFxNoteEditorTracker" &&
      chunk.m_Owner === -2 && chunk.m_OwnerBlock === "0" &&
      chunk.m_Type === "WS" && Array.isArray(chunk.m_Items) &&
      chunk.m_Items.length > 0 &&
      chunk.m_Items.every(item => item?.m_ClassName === "XeGsTextItem");

    function restoreChunk(chunk, saved) {
      // Do not overwrite a newer native assignment made by the editor.
      if (chunk.m_Color !== saved.applied) return false;
      chunk.m_Color = saved.original;
      return true;
    }

    function restoreAll() {
      let changed = false;
      for (const [chunk, saved] of originals) {
        try { changed = restoreChunk(chunk, saved) || changed; }
        catch (error) { log("NOTE PREVIEW RESTORE FAILED", { reason: error.message }); }
      }
      originals.clear();
      return changed;
    }

    function redraw(changed) {
      if (!changed) return;
      try { dev.invalidateServerTrackers(); }
      catch (error) { log("NOTE PREVIEW REDRAW FAILED", { reason: error.message }); }
    }

    function listen(enable) {
      if (enable === listening) return;
      listening = enable;
      const method = enable ? "addEventListener" : "removeEventListener";
      document[method](eventName, onChunksUpdate);
      window[method]("pagehide", onPageHide);
      window[method]("pageshow", onPageShow);
    }

    function sync() {
      if (busy || targetColor === null || suspended) return;
      busy = true;
      let changed = false;
      try {
        check(rendererIdentity(), "Note preview renderer identity changed");
        check(typeof dev.invalidateServerTrackers === "function",
          "Note preview redraw unavailable");
        const chunks = dev.m_Chunks;
        check(chunks?.m_ClassName === "XeGsGeometryChunks",
          "Note preview chunk collection unavailable");
        const command = doc.m_XeCommandProcessor;
        const active = window.noteEditorHandler?.isNoteEditorActive?.() === true &&
          command?.m_CommandStarted === true &&
          ["_OSNOTE", "_OSEDITNOTE_INTERNAL"].includes(command.m_CommandGlobalName);
        const current = new Set(active ? Object.values(chunks).filter(qualifies) : []);
        for (const [chunk, saved] of originals) {
          if (!current.has(chunk)) {
            changed = restoreChunk(chunk, saved) || changed;
            originals.delete(chunk);
          }
        }
        for (const chunk of current) {
          const descriptor = Object.getOwnPropertyDescriptor(chunk, "m_Color");
          check(descriptor && "value" in descriptor && descriptor.writable &&
            Number.isInteger(descriptor.value), "Unexpected Note preview color field");
          let saved = originals.get(chunk);
          if (!saved) {
            saved = { original: descriptor.value, applied: descriptor.value };
            originals.set(chunk, saved);
          } else if (descriptor.value !== saved.applied) {
            // Same object, but Onshape supplied a new native formatting color.
            saved.original = descriptor.value;
          }
          if (chunk.m_Color !== targetColor) {
            chunk.m_Color = targetColor;
            changed = true;
          }
          saved.applied = targetColor;
        }
      } catch (error) {
        changed = restoreAll() || changed;
        targetColor = null;
        listen(false);
        log("NOTE PREVIEW DISABLED", { reason: error.message });
      } finally {
        busy = false;
        redraw(changed);
      }
    }

    function onChunksUpdate(event) {
      if (event.m_Item === dev.m_Chunks) sync();
    }
    function onPageHide() {
      suspended = true;
      redraw(restoreAll());
    }
    function onPageShow() {
      suspended = false;
      sync();
    }

    return {
      setTheme(theme) {
        targetColor = theme ? (0xC2000000 | parseInt(theme.foreground.slice(1), 16)) : null;
        listen(targetColor !== null);
        if (targetColor === null) redraw(restoreAll());
        else sync();
      },
      report: () => ({
        listening, suspended, targetColor, retainedObjects: originals.size,
        chunks: Array.from(originals, ([chunk, saved]) => ({
          id: chunk.m_Id, original: saved.original,
          applied: saved.applied, current: chunk.m_Color
        }))
      })
    };
  }

  function resolve() {
    check(typeof window.getXeApplication === "function", "engine not ready");
    const app = window.getXeApplication();
    const docs = Object.entries(app?.m_XeDocuments ?? {});
    check(docs.length === 1, `expected one document; found ${docs.length}`);
    const [key, doc] = docs[0];
    const dev = doc?.m_XeGsDevice;
    check(typeof dev?.invalidateScene === "function",
      "scene invalidation not ready");
    const pal = dev?.getPalette?.()?.getPalette?.();
    check(Array.isArray(pal) && pal.length === 256 && packed(pal[7]),
      "palette not ready or unexpected");
    const layout = doc?.m_XeDatabase?.m_XeLayout;
    const paper = layout?.m_Paper;
    check(paper?.m_ClassName === "XeLayoutPaper", "paper not ready");
    const d = Object.getOwnPropertyDescriptor(
      paper,
      "m_PaperBackColor"
    );
    check(d && "value" in d && d.writable && packed(d.value),
      "surround field not ready or unexpected");
    const scene = paper.m_Scene;
    check(Array.isArray(scene?.children), "scene not ready");

    const candidates = scene.children.filter(m =>
      m?.material?.shader?.shaderName === "PaperOptimized");
    const fillCandidates = candidates.filter(m => m?.xegltype === 4);
    const outlineCandidates = candidates.filter(m => m?.xegltype === 1);

    check(fillCandidates.length === 1,
      `expected one PaperOptimized TRIANGLES sheet fill; found ${fillCandidates.length} among ${candidates.length} PaperOptimized objects`);
    check(outlineCandidates.length >= 1,
      `expected a PaperOptimized LINES sheet outline; found ${outlineCandidates.length}`);

    const mesh = fillCandidates[0];
    const material = mesh.material;
    const color = material.uniforms.color;
    check(rgb(color),
      "sheet-fill color uniform not ready or unexpected");

    const snapshot = () => ({
      ink: pal[7],
      paper: color.slice(),
      surround: paper.m_PaperBackColor
    });

    const original = snapshot();
    let activePreset = null;
    let activeTheme = null;

    const identity = () => {
      const a = window.getXeApplication();
      return a === app &&
        a?.m_XeDocuments?.[key] === doc &&
        doc.m_XeGsDevice === dev &&
        dev.getPalette().getPalette() === pal &&
        doc.m_XeDatabase?.m_XeLayout === layout &&
        layout.m_Paper === paper &&
        paper.m_Scene === scene &&
        scene.children.includes(mesh) &&
        mesh.xegltype === 4 &&
        mesh.material === material &&
        material.shader?.shaderName === "PaperOptimized" &&
        material.uniforms.color === color;
    };

    const notePreview = createNotePreview(doc, dev, identity);

    const write = values => {
      pal[7] = values.ink;
      for (let i = 0; i < 3; i++) {
        color[i] = values.paper[i];
      }
      paper.m_PaperBackColor = values.surround;
    };

    const matches = values =>
      pal[7] === values.ink &&
      values.paper.every((n, i) => color[i] === n) &&
      paper.m_PaperBackColor === values.surround;

    function change(action, values, theme, presetId = null) {
      let before;
      try {
        check(identity(), "renderer identity changed");
        check(typeof dev.invalidateScene === "function",
          "scene invalidation unavailable");
        before = snapshot();
        write(values);
        check(matches(values), "read-back mismatch");

        status = action === "APPLY" ? "applied" : "restored";
        activePreset = action === "APPLY" ? presetId : null;
        activeTheme = action === "APPLY" ? theme : null;

        log(`${action} OK`, {
          activePreset,
          activeTheme,
          original,
          current: snapshot(),
          packedColorEncoding: "0xBBGGRR",
          sheetResolver: {
            shaderName: "PaperOptimized",
            xegltype: mesh.xegltype,
            paperOptimizedObjects: candidates.length,
            lineObjects: outlineCandidates.length
          }
        });
      } catch (error) {
        status = "failed";
        log(`${action} FAILED`, { reason: error.message });

        if (before) {
          const errors = [];
          const undo = fn => {
            try {
              fn();
            } catch (error) {
              errors.push(error.message);
            }
          };

          undo(() => {
            pal[7] = before.ink;
          });
          for (let i = 0; i < 3; i++) {
            undo(() => {
              color[i] = before.paper[i];
            });
          }
          undo(() => {
            paper.m_PaperBackColor = before.surround;
          });

          log("ROLLBACK", {
            verified: matches(before),
            errors
          });
        }
        return false;
      }

      notePreview.setTheme(action === "APPLY" ? theme : null);

      // A redraw failure does not undo already-verified color writes.
      try {
        dev.invalidateScene();
        log(`${action} REDRAW REQUESTED`);
        return true;
      } catch (error) {
        log(`${action} REDRAW FAILED`, {
          reason: error.message,
          colorsVerified: matches(values)
        });
        return false;
      }
    }

    function apply(theme = DEFAULT_THEME) {
      let encoded;
      try {
        encoded = encodeTheme(theme);
      } catch (error) {
        log("APPLY REJECTED", {
          reason: error.message,
          status,
          activePreset,
          activeTheme,
          current: snapshot()
        });
        return false;
      }
      return change("APPLY", encoded.values, encoded.theme);
    }

    function applyPreset(presetId) {
      if (
        typeof presetId !== "string" ||
        !Object.prototype.hasOwnProperty.call(PRESETS, presetId)
      ) {
        log("PRESET REJECTED", {
          reason:
            `preset ID must be one of: ${Object.keys(PRESETS).join(", ")}`,
          status,
          activePreset,
          activeTheme,
          current: snapshot()
        });
        return false;
      }

      let encoded;
      try {
        encoded = encodeTheme(PRESETS[presetId].theme);
      } catch (error) {
        log("PRESET REJECTED", {
          reason: error.message,
          status,
          activePreset,
          activeTheme,
          current: snapshot()
        });
        return false;
      }

      return change(
        "APPLY",
        encoded.values,
        encoded.theme,
        presetId
      );
    }

    return {
      apply,
      applyPreset,
      listPresets,
      restore: () => {
        notePreview.setTheme(null);
        return change("RESTORE", original, null);
      },
      report: () => log("STATE", {
        status,
        activePreset,
        activeTheme,
        sameReferences: identity(),
        notePreview: notePreview.report(),
        original,
        current: snapshot(),
        sheetResolver: {
          shaderName: "PaperOptimized",
          xegltype: mesh.xegltype,
          paperOptimizedObjects: candidates.length,
          lineObjects: outlineCandidates.length
        }
      })
    };
  }

  Object.defineProperty(window, KEY, {
    configurable: true,
    value: Object.freeze({
      apply(theme) {
        if (controller) {
          return controller.apply(theme);
        }
        log("APPLY REJECTED", {
          reason: "renderer not ready",
          status
        });
        return false;
      },

      applyPreset(presetId) {
        if (controller) {
          return controller.applyPreset(presetId);
        }
        log("PRESET REJECTED", {
          reason: "renderer not ready",
          status
        });
        return false;
      },

      listPresets,

      restore() {
        stopped = true;
        clearTimeout(timer);
        clearTimeout(settingsTimer);
        lastAttemptedPreset = null;
        lastAttemptedEnabled = null;
        if (controller) {
          return controller.restore();
        }
        status = "stopped";
        log("STOPPED; no colors applied");
      },

      report() {
        log("BRIDGE STATE", {
          settingsStatus,
          desiredPreset,
          desiredEnabled,
          lastAttemptedPreset,
          lastAttemptedEnabled
        });
        if (controller) {
          controller.report();
        } else {
          log("STATE", { status });
        }
      }
    })
  });

  log("BOOT", {
    version: VERSION,
    revision: REVISION,
    timeOrigin: performance.timeOrigin,
    startupLimitMs: 60000
  });
  window.postMessage({
    channel: CHANNEL,
    protocol: PROTOCOL,
    direction: "main-to-isolated",
    type: "ready"
  }, location.origin);
  log("BRIDGE READY SENT", { settingsWaitMs: SETTINGS_WAIT_MS });
  settingsTimer = setTimeout(() => {
    if (desiredPreset !== null) return;
    settingsStatus = "fallback";
    desiredPreset = DEFAULT_PRESET;
    desiredEnabled = true;
    log("SETTINGS FALLBACK", { desiredPreset, desiredEnabled });
    applyDesiredPreset("settings-timeout");
  }, SETTINGS_WAIT_MS);

  function attempt() {
    if (stopped) {
      return;
    }

    try {
      controller = resolve();
    } catch (error) {
      if (performance.now() - started >= 60000) {
        status = "timeout";
        log("ABORT; no colors applied", {
          reason: error.message
        });
      } else {
        timer = setTimeout(attempt, 500);
      }
      return;
    }

    log("RENDERER READY", { settingsStatus, desiredPreset, desiredEnabled });
    applyDesiredPreset("renderer-ready"); // No retries after a mutation attempt.
  }

  attempt();
})();
