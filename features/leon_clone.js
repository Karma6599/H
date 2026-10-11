'use strict';

const FEATURE_ID = 17;

const LEON_CLONE = 17;

const CLONE_SCAN_INTERVAL_MS = 250;
const MIN_ENTITY_COUNT = 1;
const MAX_ENTITY_COUNT = 2048;
const CLONE_ENTITY_CLASS = 'NinjaFake';
const STASH_KEY = 1;

const COUNTER_KEYS = [
  'ammoFrames',
  'shakeSuppressed',
  'clonesHighlighted',
  'utilitySamples',
  'utilityObjects',
  'utilityNativeCalls',
  'utilityQueued',
  'offsetChecks',
  'nameReads',
  'nameCacheHits',
  'guardedSkips',
  'errors',
];
const IDX_CLONES_HIGHLIGHTED = 2;

const OFFSET_INDEX_ENTITY_LIST = 23;
const OFFSET_INDEX_NAME_PTR = 32;
const HIGHLIGHT_PATCHES = [
  [8, 1],
  [9, 255],
];

function createLeonClone(deps) {
  const offsets = deps.offsetValues;
  const log = typeof deps.log === 'function' ? deps.log : () => {};

  const state = { enabled: false };
  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));
  const watchers = [];

  let disposed = false;
  let running = false;
  let intervalHandle = null;
  let cachedNamePtr = null;

  function detachWatchers() {
    for (const watcher of watchers.splice(0)) {
      try {
        watcher.detach();
      } catch (e) {}
    }
  }

  function readEntityName(namePtr) {
    return deps.readName(namePtr);
  }

  function scanClones() {
    const root = deps.getRoot(null, deps.resolveRoot());
    if (!root) return false;
    const list = root.add(offsets[OFFSET_INDEX_ENTITY_LIST]).readPointer();
    if (list.isNull()) return false;
    const count = list.add(deps.entityCountOffset).readS32();
    if (count < MIN_ENTITY_COUNT || count > MAX_ENTITY_COUNT) return false;
    for (let i = 0; i < count; i++) {
      try {
        const entity = list.add(i * deps.entityStride).readPointer();
        if (entity.isNull()) continue;
        const namePtr = entity.add(offsets[OFFSET_INDEX_NAME_PTR]).readPointer();
        if (namePtr.isNull()) continue;
        if (cachedNamePtr) {
          if (namePtr.equals(cachedNamePtr)) {
            cachedNamePtr = namePtr;
            return true;
          }
          continue;
        }
        if (readEntityName(namePtr) === CLONE_ENTITY_CLASS) {
          cachedNamePtr = namePtr;
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  function onEnter(args) {
    this[STASH_KEY] = state.enabled &&
      cachedNamePtr !== null &&
      args[0].equals(cachedNamePtr);
  }

  function onLeave(retval) {
    if (!this[STASH_KEY]) return;
    retval.replace(1);
    counters[COUNTER_KEYS[IDX_CLONES_HIGHLIGHTED]]++;
  }

  function installHighlight() {
    for (const [offsetIndex, patchValue] of HIGHLIGHT_PATCHES) {
      watchers.push(
        deps.interceptor.attach(
          deps.hookBase.add(offsets[offsetIndex]),
          { onEnter, onLeave }
        )
      );
    }
  }

  function scan() {
    if (disposed || !state.enabled) {
      detachWatchers();
      return;
    }
    let found = false;
    try {
      found = scanClones();
    } catch (e) {
      found = false;
    }
    if (found || watchers.length === 0) {
      installHighlight();
      return;
    }
    if (!found) {
      detachWatchers();
      cachedNamePtr = null;
    }
  }

  function work() {
    running = false;
    scan();
  }

  function cancel() {
    running = false;
  }

  function tick() {
    if (disposed || running) return;
    running = true;
    try {
      deps.scheduler(work, cancel);
    } catch (e) {
      running = false;
      log(String(e && e.message ? e.message : e));
    }
  }

  function stop() {
    if (intervalHandle !== null) {
      (deps.clearInterval || globalThis.clearInterval)(intervalHandle);
      intervalHandle = null;
    }
    running = false;
    detachWatchers();
    cachedNamePtr = null;
  }

  function start() {
    deps.resolveOffsets([8, 9]);
    if (typeof deps.onCloneEvent !== 'function') {
      scan();
      return;
    }
    deps.prepareRoot();
    if (intervalHandle === null) {
      intervalHandle = (deps.setInterval || globalThis.setInterval)(
        tick,
        CLONE_SCAN_INTERVAL_MS
      );
    }
    tick();
  }

  function setEnabled(feature, on) {
    const id = typeof feature === 'number' ? feature : LEON_CLONE;
    if (id !== LEON_CLONE) {
      throw new Error('Unknown visual function: ' + feature);
    }
    if (disposed) {
      throw new Error('Visual runtime disposed');
    }
    on = !!on;
    if (state.enabled === on) return on;
    if (on) {
      try {
        start();
      } catch (e) {
        state.enabled = false;
        stop();
        log(String(e && e.message ? e.message : e));
        throw e;
      }
    } else {
      stop();
    }
    state.enabled = on;
    return state.enabled;
  }

  function applySaved(saved) {
    setEnabled(LEON_CLONE, saved ? saved.enabled === true : false);
  }

  function getState() {
    return {
      enabled: state.enabled,
      scanning: intervalHandle !== null,
      cloneFound: cachedNamePtr !== null,
      highlightHooks: watchers.length,
      counters: Object.assign({}, counters),
      disposed,
    };
  }

  function dispose() {
    disposed = true;
    stop();
  }

  return {
    FEATURE_ID,
    setEnabled,
    applySaved,
    scan,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  COUNTER_KEYS,
  createLeonClone,
};
