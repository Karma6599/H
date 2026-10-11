'use strict';

const FEATURE_ID = 36;

const HIDE_SUPER_AIM = 36;

const MENU_LABEL_EN = 'Hide Super aim';
const MENU_LABEL_RU = 'Скрытие ульты';

const HIDE_SUPER_AIM_KEY = 'hide_super_aim';

const CHAR_CODE_KEY = [
  104, 105, 100, 101, 95, 115, 117, 112, 101, 114, 95, 97, 105, 109,
];

const SUPER_AIM_FLAG_OFFSET = 8;
const SUPER_AIM_HIDDEN_VALUE = 0;
const SUPER_AIM_VISIBLE_VALUE = 1;
const REFRESH_INTERVAL_MS = 120;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createHideSuperAim(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    applied: false,
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readSuperAimTarget = deps.readSuperAimTarget;
  const writeSuperAimFlag = deps.writeSuperAimFlag;
  const hooks = [];

  function restore() {
    if (!state.applied) return;
    try {
      const target = readSuperAimTarget ? readSuperAimTarget() : null;
      if (target) {
        writeSuperAimFlag(
          target,
          SUPER_AIM_FLAG_OFFSET,
          SUPER_AIM_VISIBLE_VALUE
        );
      }
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
    }
    state.applied = false;
  }

  function apply() {
    if (!state.enabled) {
      restore();
      return;
    }
    try {
      const target = readSuperAimTarget ? readSuperAimTarget() : null;
      if (target) {
        writeSuperAimFlag(
          target,
          SUPER_AIM_FLAG_OFFSET,
          SUPER_AIM_HIDDEN_VALUE
        );
        state.applied = true;
      }
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
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
    state.enabled = saved ? saved.enabled === true : false;
    apply();
  }

  function tick() {
    if (state.enabled && !state.applied) apply();
  }

  function getState() {
    return {
      enabled: state.enabled,
      key: buildKey(),
      applied: state.applied,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    restore();
    for (const hook of hooks.splice(0)) {
      try {
        hook.detach();
      } catch (e) {}
    }
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
  HIDE_SUPER_AIM_KEY,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  label,
  buildKey,
  createHideSuperAim,
};
