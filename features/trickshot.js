'use strict';

const MODE_MANUAL = 'manual';
const MODE_AUTO = 'auto';

function createTrickshot(deps) {
  const state = {
    mode: MODE_MANUAL,
    disposed: false,
    lastError: '',
  };

  function setMode(mode) {
    state.mode = mode === MODE_AUTO ? MODE_AUTO : MODE_MANUAL;
    return state.mode;
  }

  function applySaved(saved) {
    state.mode = saved && saved.mode === MODE_AUTO ? MODE_AUTO : MODE_MANUAL;
  }

  function tick() {}

  function getState() {
    return {
      mode: state.mode,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    state.disposed = true;
  }

  return {
    MODE_MANUAL,
    MODE_AUTO,
    setMode,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  MODE_MANUAL,
  MODE_AUTO,
  createTrickshot,
};
