(() => {
  "use strict";

  const REVISION = "preset-popup-2";
  const STORAGE_KEY = "selectedPreset";
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
  const radios = Array.from(document.querySelectorAll('input[name="preset"]'));
  let currentPreset = null;

  function isKnownPreset(presetId) {
    return Object.prototype.hasOwnProperty.call(PRESETS, presetId);
  }

  function showSelection(presetId) {
    for (const radio of radios) {
      radio.checked = radio.value === presetId;
    }
    currentPreset = presetId;
  }

  function showSaved(presetId) {
    status.classList.remove("error");
    statusLead.textContent = "Saved ·";
    savedName.textContent = PRESETS[presetId].name;
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
      const stored = await chrome.storage.local.get(STORAGE_KEY);
      let selectedPreset = stored[STORAGE_KEY];

      if (!isKnownPreset(selectedPreset)) {
        selectedPreset = DEFAULT_PRESET;
        showSelection(selectedPreset);
        await storePreset(selectedPreset);
      } else {
        showSelection(selectedPreset);
      }

      showSaved(selectedPreset);
      options.disabled = false;
    } catch (error) {
      console.error(`[Onshape Comfort ${REVISION}] initialization failed`, error);
      if (!isKnownPreset(currentPreset)) {
        showSelection(DEFAULT_PRESET);
      }
      showError("Could not read preset");
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
    showSaved(presetId);
    options.disabled = true;

    try {
      await storePreset(presetId);
    } catch (error) {
      console.error(`[Onshape Comfort ${REVISION}] storage write failed`, error);
      if (isKnownPreset(previousPreset)) {
        showSelection(previousPreset);
      }
      showError("Could not save preset");
    } finally {
      options.disabled = false;
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

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !Object.prototype.hasOwnProperty.call(changes, STORAGE_KEY)) {
      return;
    }

    const selectedPreset = changes[STORAGE_KEY].newValue;

    if (!isKnownPreset(selectedPreset)) {
      void repairExternalValue();
      return;
    }

    showSelection(selectedPreset);
    showSaved(selectedPreset);
  });

  console.info(`[Onshape Comfort ${REVISION}] BOOT`);
  void initialize();
})();
