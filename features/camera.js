'use strict';

// Camera — the view-mode switcher of the visual runtime (feature id 23).
// Modes: chase (default) / firstPerson preview, with clamped fov and
// eyeHeight options. The runtime itself lives in the shared visual
// runtime factory (the 65-function closure subtree documented in
// chromatic_name.md); this module carries the camera slice: the config
// model, the clamped option writer, the feature-group enable test and
// the getState view consumed by the HUD/menus.
//
// Reconstructed from the JirGear QuickJS bytecode (see camera.md for the
// disassembly excerpts and the raw runtime keys).

// Feature id 23 (fn_488 constant slot). The camera toggle is stored in
// the global settings page under the plaintext key 'camera'.
const FEATURE_ID = 23;

// The visual feature group (fn_488 loc_1468 = [17..23]): the whole visual
// runtime is enabled when any member feature is on.
const VISUAL_GROUP_IDS = [17, 18, 19, 20, 21, 22, 23];

// Options schema (fn_488 options category 5): index -> key.
const OPTION_MODE = 0;
const OPTION_FOV = 1;
const OPTION_EYE_HEIGHT = 2;

// Mode enum (values are the settings store encodings).
const MODE_CHASE = 0;
const MODE_FIRST_PERSON = 1;

// Option ranges (menu writers clamp through the shared clamp helper;
// FIELD OF VIEW 50..100 default 75, CAMERA HEIGHT 150..600 default 350).
const FOV_MIN = 50;
const FOV_MAX = 100;
const FOV_DEFAULT = 75;
const EYE_HEIGHT_MIN = 150;
const EYE_HEIGHT_MAX = 600;
const EYE_HEIGHT_DEFAULT = 350;

// The camera page also owns a plain `hud` flag next to mode/fov/eyeHeight
// in the global page schema (serverRegion category carries the same key).
const HUD_KEY = 'hud';

// Menu labels (fn_488 strings table, sequential menu rows).
const MENU_LABELS = {
  firstPersonPreview: 'FIRST PERSON (PREVIEW)',
  fieldOfView: 'FIELD OF VIEW',
  cameraHeight: 'CAMERA HEIGHT',
};

// Event emitted when the mode changes (dispatched on the shared bus).
const MODE_EVENT = 'camera:mode';

// The 13-slot shared HUD record (visual runtime factory):
// [0] ''        [1] 0          [2] 0          [3] Map (hud elements)
// [4] []        [5] Map        [6] Map        [7] []
// [8] 0         [9] 0          [10] false     [11] [] (records)
// [12] 0 (revision)
// Slot indexes used by getCameraState below.
const HUD_SLOT_ELEMENTS = 3;
const HUD_SLOT_COUNTER_A = 8;
const HUD_SLOT_COUNTER_B = 9;
const HUD_SLOT_FLAG = 10;
const HUD_SLOT_RECORDS = 11;
const HUD_SLOT_REVISION = 12;

function clampNumber(value, fallback, min, max) {
  // fn_1516 — shared config clamp. Non-numbers fall back, finite values
  // are clamped into [min, max] through Math.max(min, Math.min(max, v)).
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function normalizeCameraOptions(raw) {
  // Option writer used by the menu rows (FIELD OF VIEW / CAMERA HEIGHT)
  // and by applySaved. Mode is validated against the enum, fov and
  // eyeHeight go through the shared clamp.
  const opts = raw || {};
  const mode =
    opts.mode === MODE_FIRST_PERSON ? MODE_FIRST_PERSON : MODE_CHASE;
  return {
    mode,
    fov: clampNumber(opts.fov, FOV_DEFAULT, FOV_MIN, FOV_MAX),
    eyeHeight: clampNumber(
      opts.eyeHeight, EYE_HEIGHT_DEFAULT, EYE_HEIGHT_MIN, EYE_HEIGHT_MAX
    ),
  };
}

function entryToPair(registry, key, id) {
  // fn_1695 — the fromEntries mapper for the feature-id view: pairs each
  // numeric feature id with its registry key string.
  return [key, registry[id]];
}

function mapConfigEntry(categoryOf, entry) {
  // fn_756 — maps one [featureId, elementList] config entry to its
  // export view: [category label, element count].
  const [featureId, elementList] = entry;
  return [categoryOf(featureId), elementList.length];
}

function isVisualGroupEnabled(featureStates) {
  // fn_2632 (contract) — the visual runtime master enable: true when any
  // feature of the 17..23 group is enabled. featureStates is the
  // id -> enabled map produced from the settings store.
  return VISUAL_GROUP_IDS.some((id) => featureStates[id] === true);
}

function createCameraRuntime(deps) {
  // Camera slice of the visual runtime factory. deps:
  //   base        the libg base pointer (required by the runtime)
  //   log         logger (defaults to a silent one)
  //   registry    feature-id -> settings key map (from fn_488)
  //   featureStates()  id -> enabled snapshot (the [17..23] view)
  //   viewState()      shared HUD/world view record (13-slot record)
  //   scanner()        battle object scanner (contract, see notes)
  //   caches           { elements: Map, names: Map } shared caches
  //   firstPerson      the first-person preview substate or null
  if (!deps.base) {
    throw new Error('Visual runtime requires libg base');
  }

  const log = deps.log || function () {};
  const registry = deps.registry || {};
  const options = normalizeCameraOptions(deps.savedOptions);

  const state = {
    enabled: isVisualGroupEnabled(deps.featureStates()),
    mode: options.mode,
    fov: options.fov,
    eyeHeight: options.eyeHeight,
    disposed: false,
    lastError: '',
  };

  function setMode(mode) {
    const next = mode === MODE_FIRST_PERSON ? MODE_FIRST_PERSON : MODE_CHASE;
    if (next === state.mode) return true;
    state.mode = next;
    deps.events && deps.events.emit(MODE_EVENT, { mode: next });
    return true;
  }

  function setFov(fov) {
    state.fov = clampNumber(fov, state.fov, FOV_MIN, FOV_MAX);
    return state.fov;
  }

  function setEyeHeight(eyeHeight) {
    state.eyeHeight = clampNumber(
      eyeHeight, state.eyeHeight, EYE_HEIGHT_MIN, EYE_HEIGHT_MAX
    );
    return state.eyeHeight;
  }

  function applySaved(saved) {
    const opts = normalizeCameraOptions(saved);
    state.mode = opts.mode;
    state.fov = opts.fov;
    state.eyeHeight = opts.eyeHeight;
  }

  function getCameraState() {
    // fn_476 — the getState view. The five raw runtime keys are renamed:
    // elementsCacheSize, nameCacheSize, renderContext, cameraActive and
    // optionViews (decode map in _RECONSTRUCTION_NOTES.md).
    const view = deps.viewState();
    const hud = view[HUD_SLOT_ELEMENTS] || new Map();
    const records = view[HUD_SLOT_RECORDS] || [];

    return {
      enabled: isVisualGroupEnabled(deps.featureStates()),
      camera: {
        mode: state.mode,
        fov: state.fov,
        eyeHeight: state.eyeHeight,
      },
      firstPerson: deps.firstPerson
        ? deps.firstPerson.getState()
        : null,
      disposed: state.disposed,
      lastError: state.lastError,
      elementsCacheSize: deps.caches.elements.size,
      nameCacheSize: deps.caches.names.size,
      renderContext: deps.renderContext != null,
      cameraActive: view[HUD_SLOT_FLAG] === true,
      optionViews: Object.fromEntries(
        Object.entries(deps.featureGroups || {}).map((entry) =>
          mapConfigEntry(deps.categoryOf || (() => 'utility'), entry)
        )
      ),
      hud: {
        revision: view[HUD_SLOT_REVISION],
        records: records.slice(),
        counterA: view[HUD_SLOT_COUNTER_A],
        counterB: view[HUD_SLOT_COUNTER_B],
        active: view[HUD_SLOT_FLAG] === true,
        elements: Array.from(hud.values()),
      },
    };
  }

  function dispose() {
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    setMode,
    setFov,
    setEyeHeight,
    applySaved,
    getState: getCameraState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  VISUAL_GROUP_IDS,
  MODE_CHASE,
  MODE_FIRST_PERSON,
  FOV_MIN,
  FOV_MAX,
  FOV_DEFAULT,
  EYE_HEIGHT_MIN,
  EYE_HEIGHT_MAX,
  EYE_HEIGHT_DEFAULT,
  MENU_LABELS,
  MODE_EVENT,
  clampNumber,
  normalizeCameraOptions,
  isVisualGroupEnabled,
  createCameraRuntime,
};
