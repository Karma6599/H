'use strict';

const FEATURE_ID = 25;

const FPS_COUNTER = 25;

const MENU_LABEL_EN = 'FPS counter';
const MENU_LABEL_RU = 'Счётчик FPS';
const SETTINGS_KEY = 'INFO_FPS';

const TELEMETRY_WINDOW_MS = 1000;
const MAX_SAMPLES = 120;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function formatFps(fps) {
  return 'FPS: ' + Math.max(0, Math.round(fps));
}

function createFpsCounter(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const render = deps.render;

  let frameCount = 0;
  let windowStart = 0;
  let fps = 0;
  const samples = [];

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      frameCount = 0;
      windowStart = 0;
    } else if (render) {
      render('');
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    if (windowStart === 0) {
      windowStart = now;
      frameCount = 0;
      return;
    }
    frameCount++;
    const elapsed = now - windowStart;
    if (elapsed >= TELEMETRY_WINDOW_MS) {
      fps = (frameCount * TELEMETRY_WINDOW_MS) / elapsed;
      samples.push(fps);
      if (samples.length > MAX_SAMPLES) samples.shift();
      frameCount = 0;
      windowStart = now;
      if (render) {
        render(formatFps(fps));
      }
    }
  }

  function getState() {
    return {
      enabled: state.enabled,
      fps: Math.round(fps),
      average: samples.length
        ? Math.round(
            samples.reduce((a, b) => a + b, 0) / samples.length
          )
        : 0,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (render) render('');
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
  SETTINGS_KEY,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  label,
  formatFps,
  createFpsCounter,
};
