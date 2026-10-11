'use strict';

function createFpsUnlock(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  function setEnabled(value) {
    state.enabled = value === true;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    state.disposed = true;
  }

  return {
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  createFpsUnlock,
};
