'use strict';

const MENU_LABEL_EN = 'TRICKSHOT';
const SETTINGS_KEY = 'trickshot';

const MODE_MANUAL = 'manual';
const MODE_AUTO = 'auto';
const MODES = [MODE_MANUAL, MODE_AUTO];

const MODE_VALUE_MANUAL = 0;
const MODE_VALUE_AUTO = 1;

const MODE_TABLE = [0, 1, 2, 3, 4, 5];

const STATUS_IDLE = 0;

const RESET_MOVE_AT = 0;

function label() {
  return MENU_LABEL_EN;
}

function normalizeMode(mode) {
  if (mode === MODE_VALUE_AUTO || mode === MODE_AUTO) return MODE_AUTO;
  return MODE_MANUAL;
}

function modeValue(mode) {
  return normalizeMode(mode) === MODE_AUTO ? MODE_VALUE_AUTO : MODE_VALUE_MANUAL;
}

function isTrickshotMode(mode) {
  return normalizeMode(mode) === MODE_AUTO;
}

function createTrickshot(deps) {
  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const runtime = deps.ballRuntime;

  const state = {
    mode: MODE_MANUAL,
    modeValue: MODE_VALUE_MANUAL,
    enabled: false,
    disposed: false,
    lastError: '',
    status: MODE_TABLE[STATUS_IDLE],
    lastMoveAt: RESET_MOVE_AT,
    seedPointer: null,
    live: null,
  };

  function runtimeCall(method, fallback) {
    if (runtime && typeof runtime[method] === 'function') {
      return runtime[method];
    }
    return fallback;
  }

  function isActive() {
    return state.modeValue !== MODE_VALUE_MANUAL;
  }

  function readMode() {
    if (typeof deps.readSetting === 'function') {
      const saved = deps.readSetting(SETTINGS_KEY);
      if (saved !== undefined && saved !== null) {
        return normalizeMode(saved);
      }
    }
    const snapshot = runtime ? runtime.getState() : null;
    return snapshot ? snapshot.trickshot.mode : state.mode;
  }

  function setMode(mode) {
    if (state.disposed) {
      throw new Error('Ball/Mortis runtime disposed');
    }
    const next = normalizeMode(mode);
    state.mode = next;
    state.modeValue = modeValue(next);
    runtimeCall('setMode', () => undefined)(state.modeValue);
    if (isActive()) {
      runtimeCall('resetBallState', () => undefined)();
    }
    return state.mode;
  }

  function setEnabled(on) {
    if (state.disposed) {
      throw new Error('Ball/Mortis runtime disposed');
    }
    state.enabled = on === true;
    if (state.enabled) {
      setMode(readMode());
    }
    return state.enabled;
  }

  function applySaved(saved) {
    if (saved && saved[SETTINGS_KEY]) {
      state.mode = normalizeMode(saved[SETTINGS_KEY]);
    } else {
      state.mode = MODE_MANUAL;
    }
    state.modeValue = modeValue(state.mode);
    state.enabled = true;
    runtimeCall('setMode', () => undefined)(state.modeValue);
    return state.mode;
  }

  function getMode() {
    return state.mode;
  }

  function tick(seedPtr, now) {
    if (state.disposed) return undefined;
    if (!state.enabled && !isActive()) return undefined;
    const at = now === undefined ? Date.now() : now;
    runtimeCall('tick', () => undefined)(seedPtr, at);
    if (seedPtr) {
      state.seedPointer = seedPtr;
    }
    state.lastMoveAt = at;
    return undefined;
  }

  function objective(arg) {
    runtimeCall('objective', () => undefined)(arg);
    return undefined;
  }

  function executeShot(seedPtr, now) {
    if (!isActive()) return undefined;
    const at = now === undefined ? Date.now() : now;
    const result = runtimeCall('executeShot', () => undefined)(seedPtr, at);
    if (result) {
      state.lastMoveAt = at;
    }
    return result;
  }

  function refreshStatus() {
    const snapshot = runtime ? runtime.getState() : null;
    if (!snapshot) return state;
    state.status = snapshot.trickshot.status;
    state.lastMoveAt = snapshot.trickshot.lastMoveAt;
    state.seedPointer = snapshot.trickshot.seedPointer;
    state.live = snapshot.trickshot.live;
    return state;
  }

  function getTrickshotStatus() {
    const live = runtimeCall('getTrickshotStatus', () => null)();
    refreshStatus();
    return {
      mode: state.mode,
      status: state.status,
      lastMoveAt: state.lastMoveAt,
      seedPointer: state.seedPointer,
      live: live,
    };
  }

  function getState() {
    refreshStatus();
    const snapshot = runtime ? runtime.getState() : null;
    return {
      enabled: state.enabled,
      mode: state.mode,
      modeValue: state.modeValue,
      active: isActive(),
      status: state.status,
      lastMoveAt: state.lastMoveAt,
      seedPointer: state.seedPointer,
      live: state.live,
      runtimeStatus: snapshot ? snapshot.trickshot.status : undefined,
      moves: snapshot ? snapshot.moves : 0,
      shots: snapshot ? snapshot.shots : 0,
      errors: snapshot ? snapshot.errors : 0,
      disposed: state.disposed,
      lastError: state.lastError ||
        (snapshot ? snapshot.lastError : ''),
      settingsKey: SETTINGS_KEY,
      label: label(),
    };
  }

  function dispose() {
    if (state.disposed) return undefined;
    try {
      setMode(MODE_MANUAL);
    } catch (err) {
      state.lastError = err && err.message ? err.message : String(err);
    }
    state.enabled = false;
    state.disposed = true;
    return undefined;
  }

  const api = {
    setMode: setMode,
    getMode: getMode,
    setEnabled: setEnabled,
    applySaved: applySaved,
    isActive: isActive,
    tick: tick,
    objective: objective,
    executeShot: executeShot,
    getTrickshotStatus: getTrickshotStatus,
    getState: getState,
    dispose: dispose,
  };

  return api;
}

module.exports = {
  MENU_LABEL_EN,
  SETTINGS_KEY,
  MODES,
  MODE_MANUAL,
  MODE_AUTO,
  MODE_VALUE_MANUAL,
  MODE_VALUE_AUTO,
  MODE_TABLE,
  label,
  normalizeMode,
  modeValue,
  isTrickshotMode,
  createTrickshot,
};
