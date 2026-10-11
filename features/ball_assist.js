'use strict';

const FEATURE_ID = 11;

const BALL_ASSIST = 11;

const MENU_LABEL_EN = 'BALL ASSIST';
const SETTINGS_KEY = 'ball_assist';

const STATUS_IDLE = 0;
const STATUS_GOAL = 1;
const STATUS_BALL = 2;
const STATUS_SEARCH = 3;
const STATUS_LABELS = ['idle', 'goal', 'ball', 'search'];

const INPUT_FLAG_ASSIST = 5;

const MOVE_THROTTLE_MS = 70;

const COUNTER_KEYS = [
  'ticks',
  'ballFinds',
  'moves',
  'shots',
  'errors',
];

function label() {
  return MENU_LABEL_EN;
}

function statusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS[STATUS_IDLE];
}

function createBallAssist(deps) {
  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const runtime = deps.ballRuntime;

  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    status: STATUS_IDLE,
    interlocked: false,
    lastMoveAt: 0,
    lastShotAt: 0,
  };

  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));

  function isTrickshotActive() {
    if (typeof deps.isTrickshotActive === 'function') {
      return deps.isTrickshotActive();
    }
    const snapshot = runtime ? runtime.getState() : null;
    return snapshot ? snapshot.trickshot.mode !== 'manual' : false;
  }

  function canOperate(now) {
    if (!state.enabled || state.disposed) return false;
    if (state.interlocked) return false;
    if (isTrickshotActive()) {
      state.interlocked = true;
      return false;
    }
    state.interlocked = false;
    return true;
  }

  function moveThrottled(now) {
    return now - state.lastMoveAt < MOVE_THROTTLE_MS;
  }

  function runtimeCall(method, fallback) {
    if (runtime && typeof runtime[method] === 'function') {
      return runtime[method];
    }
    return fallback;
  }

  function tick(seedPtr, now) {
    if (!canOperate(now)) return undefined;
    const at = now === undefined ? Date.now() : now;
    counters.ticks += 1;
    if (!moveThrottled(at)) {
      state.status = STATUS_BALL;
    }
    runtimeCall('tick', () => undefined)(seedPtr, at);
    return undefined;
  }

  function aimAtGoal(anchor, options) {
    if (!canOperate()) return null;
    const target = runtimeCall('aimAtGoal', () => null)(anchor, options);
    if (target) {
      counters.ballFinds += 1;
      state.status = STATUS_GOAL;
    }
    return target;
  }

  function followObjectivePath(target, angle, budget) {
    if (!canOperate()) return null;
    const path = runtimeCall('followObjectivePath', () => null)(
      target, angle, budget);
    if (path && !moveThrottled(Date.now())) {
      state.lastMoveAt = Date.now();
      counters.moves += 1;
    }
    return path;
  }

  function aimRedirectAndFire(context, x, y) {
    if (!canOperate()) return undefined;
    const result = runtimeCall('aimRedirectAndFire', () => undefined)(
      context, x, y);
    if (result) {
      state.lastShotAt = Date.now();
      counters.shots += 1;
    }
    return result;
  }

  function executeShot(seedPtr, now) {
    if (!canOperate()) return undefined;
    const at = now === undefined ? Date.now() : now;
    const result = runtimeCall('executeShot', () => undefined)(seedPtr, at);
    if (result) {
      state.lastShotAt = at;
      counters.shots += 1;
    }
    return result;
  }

  function objective(arg) {
    runtimeCall('objective', () => undefined)(arg);
    return undefined;
  }

  function setEnabled(on) {
    if (state.disposed) {
      throw new Error('Ball/Mortis runtime disposed');
    }
    on = on === true;
    if (state.enabled === on) return on;
    runtimeCall('setEnabled', () => undefined)(BALL_ASSIST, on);
    state.enabled = on;
    if (!on) {
      state.status = STATUS_IDLE;
      state.interlocked = false;
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved[SETTINGS_KEY] === true : false;
    if (state.enabled) {
      runtimeCall('setEnabled', () => undefined)(BALL_ASSIST, true);
    }
  }

  function getState() {
    const runtimeState = runtime ? runtime.getState() : null;
    return {
      enabled: state.enabled,
      status: statusLabel(state.status),
      interlocked: state.interlocked,
      lastMoveAt: state.lastMoveAt,
      lastShotAt: state.lastShotAt,
      ticks: counters.ticks,
      ballFinds: counters.ballFinds,
      moves: counters.moves +
        (runtimeState ? runtimeState.moves - counters.moves : 0),
      shots: counters.shots,
      runtimeMoves: runtimeState ? runtimeState.moves : 0,
      runtimeShots: runtimeState ? runtimeState.shots : 0,
      errors: counters.errors,
      disposed: state.disposed,
      lastError: state.lastError || (runtimeState ? runtimeState.lastError : ''),
      featureId: BALL_ASSIST,
      settingsKey: SETTINGS_KEY,
      label: label(),
    };
  }

  function dispose() {
    if (state.disposed) return undefined;
    try {
      setEnabled(false);
    } catch (err) {
      state.lastError = err && err.message ? err.message : String(err);
    }
    state.disposed = true;
    return undefined;
  }

  const api = {
    setEnabled: setEnabled,
    applySaved: applySaved,
    tick: tick,
    objective: objective,
    aimAtGoal: aimAtGoal,
    followObjectivePath: followObjectivePath,
    aimRedirectAndFire: aimRedirectAndFire,
    executeShot: executeShot,
    getState: getState,
    dispose: dispose,
  };

  return api;
}

module.exports = {
  FEATURE_ID,
  BALL_ASSIST,
  STATUS_LABELS,
  STATUS_BALL,
  MOVE_THROTTLE_MS,
  COUNTER_KEYS,
  label,
  statusLabel,
  createBallAssist,
};
