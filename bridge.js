(() => {
  "use strict";
  const VERSION = "0.1.1";
  const REVISION = "drawing-ui-toggle-bridge-1";
  const KEY = "__onshapeComfortBridge01";
  const CHANNEL = "onshape-comfort-extension";
  const PROTOCOL = 1;
  const STORAGE_KEY = "selectedPreset";
  const ENABLED_KEY = "enabled";
  const PRESET_ATTRIBUTE = "data-oce-preset";
  const ENABLED_ATTRIBUTE = "data-oce-enabled";
  const DEFAULT_PRESET = "warm_drafting";
  const VALID_PRESETS = Object.freeze([
    "warm_drafting",
    "slate_graphite",
    "industrial_cyanotype"
  ]);
  const validPreset = value =>
    typeof value === "string" && VALID_PRESETS.includes(value);
  if (Object.prototype.hasOwnProperty.call(globalThis, KEY)) return;
  const id = crypto.randomUUID().slice(0, 8);
  const log = (message, data = {}) =>
    console.log(`[Comfort BRIDGE ${id}] ${message} ${JSON.stringify(data)}`);
  let status = "loading";
  let selectedPreset = DEFAULT_PRESET;
  let enabled = true;

  function syncPresetMarker() {
    document.documentElement.setAttribute(ENABLED_ATTRIBUTE, String(enabled));
    if (validPreset(selectedPreset)) {
      document.documentElement.setAttribute(PRESET_ATTRIBUTE, selectedPreset);
      return;
    }
    document.documentElement.removeAttribute(PRESET_ATTRIBUTE);
  }

  function postSettings(reason) {
    syncPresetMarker();
    window.postMessage({
      channel: CHANNEL,
      protocol: PROTOCOL,
      direction: "isolated-to-main",
      type: "settings",
      selectedPreset,
      enabled,
      reason
    }, location.origin);
    log("SETTINGS SENT", { selectedPreset, enabled, reason });
  }

  function isMainMessage(event, type) {
    const data = event.data;
    return event.source === window && event.origin === location.origin &&
      data && typeof data === "object" && !Array.isArray(data) &&
      data.channel === CHANNEL && data.protocol === PROTOCOL &&
      data.direction === "main-to-isolated" && data.type === type;
  }

  window.addEventListener("message", event => {
    if (!isMainMessage(event, "ready")) return;
    log("MAIN READY RECEIVED");
    if (status === "ready") postSettings("main-ready");
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    const hasPreset = Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY);
    const hasEnabled = Object.prototype.hasOwnProperty.call(changes, ENABLED_KEY);
    if (!hasPreset && !hasEnabled) return;

    const nextPreset = hasPreset ? changes[STORAGE_KEY].newValue : selectedPreset;
    const nextEnabled = hasEnabled ? changes[ENABLED_KEY].newValue : enabled;
    const repair = {};
    if (!validPreset(nextPreset)) repair[STORAGE_KEY] = DEFAULT_PRESET;
    if (typeof nextEnabled !== "boolean") repair[ENABLED_KEY] = true;
    if (Object.keys(repair).length) {
      // Preserve the valid half of a mixed storage update while repairing the
      // invalid half, so the subsequent repair event relays the complete pair.
      if (validPreset(nextPreset)) selectedPreset = nextPreset;
      if (typeof nextEnabled === "boolean") enabled = nextEnabled;
      log("INVALID STORAGE VALUE; RESETTING DEFAULT", { repair });
      chrome.storage.local.set(repair)
        .catch(error => log("DEFAULT RESET FAILED", { reason: error.message }));
      return;
    }
    selectedPreset = nextPreset;
    enabled = nextEnabled;
    status = "ready";
    postSettings("storage-change");
  });

  async function initialize() {
    try {
      const stored = await chrome.storage.local.get([STORAGE_KEY, ENABLED_KEY]);
      const value = stored[STORAGE_KEY];
      const state = stored[ENABLED_KEY];
      selectedPreset = validPreset(value) ? value : DEFAULT_PRESET;
      enabled = typeof state === "boolean" ? state : true;
      const repair = {};
      if (!validPreset(value)) repair[STORAGE_KEY] = selectedPreset;
      if (typeof state !== "boolean") repair[ENABLED_KEY] = enabled;
      if (Object.keys(repair).length) await chrome.storage.local.set(repair);
      status = "ready";
      postSettings(Object.keys(repair).length ? "settings-repaired" : "storage-load");
    } catch (error) {
      status = "failed";
      document.documentElement.removeAttribute(PRESET_ATTRIBUTE);
      document.documentElement.removeAttribute(ENABLED_ATTRIBUTE);
      log("STORAGE INITIALIZATION FAILED", { reason: error.message });
    }
  }

  const api = Object.freeze({
    async getSelectedPreset() {
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      return validPreset(stored[STORAGE_KEY])
        ? stored[STORAGE_KEY]
        : DEFAULT_PRESET;
    },
    async getEnabled() {
      const stored = await chrome.storage.local.get(ENABLED_KEY);
      return typeof stored[ENABLED_KEY] === "boolean" ? stored[ENABLED_KEY] : true;
    },
    async setEnabled(next) {
      if (typeof next !== "boolean") return false;
      try {
        await chrome.storage.local.set({ [ENABLED_KEY]: next });
        enabled = next;
        status = "ready";
        postSettings("api-set-enabled");
        return true;
      } catch (error) {
        log("ENABLED SET FAILED", { reason: error.message });
        return false;
      }
    },
    async setSelectedPreset(presetId) {
      if (!validPreset(presetId)) {
        log("SET REJECTED", { presetId });
        return false;
      }
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: presetId });
        selectedPreset = presetId;
        status = "ready";
        postSettings("api-set");
        return true;
      } catch (error) {
        log("SET FAILED", { presetId, reason: error.message });
        return false;
      }
    },
    async reset() {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_PRESET });
        selectedPreset = DEFAULT_PRESET;
        status = "ready";
        postSettings("api-reset");
        return true;
      } catch (error) {
        log("RESET FAILED", { reason: error.message });
        return false;
      }
    },
    report() {
      log("STATE", {
        status,
        selectedPreset,
        enabled,
        storageKey: STORAGE_KEY,
        enabledKey: ENABLED_KEY,
        presetAttribute: document.documentElement.getAttribute(PRESET_ATTRIBUTE),
        enabledAttribute: document.documentElement.getAttribute(ENABLED_ATTRIBUTE)
      });
    }
  });

  Object.defineProperty(globalThis, KEY, {
    configurable: true,
    value: api
  });
  log("BOOT", { version: VERSION, revision: REVISION,
    validPresets: VALID_PRESETS });
  initialize();
})();
