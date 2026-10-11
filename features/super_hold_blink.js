'use strict';

const FEATURE_ID = 41;

const SUPER_HOLD_BLINK = 41;

const MENU_LABEL_EN = 'Super blink';
const MENU_LABEL_RU = 'Мерцание ульты';

const MENU_KEY_EN = 'SUPER_HOLD_BLINK';

const CHAR_CODE_KEY = [
  115, 117, 112, 101, 114, 95, 104, 111, 108, 100, 95, 98, 108, 105, 110, 107,
];

const DESCRIPTION_EN = 'Holds and releases the super every 0.1 s';

const BLINK_INTERVAL_MS = 100;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createSuperHoldBlink(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readSkillState = deps.readSkillState;
  const holdSuper = deps.holdSuper;
  const releaseSuper = deps.releaseSuper;

  let holding = false;
  let lastToggleAt = 0;
  let toggles = 0;

  function skillReady(skill) {
    return !!(skill && skill.super && skill.super.ready);
  }

  function blink(now) {
    const skill = readSkillState ? readSkillState() : null;
    if (!skillReady(skill)) {
      if (holding && releaseSuper) releaseSuper(now);
      holding = false;
      return holding;
    }
    if (now - lastToggleAt < BLINK_INTERVAL_MS) return holding;
    lastToggleAt = now;
    holding = !holding;
    toggles++;
    try {
      if (holding) {
        if (holdSuper) holdSuper(now);
      } else {
        if (releaseSuper) releaseSuper(now);
      }
    } catch (err) {
      state.lastError = String(err);
    }
    return holding;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (!on && holding) {
      if (releaseSuper) releaseSuper(Date.now());
      holding = false;
    }
    toggles = 0;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    blink(now);
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      holding: holding,
      toggles: toggles,
      lastToggleAt: lastToggleAt,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    SUPER_HOLD_BLINK,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    MENU_KEY_EN,
    DESCRIPTION_EN,
    FEATURE_KEY: buildKey(),
    BLINK_INTERVAL_MS,
    label,
    buildKey,
    skillReady,
    blink,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SUPER_HOLD_BLINK,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  MENU_KEY_EN,
  BLINK_INTERVAL_MS,
  label,
  buildKey,
  createSuperHoldBlink,
};
