'use strict';

const FEATURE_ID = 19;

const VISUAL_GROUP_IDS = [17, 18, 19, 20, 21, 22, 23];

const POLL_MS = 120;

const SHAKE_HOOK_OFFSET_SLOT = 12;

const SHAKE_STASH_KEY = 'shakeContext';

function createDisableShake(deps) {
  const log = deps.log || function () {};
  const interceptor = deps.interceptor;
  const offsets = deps.offsets || [];
  const suppressShake = deps.suppressShake;
  const reportError = deps.reportError || log;

  const state = {
    enabled: false,
    disposed: false,
    polling: false,
    intervalHandle: null,
    hooksInstalled: false,
    suppressedCount: 0,
    lastError: '',
  };

  function isRuntimeReady() {
    if (state.disposed) {
      return false;
    }
    if (typeof deps.isVisualRuntimeEnabled !== 'function') {
      return true;
    }
    return deps.isVisualRuntimeEnabled();
  }

  function resetCounters() {
    state.suppressedCount = 0;
  }

  function stashShakeContext(args) {
    if (typeof args[0] !== 'number' || !Number.isFinite(args[0])) {
      return undefined;
    }
    this[SHAKE_STASH_KEY] = args[0];
    return undefined;
  }

  function restoreNoShake() {
    if (!state.enabled) {
      return undefined;
    }
    try {
      const stash = this[SHAKE_STASH_KEY];
      if (stash !== undefined && typeof suppressShake === 'function') {
        suppressShake(stash);
        state.suppressedCount++;
      }
    } catch (error) {
      if (typeof reportError === 'function') {
        reportError(error);
      }
      state.lastError = String(error);
    }
    return undefined;
  }

  function clearPolling() {
    if (state.intervalHandle !== null) {
      const stop = deps.clearInterval || globalThis.clearInterval;
      if (typeof stop === 'function') {
        stop(state.intervalHandle);
      }
      state.intervalHandle = null;
    }
    state.polling = false;
  }

  function detachHooks() {
    if (Array.isArray(deps.hooks) && typeof deps.detachHooks === 'function') {
      deps.detachHooks(deps.hooks);
      state.hooksInstalled = false;
    }
  }

  function attach() {
    if (!isRuntimeReady()) {
      clearPolling();
      detachHooks();
      return false;
    }

    resetCounters();

    if (typeof deps.pollMode === 'function') {
      if (state.intervalHandle === null) {
        if (typeof deps.scanBattle === 'function') {
          deps.scanBattle();
        }
        const schedule = deps.setInterval ||
          (deps.shared && deps.shared.setInterval) ||
          globalThis.setInterval;
        state.intervalHandle = schedule(
          deps.pollTick || function () {},
          POLL_MS
        );
        state.polling = true;
        if (typeof deps.pollTick === 'function') {
          deps.pollTick();
        }
      }
      return true;
    }

    if (!state.hooksInstalled) {
      if (typeof deps.beforeAttach === 'function') {
        deps.beforeAttach(SHAKE_HOOK_OFFSET_SLOT);
      }
      if (typeof deps.scanBattle === 'function') {
        deps.scanBattle();
      }
      const target = offsets[SHAKE_HOOK_OFFSET_SLOT];
      if (interceptor && target !== undefined) {
        const listener = interceptor.attach(target, {
          onEnter: stashShakeContext,
          onLeave: restoreNoShake,
        });
        if (Array.isArray(deps.hooks)) {
          deps.hooks.push(listener);
        }
        state.hooksInstalled = true;
      }
    }
    return true;
  }

  function teardown() {
    clearPolling();
    detachHooks();
    return true;
  }

  function setEnabled(value) {
    state.enabled = value === true;
    if (state.enabled) {
      attach();
    } else {
      teardown();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
    if (state.enabled) {
      attach();
    } else {
      teardown();
    }
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      polling: state.polling,
      hooksInstalled: state.hooksInstalled,
      suppressedCount: state.suppressedCount,
      lastError: state.lastError,
    };
  }

  function dispose() {
    teardown();
    state.enabled = false;
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    setEnabled,
    applySaved,
    attach,
    teardown,
    tick,
    getState,
    dispose,
    stashShakeContext,
    restoreNoShake,
  };
}

module.exports = {
  FEATURE_ID,
  VISUAL_GROUP_IDS,
  POLL_MS,
  SHAKE_HOOK_OFFSET_SLOT,
  SHAKE_STASH_KEY,
  createDisableShake,
};
