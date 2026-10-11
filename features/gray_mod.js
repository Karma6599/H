'use strict';

const FEATURE_ID = 39;

const GRAY_MOD = 39;

const MENU_LABEL_EN = 'Gray mod';
const MENU_LABEL_RU = 'Грей мод';

const DESCRIPTION_EN =
  "Control Gray's portal distance with the stick and place it through walls";
const DESCRIPTION_RU =
  'Управление дальностью портала Грея стиком и установка через стены';

const GRAY_MOD_KEY = 'gray_mod';
const CHAR_CODE_KEY = [103, 114, 97, 121, 95, 109, 111, 100];

const STICK_DEAD_ZONE = 0.15;
const MIN_PORTAL_DISTANCE = 0;
const MAX_PORTAL_DISTANCE = 1;
const PLACEMENT_INTERVAL_MS = 90;
const WALL_PLACE = true;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function description(language) {
  return language === 'ru' ? DESCRIPTION_RU : DESCRIPTION_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createGrayMod(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    placing: false,
    portalDistance: MAX_PORTAL_DISTANCE,
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readStick = deps.readStick;
  const isGraySelected = deps.isGraySelected;
  const placePortal = deps.placePortal;

  let lastPlacementMs = 0;

  function stickDistance() {
    const stick = readStick ? readStick() : null;
    if (!stick) return null;
    const magnitude = Math.hypot(stick.x, stick.y);
    if (magnitude <= STICK_DEAD_ZONE) return null;
    return Math.min(1, (magnitude - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE));
  }

  function tick(now) {
    if (!state.enabled) {
      state.placing = false;
      return;
    }
    if (typeof now !== 'number') now = Date.now();
    if (isGraySelected && !isGraySelected()) return;
    const distance = stickDistance();
    if (distance === null) {
      state.placing = false;
      return;
    }
    state.portalDistance = Math.max(
      MIN_PORTAL_DISTANCE,
      Math.min(MAX_PORTAL_DISTANCE, distance)
    );
    if (state.placing && now - lastPlacementMs < PLACEMENT_INTERVAL_MS) return;
    try {
      if (placePortal &&
          placePortal(state.portalDistance, WALL_PLACE)) {
        lastPlacementMs = now;
        state.placing = true;
      }
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
    }
  }

  function setEnabled(value) {
    state.enabled = value === true;
    if (!state.enabled) state.placing = false;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function getState() {
    return {
      enabled: state.enabled,
      key: buildKey(),
      placing: state.placing,
      portalDistance: state.portalDistance,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    state.placing = false;
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  GRAY_MOD_KEY,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  description,
  label,
  buildKey,
  createGrayMod,
};
