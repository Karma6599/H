'use strict';

const FEATURE_ID = 43;

const SKIP_PRESTIGE = 43;

const MENU_LABEL_EN = 'Skip prestige';
const MENU_LABEL_RU = 'Пропуск престижа';

const MENU_KEY_EN = 'SKIP_PRESTIGE';

const CHAR_CODE_KEY = [115, 107, 105, 112, 95, 112, 114, 101, 115, 116, 105, 103, 101];

const DESCRIPTION_EN =
  'Skips the prestige level-up animation and goes ' +
  'straight to the rewards';

const PRESTIGE_STATE = 'rewards';

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createSkipPrestige(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readGameState = deps.readGameState;
  const requestRewards = deps.requestRewards;

  let skipped = 0;
  let lastSkipAt = 0;

  function isPrestigePhase(gameState) {
    return !!(gameState && gameState.phase === 'prestige');
  }

  function tick() {
    if (!state.enabled) return;
    try {
      const gameState = readGameState ? readGameState() : null;
      if (!isPrestigePhase(gameState)) return;
      if (requestRewards && requestRewards(PRESTIGE_STATE)) {
        skipped++;
        lastSkipAt = Date.now();
      }
    } catch (err) {
      state.lastError = String(err);
    }
  }

  function setEnabled(value) {
    state.enabled = value === true;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      skipped: skipped,
      lastSkipAt: lastSkipAt,
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
    SKIP_PRESTIGE,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    MENU_KEY_EN,
    DESCRIPTION_EN,
    FEATURE_KEY: buildKey(),
    PRESTIGE_STATE,
    label,
    buildKey,
    isPrestigePhase,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SKIP_PRESTIGE,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  MENU_KEY_EN,
  DESCRIPTION_EN,
  label,
  buildKey,
  createSkipPrestige,
};
