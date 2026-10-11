'use strict';

const FEATURE_ID = 18;

const ENEMY_AMMO = 18;

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
const IDX_AMMO_FRAMES = 0;

const AMMO_HOOK_OFFSET_INDEX = 1;
const COUNTER_SLOT_BYTES = 4;
const INVOCATION_ENTITY_OFFSET = 2888;
const AMMO_FLAG_OFFSET = 8;

const AMMO_MODULE_SOURCE =
  '#include <gum/guminterceptor.h>\n' +
  '    typedef struct {unsigned char *od2e5571388;} o09ea933cbd;\n' +
  '    extern unsigned o3a1e71579f;\n' +
  '    void o8146a06e87(GumInvocationContext *o2d953d89c5)' +
  '{o09ea933cbd *oe0f4aa16f9=' +
  'GUM_IC_GET_INVOCATION_DATA(o2d953d89c5,o09ea933cbd);' +
  'oe0f4aa16f9->od2e5571388=' +
  'gum_invocation_context_get_nth_argument(o2d953d89c5,0);}\n' +
  '    void ob221b6baff(GumInvocationContext *o2d953d89c5)' +
  '{o09ea933cbd *oe0f4aa16f9=' +
  'GUM_IC_GET_INVOCATION_DATA(o2d953d89c5,o09ea933cbd);' +
  'unsigned char *o976084e60a;' +
  'if(!oe0f4aa16f9->od2e5571388)return;' +
  'o976084e60a=*(unsigned char **)(oe0f4aa16f9->od2e5571388+2888);' +
  'if(o976084e60a){o976084e60a[8]=1;o3a1e71579f++;}}\n' +
  '    unsigned od0192d38a0(void){return o3a1e71579f;}\n';

const SYMBOL_COUNTER = '_$c9d06b0df5260490996cb343';
const SYMBOL_READER = '_$0bf0a3f8d05643861da3114a';
const SYMBOL_ENTER = 'enter';
const SYMBOL_LEAVE = 'leave';

function createEnemyAmmo(deps) {
  const offsets = deps.offsetValues;
  const log = typeof deps.log === 'function' ? deps.log : () => {};

  const state = { enabled: false };
  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));
  const watchers = [];

  let disposed = false;
  let lastError = null;
  let moduleTriple = null;

  function onEnter(args) {
    this.invocationEntity = state.enabled ? args[0] : null;
  }

  function onLeave(retval) {
    if (!this.invocationEntity) return;
    const entity = this.invocationEntity
      .add(INVOCATION_ENTITY_OFFSET)
      .readPointer();
    if (!entity.isNull()) {
      deps.writeAmmoFlag(entity, AMMO_FLAG_OFFSET, 1);
      counters[COUNTER_KEYS[IDX_AMMO_FRAMES]]++;
    }
  }

  function ensureModule() {
    if (moduleTriple) return moduleTriple;
    const CModuleCtor = deps.CModule || globalThis.CModule;
    if (!CModuleCtor) return null;
    const slot = deps.Memory.alloc(COUNTER_SLOT_BYTES);
    slot.writeU32(0);
    const module = new CModuleCtor(AMMO_MODULE_SOURCE, deps.symbolMap);
    const reader = new deps.NativeFunction(
      module[deps.counterExport],
      'uint',
      []
    );
    moduleTriple = [slot, module, reader];
    return moduleTriple;
  }

  function start() {
    const triple = ensureModule();
    const interceptor = deps.interceptor;
    if (!interceptor || !deps.hookBase) return;
    if (triple) {
      watchers.push(
        interceptor.attach(
          deps.hookBase.add(offsets[AMMO_HOOK_OFFSET_INDEX]),
          { onEnter: triple[1][SYMBOL_ENTER], onLeave: triple[1][SYMBOL_LEAVE] }
        )
      );
    }
    watchers.push(
      interceptor.attach(
        deps.hookBase.add(offsets[AMMO_HOOK_OFFSET_INDEX]),
        { onEnter, onLeave }
      )
    );
  }

  function stop() {
    for (const watcher of watchers.splice(0)) {
      try {
        watcher.detach();
      } catch (e) {}
    }
  }

  function setEnabled(feature, on) {
    const id = typeof feature === 'number' ? feature : ENEMY_AMMO;
    if (id !== ENEMY_AMMO) {
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
        lastError = e;
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
    setEnabled(ENEMY_AMMO, saved ? saved.enabled === true : false);
  }

  function getState() {
    if (moduleTriple) {
      counters[COUNTER_KEYS[IDX_AMMO_FRAMES]] = moduleTriple[2]();
    }
    return {
      enabled: state.enabled,
      hooks: watchers.length,
      ammoFrames: counters[COUNTER_KEYS[IDX_AMMO_FRAMES]],
      counters: Object.assign({}, counters),
      moduleBuilt: moduleTriple !== null,
      disposed,
      lastError: lastError === null
        ? null
        : String(lastError.message || lastError),
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
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  COUNTER_KEYS,
  AMMO_MODULE_SOURCE,
  SYMBOL_COUNTER,
  SYMBOL_READER,
  SYMBOL_ENTER,
  SYMBOL_LEAVE,
  createEnemyAmmo,
};
