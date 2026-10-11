'use strict';

const VISUAL_GROUP_IDS = [17, 18, 19, 20, 21, 22, 23];

const OPTION_MODE = 0;
const OPTION_RED = 1;
const OPTION_GREEN = 2;
const OPTION_BLUE = 3;
const OPTION_HUE = 4;
const OPTION_CYCLE_SECONDS = 5;
const OPTION_SATURATION = 6;
const OPTION_BRIGHTNESS = 7;
const OPTION_OPACITY = 8;
const OPTION_GLOW = 9;

const MODE_SOLID = 'solid';
const MODE_RAINBOW = 'rainbow';

const RGB_MIN = 0;
const RGB_MAX = 255;
const OPACITY_MIN = 0.25;
const UNIT_MIN = 0;
const UNIT_MAX = 1;
const CYCLE_SECONDS_MIN = 6;
const CYCLE_SECONDS_MAX = 120;

const COMMAND_KEYS = [
  'initialize',
  'update',
  'commit',
  'destroy',
  'load',
  'save',
  'reset',
  'bind',
  'unbind',
  'refresh',
  'push',
  'pop',
  'flush',
  'acquire',
  'release',
  'validate',
  'prepare',
  'advance',
  'notify',
  'poll',
  'rebase',
  'snapshot',
  'mirror',
  'finalize',
];

const SLOT_COUNT = 39;

const SLOT_PROGRESS = 0;
const SLOT_TARGET = 1;
const SLOT_ACTIVE = 2;
const SLOT_READY = 3;
const SLOT_MODE = 12;
const SLOT_HUE = 13;
const SLOT_CYCLE_SECONDS = 14;
const SLOT_SATURATION = 15;
const SLOT_BRIGHTNESS = 16;
const SLOT_OPACITY = 17;
const SLOT_GLOW = 18;
const SLOT_RED = 23;
const SLOT_GREEN = 24;
const SLOT_BLUE = 25;
const SLOT_BOUND = 26;
const SLOT_SCALE = 33;

function clampNumber(value, fallback, min, max) {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, value));
}

function normalizeColorsOptions(raw) {
  const opts = raw || {};
  const mode = opts.mode === MODE_RAINBOW ? MODE_RAINBOW : MODE_SOLID;
  return {
    mode: mode,
    red: clampNumber(opts.red, RGB_MAX, RGB_MIN, RGB_MAX),
    green: clampNumber(opts.green, RGB_MAX, RGB_MIN, RGB_MAX),
    blue: clampNumber(opts.blue, RGB_MAX, RGB_MIN, RGB_MAX),
    hue: clampNumber(opts.hue, 0, 0, 360),
    cycleSeconds: clampNumber(
      opts.cycleSeconds, CYCLE_SECONDS_MAX,
      CYCLE_SECONDS_MIN, CYCLE_SECONDS_MAX
    ),
    saturation: clampNumber(opts.saturation, UNIT_MAX, UNIT_MIN, UNIT_MAX),
    brightness: clampNumber(opts.brightness, UNIT_MAX, UNIT_MIN, UNIT_MAX),
    opacity: clampNumber(opts.opacity, 1, OPACITY_MIN, UNIT_MAX),
    glow: clampNumber(opts.glow, UNIT_MAX, UNIT_MIN, UNIT_MAX),
  };
}

function hslToRgb(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(1, Math.max(0, s));
  const lig = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = c;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = c;
  } else if (hue < 180) {
    g = c;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = c;
  } else if (hue < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [
    Math.round((r + m) * RGB_MAX),
    Math.round((g + m) * RGB_MAX),
    Math.round((b + m) * RGB_MAX),
  ];
}

function currentStateColor(state) {
  if (state[SLOT_MODE]) {
    return hslToRgb(
      state[SLOT_HUE],
      state[SLOT_SATURATION],
      state[SLOT_BRIGHTNESS]
    );
  }
  return [
    Math.round(state[SLOT_RED]),
    Math.round(state[SLOT_GREEN]),
    Math.round(state[SLOT_BLUE]),
  ];
}

function createColorsGlowRuntime(deps) {
  const log = deps.log || function () {};

  if (!deps.base) {
    throw new Error('Visual runtime requires libg base');
  }

  const state = new Array(SLOT_COUNT).fill(0);
  state[SLOT_TARGET] = false;
  state[SLOT_ACTIVE] = false;
  state[SLOT_READY] = false;
  state[SLOT_BOUND] = false;

  const options = normalizeColorsOptions(deps.savedOptions);
  state[SLOT_MODE] = options.mode === MODE_RAINBOW ? 1 : 0;
  state[SLOT_HUE] = options.hue;
  state[SLOT_CYCLE_SECONDS] = options.cycleSeconds;
  state[SLOT_SATURATION] = options.saturation;
  state[SLOT_BRIGHTNESS] = options.brightness;
  state[SLOT_OPACITY] = options.opacity;
  state[SLOT_GLOW] = options.glow;
  state[SLOT_RED] = options.red;
  state[SLOT_GREEN] = options.green;
  state[SLOT_BLUE] = options.blue;
  state[SLOT_SCALE] = 1;

  const runtime = {
    enabled: false,
    disposed: false,
    lastError: null,
    startedAt: 0,
    binds: 0,
    updates: 0,
    errors: 0,
    nativeCalls: 0,
    hookState: false,
  };

  function buildNativeTable(base, offsetList) {
    const table = {};
    const offsets = offsetList || [];
    for (let slot = 0; slot < offsets.length; slot++) {
      const entry = offsets[slot];
      if (!entry) {
        continue;
      }
      table[String(slot)] = {
        address: base.add(entry.offset || 0),
        ret: entry.ret || 'void',
        args: entry.args || [],
        warm: entry.warm || false,
      };
    }
    return table;
  }

  function callNative(table, slot, args) {
    const entry = table[String(slot)];
    if (!entry) {
      return undefined;
    }
    runtime.nativeCalls++;
    if (typeof deps.invokeNative === 'function') {
      return deps.invokeNative(entry, args);
    }
    return undefined;
  }

  function advancePalette(now) {
    if (!state[SLOT_MODE]) {
      return state[SLOT_HUE];
    }
    const cycle = Math.max(1, state[SLOT_CYCLE_SECONDS]);
    const span = (now - runtime.startedAt) / (cycle * 1000);
    state[SLOT_HUE] = (span * 360) % 360;
    return state[SLOT_HUE];
  }

  function applySaved(saved) {
    const opts = normalizeColorsOptions(saved);
    state[SLOT_MODE] = opts.mode === MODE_RAINBOW ? 1 : 0;
    state[SLOT_RED] = opts.red;
    state[SLOT_GREEN] = opts.green;
    state[SLOT_BLUE] = opts.blue;
    state[SLOT_HUE] = opts.hue;
    state[SLOT_CYCLE_SECONDS] = opts.cycleSeconds;
    state[SLOT_SATURATION] = opts.saturation;
    state[SLOT_BRIGHTNESS] = opts.brightness;
    state[SLOT_OPACITY] = opts.opacity;
    state[SLOT_GLOW] = opts.glow;
  }

  function setMode(mode) {
    state[SLOT_MODE] = mode === MODE_RAINBOW ? 1 : 0;
    return state[SLOT_MODE] ? MODE_RAINBOW : MODE_SOLID;
  }

  function setColor(red, green, blue) {
    state[SLOT_RED] = clampNumber(red, state[SLOT_RED], RGB_MIN, RGB_MAX);
    state[SLOT_GREEN] = clampNumber(green, state[SLOT_GREEN], RGB_MIN, RGB_MAX);
    state[SLOT_BLUE] = clampNumber(blue, state[SLOT_BLUE], RGB_MIN, RGB_MAX);
  }

  function start(now) {
    runtime.startedAt = now === undefined ? Date.now() : now;
    runtime.enabled = true;
    return true;
  }

  function bind() {
    runtime.binds++;
    state[SLOT_BOUND] = true;
    return true;
  }

  function open() {
    runtime.enabled = true;
    return true;
  }

  function tick(now) {
    if (!runtime.enabled || runtime.disposed) {
      return undefined;
    }
    try {
      advancePalette(now === undefined ? Date.now() : now);
      runtime.updates++;
    } catch (error) {
      runtime.errors++;
      runtime.lastError = String(error);
      log(error);
    }
    return undefined;
  }

  function readState() {
    if (typeof deps.readStateBuffer === 'function') {
      const buffer = deps.readStateBuffer();
      if (buffer !== undefined && buffer !== null) {
        return buffer;
      }
    }
    return state;
  }

  function getState() {
    const view = readState();
    return {
      progress: view[SLOT_PROGRESS],
      target: !!view[SLOT_TARGET],
      active: !!view[SLOT_ACTIVE],
      ready: !!view[SLOT_READY],
      slot4: view[4],
      slot5: view[5],
      slot6: !!view[6],
      slot7: view[7],
      slot8: view[8],
      slot9: view[9],
      slot10: view[10],
      slot11: view[11],
      colors: {
        mode: view[SLOT_MODE] ? MODE_RAINBOW : MODE_SOLID,
        hue: view[SLOT_HUE],
        cycleSeconds: view[SLOT_CYCLE_SECONDS],
        saturation: view[SLOT_SATURATION],
        brightness: view[SLOT_BRIGHTNESS],
        opacity: view[SLOT_OPACITY],
        glow: view[SLOT_GLOW],
        colorsAux: view[19],
        red: view[SLOT_RED],
        green: view[SLOT_GREEN],
        blue: view[SLOT_BLUE],
      },
      slot20: view[20],
      slot21: view[21],
      slot22: view[22],
      bound: !!view[SLOT_BOUND],
      slot27: !!view[27],
      hookState: typeof deps.readHookState === 'function'
        ? !!deps.readHookState()
        : runtime.hookState,
      slot28: view[28],
      slot29: view[29],
      slot30: !!view[30],
      slot31: view[31],
      slot32: view[32],
      display: {
        scale: view[SLOT_SCALE],
        slot34: view[34],
        slot35: view[35],
        slot36: view[36],
        slot37: view[37],
      },
      slot38: !!view[38],
      runtimeView: typeof deps.readRuntimeView === 'function'
        ? deps.readRuntimeView()
        : undefined,
      error: runtime.lastError,
    };
  }

  function stats() {
    return {
      enabled: runtime.enabled,
      disposed: runtime.disposed,
      updates: runtime.updates,
      binds: runtime.binds,
      nativeCalls: runtime.nativeCalls,
      errors: runtime.errors,
      startedAt: runtime.startedAt,
      lastError: runtime.lastError,
    };
  }

  function dispose() {
    runtime.enabled = false;
    runtime.disposed = true;
  }

  const nativeTable = buildNativeTable(deps.base, deps.nativeOffsets);

  return {
    EVENT: COMMAND_KEYS,
    COMMAND_KEYS,
    MODE_SOLID,
    MODE_RAINBOW,
    nativeTable,
    callNative,
    start,
    bind,
    open,
    tick,
    applySaved,
    setMode,
    setColor,
    advancePalette,
    currentStateColor: function () {
      return currentStateColor(state);
    },
    getState,
    stats,
    dispose,
  };
}

module.exports = {
  VISUAL_GROUP_IDS,
  OPTION_MODE,
  OPTION_RED,
  OPTION_GREEN,
  OPTION_BLUE,
  OPTION_HUE,
  OPTION_CYCLE_SECONDS,
  OPTION_SATURATION,
  OPTION_BRIGHTNESS,
  OPTION_OPACITY,
  OPTION_GLOW,
  MODE_SOLID,
  MODE_RAINBOW,
  RGB_MIN,
  RGB_MAX,
  OPACITY_MIN,
  UNIT_MIN,
  UNIT_MAX,
  CYCLE_SECONDS_MIN,
  CYCLE_SECONDS_MAX,
  COMMAND_KEYS,
  SLOT_COUNT,
  clampNumber,
  normalizeColorsOptions,
  hslToRgb,
  currentStateColor,
  createColorsGlowRuntime,
};
