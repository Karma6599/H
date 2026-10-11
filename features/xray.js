'use strict';

const FEATURE_ID = 9;

const XRAY = 9;

const MENU_LABEL_EN = 'X-RAY';
const SETTINGS_KEY = 'xray';
const FIRE_GATE_KEY = 'xrayFireGate';

const REWRITE_WINDOW_MS = 180;

const ARGS_INDEX_X = 1;
const ARGS_INDEX_Y = 2;
const ARGS_INDEX_TARGET = 3;
const ARGS_INDEX_STATE = 4;
const ARGS_INDEX_FLAG = 5;
const ARGS_INDEX_WORLD = 6;

const NATIVE_INDEX_TRUE_X = 3;
const NATIVE_INDEX_TRUE_Y = 4;

const REWRITE_FLAG = 1;

const COUNTER_KEYS = [
  'ticks',
  'xrayRewrites',
  'xrayLastGid',
  'xrayBlocked',
  'errors',
];

const IDX_XRAY_REWRITES = 1;
const IDX_XRAY_LAST_GID = 2;
const IDX_XRAY_BLOCKED = 3;
const IDX_ERRORS = 4;

function label() {
  return MENU_LABEL_EN;
}

function createXray(deps) {
  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const ptr = deps.ptr;

  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    hookInstalled: false,
    lastRewriteAt: 0,
    lastGid: 0,
  };

  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));

  const readTrueX = deps.readTrueX;
  const readTrueY = deps.readTrueY;

  function isReady() {
    if (!state.enabled || state.disposed) return false;
    if (typeof deps.isBattleActive === 'function') {
      return deps.isBattleActive();
    }
    return true;
  }

  function matchesProjectileRecord(record, projectile) {
    if (!record || !projectile) return false;
    if (record.gid === projectile.gid) return true;
    if (typeof deps.matchesProjectileRecord === 'function') {
      return deps.matchesProjectileRecord(record, projectile);
    }
    return false;
  }

  function findProjectileRecord(world, scene) {
    const records = scene.projectileRecords || [];
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      if (matchesProjectileRecord(record, world.projectile)) {
        return record;
      }
    }
    return null;
  }

  function rewriteAimArgs(args, record, world) {
    let aimX = args[ARGS_INDEX_X].toInt32();
    let aimY = args[ARGS_INDEX_Y].toInt32();
    if (record) {
      if (readTrueX) {
        aimX = readTrueX(record.pointer);
      }
      if (readTrueY) {
        aimY = readTrueY(record.pointer);
      }
    }
    args[ARGS_INDEX_X] = ptr(aimX);
    args[ARGS_INDEX_Y] = ptr(aimY);
    args[ARGS_INDEX_FLAG] = ptr(REWRITE_FLAG);
    args[ARGS_INDEX_WORLD] = ptr(world.address);
    return { aimX: aimX, aimY: aimY };
  }

  function fireGateOpen(now) {
    if (typeof deps.isFireGateOpen !== 'function') return true;
    return deps.isFireGateOpen(now) === true;
  }

  function rewriteWindowStale(now) {
    const anchor = typeof deps.lastFireAttemptAt === 'function'
      ? deps.lastFireAttemptAt()
      : state.lastRewriteAt;
    return now - anchor > REWRITE_WINDOW_MS;
  }

  function rewriteSuppressed() {
    return typeof deps.suppressRewrite === 'function' &&
      deps.suppressRewrite() === true;
  }

  function onFireEnter(args) {
    counters.ticks += 1;
    if (!isReady()) return;
    try {
      const world = deps.getWorldSnapshot();
      if (!world) return;
      const scene = deps.resolveScene ? deps.resolveScene() : null;
      if (scene && !deps.isSceneValid(scene)) return;
      const now = Date.now();
      if (!fireGateOpen(now) || rewriteWindowStale(now) ||
          rewriteSuppressed()) {
        return;
      }
      const projectile = deps.getOwnProjectile();
      if (!projectile ||
          !deps.isSameBattle(projectile, world)) {
        return;
      }
      if (!args[ARGS_INDEX_TARGET].equals(projectile.self) ||
          !args[ARGS_INDEX_TARGET].equals(projectile.object)) {
        return;
      }
      const stateA = deps.getProjectileState(projectile);
      const stateB = deps.getProjectileStateAlt(projectile);
      if (!(stateA && args[ARGS_INDEX_STATE].equals(stateA.instance)) &&
          !(stateB && args[ARGS_INDEX_STATE].equals(stateB.instance))) {
        return;
      }
      const record = findProjectileRecord(world, scene || {});
      if (record && record.readiness !== undefined &&
          record.pointer.add(deps.projectileFlagOffset).readS32() <= 0) {
        counters.xrayBlocked += 1;
        return;
      }
      const result = rewriteAimArgs(args, record, world);
      state.lastRewriteAt = now;
      state.lastGid = world.gid;
      counters.xrayRewrites += 1;
      counters.xrayLastGid = world.gid;
      if (typeof deps.countXrayRewrite === 'function') {
        deps.countXrayRewrite(world.gid);
      }
      return result;
    } catch (err) {
      counters.errors += 1;
      state.lastError = err && err.message ? err.message : String(err);
      log(state.lastError);
      return undefined;
    }
  }

  function installHook() {
    if (state.hookInstalled || state.disposed) return state.hookInstalled;
    deps.attachFireHook({ onEnter: onFireEnter });
    state.hookInstalled = true;
    return state.hookInstalled;
  }

  function detachHook() {
    if (!state.hookInstalled) return false;
    if (typeof deps.detachFireHook === 'function') {
      deps.detachFireHook();
    }
    state.hookInstalled = false;
    return true;
  }

  function setEnabled(on) {
    if (state.disposed) {
      throw new Error('X-ray runtime disposed');
    }
    on = on === true;
    if (state.enabled === on) return on;
    state.enabled = on;
    if (on) {
      installHook();
    } else {
      detachHook();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved[SETTINGS_KEY] === true : false;
    if (state.enabled) installHook();
  }

  function tick(now) {
    if (!state.enabled || state.disposed) return undefined;
    const at = now === undefined ? Date.now() : now;
    counters.ticks += 1;
    if (rewriteWindowStale(at)) {
      return undefined;
    }
    return undefined;
  }

  function getState() {
    return {
      enabled: state.enabled,
      hookInstalled: state.hookInstalled,
      lastRewriteAt: state.lastRewriteAt,
      rewrites: counters.xrayRewrites,
      blocked: counters.xrayBlocked,
      lastGid: counters.xrayLastGid,
      fireGate: FIRE_GATE_KEY,
      disposed: state.disposed,
      lastError: state.lastError,
      featureId: XRAY,
      settingsKey: SETTINGS_KEY,
      label: label(),
    };
  }

  function dispose() {
    if (state.disposed) return undefined;
    detachHook();
    state.enabled = false;
    state.disposed = true;
    return undefined;
  }

  const api = {
    setEnabled: setEnabled,
    applySaved: applySaved,
    onFireEnter: onFireEnter,
    installHook: installHook,
    detachHook: detachHook,
    tick: tick,
    getState: getState,
    dispose: dispose,
  };

  return api;
}

module.exports = {
  FEATURE_ID,
  XRAY,
  REWRITE_WINDOW_MS,
  COUNTER_KEYS,
  label,
  createXray,
};
