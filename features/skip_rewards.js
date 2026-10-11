'use strict';

const FEATURE_ID = 44;

const SKIP_REWARDS = 44;

const MENU_LABEL_EN = 'Skip animations';
const MENU_LABEL_RU = 'Пропуск анимаций';

const MENU_KEY_EN = 'SKIP_REWARDS';

const CHAR_CODE_KEY = [115, 107, 105, 112, 95, 114, 101, 119, 97, 114, 100, 115];

const DESCRIPTION_EN =
  'Skips box, Starr Drop and reward opening animations ' +
  'and shows only the final reward';

const REWARD_SOURCES = ['box', 'starrDrop', 'reward'];

const FINAL_STATE = 'final';

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function isRewardOpening(gameState) {
  if (!gameState || !gameState.opening) return false;
  return REWARD_SOURCES.indexOf(gameState.opening) !== -1;
}

function createSkipRewards(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readGameState = deps.readGameState;
  const requestFinal = deps.requestFinal;

  let skipped = 0;
  let lastSkipAt = 0;

  function tick() {
    if (!state.enabled) return;
    try {
      const gameState = readGameState ? readGameState() : null;
      if (!isRewardOpening(gameState)) return;
      if (requestFinal && requestFinal(FINAL_STATE)) {
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
    SKIP_REWARDS,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    MENU_KEY_EN,
    DESCRIPTION_EN,
    FEATURE_KEY: buildKey(),
    REWARD_SOURCES,
    FINAL_STATE,
    label,
    buildKey,
    isRewardOpening,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SKIP_REWARDS,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  MENU_KEY_EN,
  DESCRIPTION_EN,
  REWARD_SOURCES,
  label,
  buildKey,
  isRewardOpening,
  createSkipRewards,
};
