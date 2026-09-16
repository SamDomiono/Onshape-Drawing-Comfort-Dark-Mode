(() => {
  "use strict";

  const REVISION = "preset-popup-toggle-1";
  const STORAGE_KEY = "selectedPreset";
  const ENABLED_KEY = "enabled";
  const DEFAULT_PRESET = "warm_drafting";

  const PRESETS = Object.freeze({
    warm_drafting: Object.freeze({
      name: "Warm Drafting",
      blurb: "Paper tan · walnut ink",
      sheet: "#D8D0BC",
      foreground: "#3F3D38",
      surround: "#50575A"
    }),
    slate_graphite: Object.freeze({
      name: "Slate Graphite",
      blurb: "Cool graphite · low glare",
      sheet: "#1D2023",
      foreground: "#929AA4",
      surround: "#42484E"
    }),
    industrial_cyanotype: Object.freeze({
      name: "Industrial Cyanotype",
      blurb: "Blueprint night · steel ink",
      sheet: "#0E2238",
      foreground: "#8AA9C7",
      surround: "#3A4148"
    })
  });

  const options = document.querySelector("#preset-options");
  const status = document.querySelector("#status");
  const statusLead = document.querySelector("#status-lead");
  const savedName = document.querySelector("#saved-name");
  const footerHint = document.querySelector("#footer-hint");
  const toggle = document.querySelector("#comfort-enabled");
  const enableLabel = document.querySelector("#enable-label");
  const radios = Array.from(document.querySelectorAll('input[name="preset"]'));
  let currentPreset = null;
  let currentEnabled = null;
  let busy = true;

  function isKnownPreset(presetId) {
    return Object.prototype.hasOwnProperty.call(PRESETS, presetId);
  }

  function showSelection(presetId) {
    for (const radio of radios) {
      radio.checked = radio.value === presetId;
    }
    currentPreset = presetId;
  }

  function showSaved() {
    if (!isKnownPreset(currentPreset) || typeof currentEnabled !== "boolean") return;
    status.classList.remove("error");
    statusLead.textContent = currentEnabled ? "Saved ·" : "Paused ·";
    savedName.textContent = PRESETS[currentPreset].name;
    footerHint.textContent = currentEnabled ? "applies instantly" : "switch on to apply";
  }

  function showEnabled(enabled) {
    currentEnabled = enabled;
    toggle.checked = enabled;
    enableLabel.textContent = enabled ? "ON" : "OFF";
    document.body.classList.toggle("paused", !enabled);
    options.disabled = busy || !enabled;
    toggle.disabled = busy;
    showSaved();
  }

  function showError(message) {
    status.classList.add("error");
    statusLead.textContent = message;
    savedName.textContent = "";
  }

  async function storePreset(presetId) {
    if (!isKnownPreset(presetId)) {
      throw new Error("Unknown preset ID rejected.");
    }
    await chrome.storage.local.set({ [STORAGE_KEY]: presetId });
  }

  async function initialize() {
    try {
      const stored = await chrome.storage.local.get([STORAGE_KEY, ENABLED_KEY]);
      let selectedPreset = stored[STORAGE_KEY];
      let enabled = stored[ENABLED_KEY];
      const repair = {};

      if (!isKnownPreset(selectedPreset)) {
        selectedPreset = DEFAULT_PRESET;
        repair[STORAGE_KEY] = selectedPreset;
      }
      if (typeof enabled !== "boolean") {
        enabled = true;
        repair[ENABLED_KEY] = enabled;
      }

      showSelection(selectedPreset);
      showEnabled(enabled);
      if (Object.keys(repair).length) await chrome.storage.local.set(repair);

      busy = false;
      showEnabled(enabled);
    } catch (error) {
      console.error(`[Onshape Comfort ${REVISION}] initialization failed`, error);
      if (!isKnownPreset(currentPreset)) {
        showSelection(DEFAULT_PRESET);
      }
      showError("Could not read preset");
      busy = true;
      options.disabled = true;
      toggle.disabled = true;
    }
  }

  async function handleSelection(event) {
    const presetId = event.target.value;
    const previousPreset = currentPreset;

    if (!isKnownPreset(presetId)) {
      showError("Unknown preset rejected");
      return;
    }

    if (presetId === previousPreset) {
      return;
    }

    showSelection(presetId);
    busy = true;
    showSaved();
    options.disabled = true;
    toggle.disabled = true;

    try {
      await storePreset(presetId);
    } catch (error) {
      console.error(`[Onshape Comfort ${REVISION}] storage write failed`, error);
      if (isKnownPreset(previousPreset)) {
        showSelection(previousPreset);
      }
      showError("Could not save preset");
    } finally {
      busy = false;
      options.disabled = !currentEnabled;
      toggle.disabled = false;
    }
  }

  async function handleToggle() {
    const previous = currentEnabled;
    const next = toggle.checked;
    if (typeof previous !== "boolean" || next === previous) return;
    busy = true;
    showEnabled(next);

    try {
      await chrome.storage.local.set({ [ENABLED_KEY]: next });
    } catch (error) {
      console.error(`[Onshape Comfort ${REVISION}] toggle write failed`, error);
      showEnabled(previous);
      showError("Could not save switch");
    } finally {
      busy = false;
      options.disabled = !currentEnabled;
      toggle.disabled = false;
    }
  }

  async function repairExternalValue() {
    const previousPreset = currentPreset;
    showSelection(DEFAULT_PRESET);

    try {
      await storePreset(DEFAULT_PRESET);
    } catch (error) {
      console.error(`[Onshape Comfort ${REVISION}] storage repair failed`, error);
      if (isKnownPreset(previousPreset)) {
        showSelection(previousPreset);
      }
      showError("Could not repair saved preset");
    }
  }

  for (const radio of radios) {
    radio.addEventListener("change", handleSelection);
  }
  toggle.addEventListener("change", handleToggle);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;

    if (Object.prototype.hasOwnProperty.call(changes, ENABLED_KEY)) {
      const enabled = changes[ENABLED_KEY].newValue;
      if (typeof enabled === "boolean") {
        showEnabled(enabled);
      } else {
        void chrome.storage.local.set({ [ENABLED_KEY]: true })
          .catch(error => showError(`Could not repair switch: ${error.message}`));
      }
    }

    if (!Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) return;

    const selectedPreset = changes[STORAGE_KEY].newValue;

    if (!isKnownPreset(selectedPreset)) {
      void repairExternalValue();
      return;
    }

    showSelection(selectedPreset);
    showSaved();
  });

  console.info(`[Onshape Comfort ${REVISION}] BOOT`);
  void initialize();
})();
