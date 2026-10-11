'use strict';

const FEATURE_ID = 33;

const GADGET_TIMER = 33;

const MENU_LABEL_EN = 'Gadget cooldown';
const MENU_LABEL_RU = 'Кулдаун гаджета';

const GADGET_TIMER_KEY = 'gadget_timer';

const CHAR_CODE_KEY = [103, 97, 100, 103, 101, 116, 95, 116, 105, 109, 101, 114];

const REFRESH_INTERVAL_MS = 120;
const MAX_GADGET_COOLDOWN_MS = 20000;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function formatCooldown(remainingMs) {
  const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
  return seconds > 0 ? 'GADGET: ' + seconds + 's' : 'GADGET: READY';
}

function createGadgetTimer(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readGadgetState = deps.readGadgetState;
  const render = deps.render;

  let cooldownEndsAt = 0;

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      cooldownEndsAt = 0;
    } else if (render) {
      render('');
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled !== false : true;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    try {
      const gadget = readGadgetState ? readGadgetState() : null;
      if (!gadget) {
        if (render) render('');
        return;
      }
      if (gadget.ready) {
        cooldownEndsAt = 0;
        if (render) render(formatCooldown(0));
        return;
      }
      if (gadget.cooldownEndsAt !== undefined &&
          gadget.cooldownEndsAt > now) {
        cooldownEndsAt = Math.min(
          gadget.cooldownEndsAt,
          now + MAX_GADGET_COOLDOWN_MS
        );
      }
      if (render) {
        render(formatCooldown(cooldownEndsAt - now));
      }
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
    }
  }

  function getState() {
    return {
      enabled: state.enabled,
      key: buildKey(),
      cooling: cooldownEndsAt > Date.now(),
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
  GADGET_TIMER_KEY,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  label,
  buildKey,
  formatCooldown,
  createGadgetTimer,
};
