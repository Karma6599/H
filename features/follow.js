'use strict';

const FEATURE_ID = 8;

function createFollow(deps) {
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
  createFollow,
};
