'use strict';

const FEATURE_ID = 26;

const VSYNC_BYPASS = 26;

const MENU_LABEL_EN = 'VSync bypass';
const MENU_LABEL_RU = 'Обход VSync';
const MENU_KEY = 'VSYNC_BYPASS';
const SETTINGS_KEY = 'vsync_bypass';

const FRAME_TABLE_OFFSETS = [0, 8, 16, 24, 32];

const FRAME_RATE_MIN = 1;
const FRAME_RATE_MAX = 10000;

const FRAME_CAP_BATTLE = 9999;
const FRAME_CAP_MENU = 240;

const APPLY_THROTTLE_MS = 250;
const APPLY_BACKOFF_MS = 1000;
const SESSION_REFRESH_MS = 1000;

const TICK_MS = 250;

const MODE_OFF = 0;
const MODE_RESTORE = 1;

const EGL_SURFACE_READ = 12377;
const FRAME_WAIT_MS = 2;

const INDEX_SWAP_INTERVAL = 0;
const INDEX_CURRENT_DISPLAY = 1;
const INDEX_CURRENT_CONTEXT = 2;
const INDEX_CURRENT_SURFACE = 3;
const EGL_NATIVE_COUNT = 4;

const GATE_SIZE = 4;

const CMODULE_SOURCE = [
  '',
  '     #include <gum/guminterceptor.h>',
  '     #include <glib.h>',
  '     extern volatile int gate_flag;',
  '     extern void original_frame_wait(void);',
  '     void request_extra_frame(void){int seen=g_atomic_int_add(&gate_flag,0);if(!seen)g_atomic_int_add(&gate_flag,1);}',
  '     void on_frame_wait_enter(GumInvocationContext *ctx){if(g_atomic_int_add(&gate_flag,0)){g_atomic_int_add(&gate_flag,-1);original_frame_wait();}}',
  '     ',
].join('\n');

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function isFiniteRate(value) {
  return Number.isFinite(value) && value >= FRAME_RATE_MIN &&
    value <= FRAME_RATE_MAX;
}

function createVsyncBypass(deps) {
  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const NativeFunction = deps.NativeFunction;
  const NativeCallback = deps.NativeCallback;
  const CModule = deps.CModule;
  const Interceptor = deps.Interceptor;
  const Memory = deps.Memory;
  const scheduleTick = deps.setInterval;
  const cancelTick = deps.clearInterval;
  const ptr = deps.ptr;

  const basePointer = deps.basePointer;
  const values = deps.offsetValues;
  const OFFSET_FRAME_STRUCT = deps.offsets.frameStruct;
  const OFFSET_FRAME_READY = deps.offsets.frameReady;
  const OFFSET_FRAME_SETTER = deps.offsets.frameSetter;
  const OFFSET_FRAME_SECOND = deps.offsets.frameSecondCap;

  const frameStruct = basePointer.add(values[OFFSET_FRAME_STRUCT]);
  const frameReady = basePointer.add(values[OFFSET_FRAME_READY]);

  const state = {
    enabled: false,
    menuMode: false,
    applied: false,
    firstApply: false,
    standby: false,
    shutdown: false,
    disposed: false,
    frameTable: null,
    nativeSetter: null,
    error: '',
    tickHandle: null,
  };

  const egl = {
    natives: null,
    applied: false,
    lastMode: null,
    sessionKey: '',
    throttleUntil: 0,
    lastSuccessAt: 0,
    attempts: 0,
  };

  const interceptorState = {
    cmodule: null,
    gateBuffer: null,
    callback: null,
    request: null,
    listeners: [],
  };

  function ensureNativeSetter() {
    if (state.nativeSetter) return state.nativeSetter;
    state.nativeSetter = new NativeFunction(
      basePointer.add(values[OFFSET_FRAME_SETTER]), 'void',
      ['pointer', 'double']);
    return state.nativeSetter;
  }

  function buildFrameTable() {
    if (state.frameTable || frameReady.readU8() === 0) return false;
    const table = FRAME_TABLE_OFFSETS.map((offset) =>
      frameStruct.add(offset).readDouble());
    if (!table.every(isFiniteRate)) {
      throw new Error('Invalid native frame-rate table');
    }
    state.frameTable = table;
    return true;
  }

  function currentCap() {
    return state.menuMode ? FRAME_CAP_MENU : FRAME_CAP_BATTLE;
  }

  function applyFrameRate() {
    if (state.disposed || (!state.enabled && !state.menuMode)) return false;
    try {
      if (frameReady.readU8() === 0) {
        state.frameTable = null;
        state.applied = false;
        return false;
      }
      buildFrameTable();
      const cap = currentCap();
      if (frameStruct.readDouble() !== cap) {
        frameStruct.writeDouble(cap);
      }
      const second = frameStruct.add(values[OFFSET_FRAME_SECOND]);
      if (second.readDouble() !== cap) {
        second.writeDouble(cap);
      }
      state.firstApply = true;
      state.applied = true;
      state.error = '';
      return true;
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
      return false;
    }
  }

  function restoreFrameRate() {
    if (!state.frameTable) return false;
    try {
      if (frameStruct.readDouble() === currentCap()) {
        frameStruct.writeDouble(state.frameTable[0]);
      }
      const second = frameStruct.add(values[OFFSET_FRAME_SECOND]);
      if (second.readDouble() === currentCap()) {
        second.writeDouble(state.frameTable[0]);
      }
      return true;
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
      return false;
    }
  }

  function setupEgl() {
    if (egl.natives) return true;
    try {
      const swapInterval = deps.resolveEglFunction('eglSwapInterval');
      const currentDisplay = deps.resolveEglFunction('eglGetCurrentDisplay');
      const currentContext = deps.resolveEglFunction('eglGetCurrentContext');
      const currentSurface = deps.resolveEglFunction('eglGetCurrentSurface');
      if (!swapInterval || !currentDisplay || !currentContext ||
          !currentSurface) {
        return false;
      }
      const natives = new Array(EGL_NATIVE_COUNT);
      natives[INDEX_SWAP_INTERVAL] = new NativeFunction(
        swapInterval, 'int', ['pointer', 'int']);
      natives[INDEX_CURRENT_DISPLAY] = new NativeFunction(
        currentDisplay, 'pointer', []);
      natives[INDEX_CURRENT_CONTEXT] = new NativeFunction(
        currentContext, 'pointer', []);
      natives[INDEX_CURRENT_SURFACE] = new NativeFunction(
        currentSurface, 'pointer', ['int']);
      egl.natives = natives;
      return true;
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
      egl.natives = null;
      return false;
    }
  }

  function applyEgl(mode) {
    const now = Date.now();
    if (now < egl.throttleUntil && egl.lastMode === mode) return true;
    egl.throttleUntil = now + APPLY_THROTTLE_MS;
    try {
      if (!setupEgl()) {
        egl.throttleUntil = now + APPLY_BACKOFF_MS;
        return false;
      }
      const display = egl.natives[INDEX_CURRENT_DISPLAY]();
      const context = egl.natives[INDEX_CURRENT_CONTEXT]();
      const surface = egl.natives[INDEX_CURRENT_SURFACE](EGL_SURFACE_READ);
      if (!display || display.isNull() || !context || context.isNull() ||
          !surface || surface.isNull()) {
        egl.sessionKey = '';
        egl.lastSuccessAt = 0;
        return false;
      }
      const sessionKey = display + '/' + context + '/' + surface;
      if (sessionKey !== egl.sessionKey || egl.lastMode !== mode ||
          now - egl.lastSuccessAt >= SESSION_REFRESH_MS) {
        egl.attempts += 1;
        const accepted = egl.natives[INDEX_SWAP_INTERVAL](display, mode);
        if (!accepted) {
          state.error = 'eglSwapInterval returned EGL_FALSE';
          egl.throttleUntil = now + APPLY_BACKOFF_MS;
          return false;
        }
        egl.sessionKey = sessionKey;
        egl.lastMode = mode;
        egl.lastSuccessAt = now;
        if (!egl.applied || mode === MODE_RESTORE) {
          egl.applied = true;
        }
      }
      return true;
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
      return false;
    }
  }

  function installInterceptor() {
    if (interceptorState.listeners.length) return;
    if (!interceptorState.cmodule) {
      interceptorState.gateBuffer = Memory.alloc(GATE_SIZE);
      interceptorState.gateBuffer.writeS32(0);
      interceptorState.callback = new NativeCallback(
        onNativeFrameCallback, 'void', []);
      interceptorState.cmodule = new CModule(CMODULE_SOURCE, {
        gate_flag: interceptorState.gateBuffer,
        original_frame_wait: interceptorState.callback,
      });
      interceptorState.request = new NativeFunction(
        interceptorState.cmodule.request, 'void', []);
    }
    interceptorState.listeners.push(Interceptor.attach(
      deps.frameWaitAddress, { onEnter: onFrameWaitEnter }));
  }

  function onFrameWaitEnter(args) {
    this.matchesOwner = args[0].equals(deps.frameWaitOwner);
    this.timeout = args[1].toUInt32();
    if (this.matchesOwner && this.timeout <= FRAME_WAIT_MS) {
      args[1] = ptr(FRAME_WAIT_MS);
    }
  }

  function onNativeFrameCallback() {
    if (state.disposed) return;
    try {
      if (frameReady.readU8() === 0) {
        if (state.enabled || state.menuMode) requestExtraFrame();
        return;
      }
      if (state.standby && state.frameTable) {
        ensureNativeSetter()(frameStruct, state.frameTable[0]);
        state.standby = false;
      }
      if (state.enabled || state.shutdown) {
        applyEgl(state.enabled ? MODE_OFF : MODE_RESTORE);
      }
      if (state.enabled || state.menuMode) requestExtraFrame();
      if (!state.enabled && !state.menuMode && !state.standby) {
        shutdownAsync();
        state.frameTable = null;
      }
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
    }
  }

  function requestExtraFrame() {
    if (!interceptorState.request) return false;
    interceptorState.request();
    return true;
  }

  function shutdownAsync() {
    if (state.disposed) return undefined;
    try {
      if (egl.attempts > 0) {
        applyEgl(MODE_RESTORE);
      }
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
    }
    if (state.tickHandle !== null && cancelTick) {
      cancelTick(state.tickHandle);
      state.tickHandle = null;
    }
    while (interceptorState.listeners.length) {
      const listener = interceptorState.listeners.pop();
      try {
        listener.detach();
      } catch (err) {
      }
    }
    return undefined;
  }

  function coreSwitch(enable, menuMode) {
    if (state.disposed) {
      throw new Error('Frame-rate controller disposed');
    }
    enable = !!enable;
    if (!enable) menuMode = !!menuMode;
    if (enable === state.enabled && menuMode === state.menuMode) {
      return undefined;
    }
    installInterceptor();
    const wasActive = state.enabled || state.menuMode;
    if (wasActive) restoreFrameRate();
    state.enabled = enable;
    state.menuMode = menuMode;
    state.shutdown = false;
    if (wasActive && !enable) {
      state.shutdown = true;
    }
    state.standby = !enable && !menuMode && !!state.frameTable;
    if (enable || menuMode) applyFrameRate();
    if (state.tickHandle === null && scheduleTick) {
      state.tickHandle = scheduleTick(tick, TICK_MS);
    }
    if (interceptorState.request) {
      requestExtraFrame();
    }
    return undefined;
  }

  function tick() {
    if (state.enabled || state.menuMode) {
      applyFrameRate();
    }
    requestExtraFrame();
    return undefined;
  }

  function getBattle(on) {
    coreSwitch(!!on, on ? false : state.menuMode);
    return on ? state.enabled : state.menuMode;
  }

  function setEnabled(on) {
    coreSwitch(on ? false : state.enabled, !!on);
    return on ? state.menuMode : state.enabled;
  }

  function applySaved(saved) {
    if (saved && saved[SETTINGS_KEY] === true) {
      setEnabled(true);
    }
  }

  function dispose() {
    if (state.disposed) return undefined;
    const wasActive = state.enabled || state.menuMode;
    coreSwitch(false, false);
    try {
      if (state.applied && state.frameTable &&
          frameReady.readU8() !== 0) {
        ensureNativeSetter()(frameStruct, state.frameTable[0]);
        state.applied = false;
      }
      if (wasActive) {
        applyEgl(MODE_RESTORE);
      }
    } catch (err) {
      state.error = err && err.message ? err.message : String(err);
    }
    if (state.tickHandle !== null && cancelTick) {
      cancelTick(state.tickHandle);
      state.tickHandle = null;
    }
    state.disposed = true;
    if (interceptorState.cmodule) {
      try {
        interceptorState.cmodule.dispose();
      } catch (err) {
      }
    }
    interceptorState.cmodule = null;
    interceptorState.callback = null;
    interceptorState.request = null;
    return undefined;
  }

  function getState() {
    return {
      enabled: state.enabled,
      menuMode: state.menuMode,
      applied: state.applied,
      target: state.enabled || state.menuMode ? currentCap() : null,
      ready: state.disposed ? false : frameReady.readU8() !== 0,
      eglMode: egl.lastMode,
      eglAttempts: egl.attempts,
      nativeEgl: !!egl.natives,
      shutdown: state.shutdown,
      firstApply: state.firstApply,
      frameTable: state.frameTable,
      eglApplied: egl.applied,
      sessionKey: egl.sessionKey,
      nativeSetter: !!state.nativeSetter,
      listeners: interceptorState.listeners.length,
      disposed: state.disposed,
      error: state.error,
      featureId: VSYNC_BYPASS,
      settingsKey: SETTINGS_KEY,
    };
  }

  const api = {
    getBattle: getBattle,
    setEnabled: setEnabled,
    applySaved: applySaved,
    applyEgl: applyEgl,
    restoreFrameRate: restoreFrameRate,
    requestExtraFrame: requestExtraFrame,
    tick: tick,
    dispose: dispose,
    getState: getState,
  };

  return api;
}

module.exports = {
  FEATURE_ID,
  VSYNC_BYPASS,
  CMODULE_SOURCE,
  FRAME_TABLE_OFFSETS,
  FRAME_CAP_BATTLE,
  FRAME_CAP_MENU,
  label,
  isFiniteRate,
  createVsyncBypass,
};
