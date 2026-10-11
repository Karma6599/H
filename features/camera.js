'use strict';

const FEATURE_ID = 23;

const VISUAL_GROUP_IDS = [17, 18, 19, 20, 21, 22, 23];

const OPTION_MODE = 0;
const OPTION_FOV = 1;
const OPTION_EYE_HEIGHT = 2;

const MODE_CHASE = 0;
const MODE_FIRST_PERSON = 1;

const FOV_MIN = 50;
const FOV_MAX = 100;
const FOV_DEFAULT = 75;
const EYE_HEIGHT_MIN = 150;
const EYE_HEIGHT_MAX = 600;
const EYE_HEIGHT_DEFAULT = 350;

const HUD_KEY = 'hud';

const MENU_LABELS = {
  firstPersonPreview: 'FIRST PERSON (PREVIEW)',
  fieldOfView: 'FIELD OF VIEW',
  cameraHeight: 'CAMERA HEIGHT',
};

const MODE_EVENT = 'camera:mode';

const HUD_SLOT_ELEMENTS = 3;
const HUD_SLOT_COUNTER_A = 8;
const HUD_SLOT_COUNTER_B = 9;
const HUD_SLOT_FLAG = 10;
const HUD_SLOT_RECORDS = 11;
const HUD_SLOT_REVISION = 12;

function clampNumber(value, fallback, min, max) {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function normalizeCameraOptions(raw) {
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
  return [key, registry[id]];
}

function mapConfigEntry(categoryOf, entry) {
  const [featureId, elementList] = entry;
  return [categoryOf(featureId), elementList.length];
}

function isVisualGroupEnabled(featureStates) {
  return VISUAL_GROUP_IDS.some((id) => featureStates[id] === true);
}

function createCameraRuntime(deps) {
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
