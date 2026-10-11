'use strict';

const FEATURE_ID = 40;

const SUPER_HOLD = 40;

const MENU_LABEL_EN = 'Super held';
const MENU_LABEL_RU = 'Зажатая ульта';

const MENU_KEY_EN = 'SUPER_HOLD';

const CHAR_CODE_KEY = [115, 117, 112, 101, 114, 95, 104, 111, 108, 100];

const DESCRIPTION_EN =
  'Keeps the super held while it is ready. Your own presses ' +
  'still work and it never fires by itself';

const TICK_INTERVAL_MS = 100;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createSuperHold(deps) {
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
  let lastTickAt = 0;

  function skillReady(skill) {
    return !!(skill && skill.super && skill.super.ready);
  }

  function apply(now) {
    const skill = readSkillState ? readSkillState() : null;
    const wantHolding = skillReady(skill);
    if (wantHolding === holding) return holding;
    try {
      if (wantHolding) {
        if (holdSuper) holdSuper(now);
      } else {
        if (releaseSuper) releaseSuper(now);
      }
      holding = wantHolding;
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
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    if (now - lastTickAt < TICK_INTERVAL_MS) return;
    lastTickAt = now;
    apply(now);
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      holding: holding,
      lastTickAt: lastTickAt,
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
    SUPER_HOLD,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    MENU_KEY_EN,
    DESCRIPTION_EN,
    FEATURE_KEY: buildKey(),
    TICK_INTERVAL_MS,
    label,
    buildKey,
    skillReady,
    apply,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SUPER_HOLD,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  MENU_KEY_EN,
  TICK_INTERVAL_MS,
  label,
  buildKey,
  createSuperHold,
};
