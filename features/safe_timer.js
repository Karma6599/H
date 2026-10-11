'use strict';

const FEATURE_ID = 35;

const SAFE_TIMER = 35;

const MENU_LABEL_EN = 'Safe shield timer';
const MENU_LABEL_RU = 'Щит сейфа';

const CHAR_CODE_KEY = [115, 97, 102, 101, 95, 116, 105, 109, 101, 114];

const REFRESH_INTERVAL_MS = 120;

const MAX_SHIELD_MS = 60000;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function formatTimer(remainingMs) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return seconds > 0 ? 'SAFE: ' + seconds + 's' : 'SAFE: DOWN';
}

function createSafeTimer(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readSafeShield = deps.readSafeShield;
  const render = deps.render;

  let shieldEndsAt = 0;
  let lastRefreshAt = 0;

  function remaining(now) {
    if (!shieldEndsAt) return 0;
    return Math.max(0, shieldEndsAt - now);
  }

  function refresh(now) {
    if (!readSafeShield) return;
    const shield = readSafeShield();
    if (shield && typeof shield.shieldMs === 'number' &&
        isFinite(shield.shieldMs)) {
      shieldEndsAt = now + Math.min(shield.shieldMs, MAX_SHIELD_MS);
    } else {
      shieldEndsAt = 0;
    }
    lastRefreshAt = now;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      shieldEndsAt = 0;
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
    if (now - lastRefreshAt >= REFRESH_INTERVAL_MS) {
      refresh(now);
    }
    if (render) {
      render(formatTimer(remaining(now)));
    }
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      shieldEndsAt: shieldEndsAt,
      lastRefreshAt: lastRefreshAt,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    shieldEndsAt = 0;
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    SAFE_TIMER,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    FEATURE_KEY: buildKey(),
    REFRESH_INTERVAL_MS,
    MAX_SHIELD_MS,
    label,
    buildKey,
    formatTimer,
    refresh,
    remaining,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SAFE_TIMER,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  REFRESH_INTERVAL_MS,
  MAX_SHIELD_MS,
  label,
  buildKey,
  formatTimer,
  createSafeTimer,
};
