'use strict';

const EDIT_HUD_LABEL_EN = 'EDIT HUD';
const EDIT_HUD_LABEL_RU = 'РЕДАКТИРОВАТЬ HUD';
const RESET_LAYOUT_LABEL_EN = 'RESET LAYOUT';
const RESET_LAYOUT_LABEL_RU = 'СБРОСИТЬ РАСПОЛОЖЕНИЕ';

const OPTION_KEYS = ['hudLayout', 'quickPosition', 'quickSlots'];
const IDX_HUD_LAYOUT = 0;

const DEFAULT_LAYOUT = {};
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const DEFAULT_SCALE = 1;
const SNAP_RADIUS = 12;

function editHudLabel(language) {
  return language === 'ru' ? EDIT_HUD_LABEL_RU : EDIT_HUD_LABEL_EN;
}

function resetLayoutLabel(language) {
  return language === 'ru' ? RESET_LAYOUT_LABEL_RU : RESET_LAYOUT_LABEL_EN;
}

function clampScale(value) {
  if (!Number.isFinite(value)) return DEFAULT_SCALE;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
}

function snapPosition(x, y) {
  const snappedX = Math.round(x / SNAP_RADIUS) * SNAP_RADIUS;
  const snappedY = Math.round(y / SNAP_RADIUS) * SNAP_RADIUS;
  return { x: snappedX, y: snappedY };
}

function createHudEditor(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    editing: false,
    selectedElement: null,
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const layoutStore = deps.layoutStore;
  const elements = deps.elements || [];

  let layout = DEFAULT_LAYOUT;
  let scale = DEFAULT_SCALE;

  function readLayout(saved) {
    const opts = saved || {};
    layout = opts[OPTION_KEYS[IDX_HUD_LAYOUT]] || DEFAULT_LAYOUT;
    const rawScale = Number(opts.scale);
    scale = clampScale(rawScale);
    return opts;
  }

  function persist() {
    if (!layoutStore) return false;
    try {
      layoutStore.set(OPTION_KEYS[IDX_HUD_LAYOUT], layout);
      return true;
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
      return false;
    }
  }

  function startEditing() {
    if (!state.enabled || state.editing) return false;
    state.editing = true;
    state.selectedElement = null;
    return true;
  }

  function stopEditing() {
    if (!state.editing) return false;
    state.editing = false;
    state.selectedElement = null;
    return persist();
  }

  function selectElement(elementId) {
    if (!state.editing) return false;
    const found = elements.some(
      (element) => element.id === elementId
    );
    if (!found) return false;
    state.selectedElement = elementId;
    return true;
  }

  function moveSelected(x, y) {
    if (!state.editing || state.selectedElement === null) return false;
    const snapped = snapPosition(x, y);
    layout[state.selectedElement] = {
      x: snapped.x,
      y: snapped.y,
      scale,
    };
    return true;
  }

  function resetLayout() {
    layout = DEFAULT_LAYOUT;
    state.selectedElement = null;
    return persist();
  }

  function setScale(value) {
    scale = clampScale(value);
    if (state.selectedElement !== null) {
      layout[state.selectedElement] = Object.assign(
        {},
        layout[state.selectedElement],
        { scale }
      );
    }
    return scale;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      startEditing();
    } else {
      stopEditing();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    readLayout(saved);
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      editing: state.editing,
      selectedElement: state.selectedElement,
      elementCount: elements.length,
      layout: Object.assign({}, layout),
      scale,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    stopEditing();
    state.disposed = true;
  }

  return {
    setEnabled,
    applySaved,
    startEditing,
    stopEditing,
    selectElement,
    moveSelected,
    resetLayout,
    setScale,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  OPTION_KEYS,
  EDIT_HUD_LABEL_EN,
  EDIT_HUD_LABEL_RU,
  RESET_LAYOUT_LABEL_EN,
  RESET_LAYOUT_LABEL_RU,
  editHudLabel,
  resetLayoutLabel,
  clampScale,
  snapPosition,
  createHudEditor,
};
