'use strict';

const MENU_OPTION_KEYS = [
  'motion',
  'compact',
  'fpsUnlock',
  'emoteHud',
  'emoteRepeat',
  'onboardingSeen',
];
const IDX_MENU_MOTION = 0;
const IDX_MENU_COMPACT = 1;
const IDX_MENU_FPS_UNLOCK = 2;

const MIN_FRAME_RATE = 30;
const MAX_FRAME_RATE = 144;
const DEFAULT_FRAME_RATE = 60;

function clampFrameRate(value) {
  if (!Number.isFinite(value)) return DEFAULT_FRAME_RATE;
  return Math.max(MIN_FRAME_RATE, Math.min(MAX_FRAME_RATE, Math.round(value)));
}

function createFpsUnlock(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const setFrameRate = deps.setFrameRate;

  let frameRate = DEFAULT_FRAME_RATE;

  function readMenuOptions(saved) {
    const opts = saved || {};
    state.enabled = opts[MENU_OPTION_KEYS[IDX_MENU_FPS_UNLOCK]] === true;
    const raw = Number(opts.frameRate);
    frameRate = clampFrameRate(raw);
    return opts;
  }

  function apply() {
    if (!setFrameRate) return false;
    try {
      setFrameRate(state.enabled ? frameRate : DEFAULT_FRAME_RATE);
      return true;
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
      return false;
    }
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    apply();
    return state.enabled;
  }

  function applySaved(saved) {
    readMenuOptions(saved);
    apply();
  }

  function setFrameRateOption(value) {
    frameRate = clampFrameRate(value);
    if (state.enabled) apply();
    return frameRate;
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      frameRate: state.enabled ? frameRate : DEFAULT_FRAME_RATE,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    state.enabled = false;
    apply();
    state.disposed = true;
  }

  return {
    setEnabled,
    applySaved,
    setFrameRateOption,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  MENU_OPTION_KEYS,
  IDX_MENU_FPS_UNLOCK,
  MIN_FRAME_RATE,
  MAX_FRAME_RATE,
  DEFAULT_FRAME_RATE,
  clampFrameRate,
  createFpsUnlock,
};
