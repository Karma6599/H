'use strict';

const FEATURE_ID = 30;

const SKIP_MOMENT = 30;

const MENU_LABEL_EN = 'Skip highlight';
const MENU_LABEL_RU = 'Пропуск момента';

const MENU_KEY_EN = 'SKIP_MOMENT';

const CHAR_CODE_KEY = [115, 107, 105, 112, 95, 109, 111, 109, 101, 110, 116];

const DESCRIPTION_EN =
  'Go straight to the results after a battle, ' +
  'without the best moment';

const RESULT_STATE = 'results';

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createSkipMoment(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readGameState = deps.readGameState;
  const requestResults = deps.requestResults;

  let skipped = 0;
  let lastSkipAt = 0;

  function isHighlightPhase(gameState) {
    return !!(gameState && gameState.phase === 'highlight');
  }

  function tick() {
    if (!state.enabled) return;
    try {
      const gameState = readGameState ? readGameState() : null;
      if (!isHighlightPhase(gameState)) return;
      if (requestResults && requestResults(RESULT_STATE)) {
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
    SKIP_MOMENT,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    MENU_KEY_EN,
    DESCRIPTION_EN,
    FEATURE_KEY: buildKey(),
    RESULT_STATE,
    label,
    buildKey,
    isHighlightPhase,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SKIP_MOMENT,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  MENU_KEY_EN,
  DESCRIPTION_EN,
  label,
  buildKey,
  createSkipMoment,
};
