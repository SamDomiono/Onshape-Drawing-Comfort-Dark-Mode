(() => {
  "use strict";
  const VERSION = "0.1.1";
  const REVISION = "persistence-bridge-1";
  const KEY = "__onshapeComfortBridge01";
  const CHANNEL = "onshape-comfort-extension";
  const PROTOCOL = 1;
  const STORAGE_KEY = "selectedPreset";
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

  function postSettings(reason) {
    window.postMessage({
      channel: CHANNEL,
      protocol: PROTOCOL,
      direction: "isolated-to-main",
      type: "settings",
      selectedPreset,
      reason
    }, location.origin);
    log("SETTINGS SENT", { selectedPreset, reason });
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
    if (areaName !== "local" ||
        !Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) return;
    const next = changes[STORAGE_KEY].newValue;
    if (validPreset(next)) {
      selectedPreset = next;
      status = "ready";
      postSettings("storage-change");
      return;
    }
    log("INVALID STORAGE VALUE; RESETTING DEFAULT", { received: next });
    chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_PRESET })
      .catch(error => log("DEFAULT RESET FAILED", { reason: error.message }));
  });

  async function initialize() {
    try {
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      const value = stored[STORAGE_KEY];
      if (validPreset(value)) {
        selectedPreset = value;
        status = "ready";
        postSettings("storage-load");
        return;
      }
      selectedPreset = DEFAULT_PRESET;
      await chrome.storage.local.set({ [STORAGE_KEY]: selectedPreset });
      status = "ready";
      postSettings(value === undefined ? "default-initialized" : "invalid-repaired");
    } catch (error) {
      status = "failed";
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
      log("STATE", { status, selectedPreset, storageKey: STORAGE_KEY });
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