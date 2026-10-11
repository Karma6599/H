'use strict';

const GADGET_TIMER_ID = 33;
const CHARGE_HUD_ID = 34;
const SAFE_TIMER_ID = 35;

const FROM_CHAR_CODE_TRIO = [
  [GADGET_TIMER_ID, buildKey(103, 97, 100, 103, 101, 116, 95, 116, 105, 109, 101, 114)],
  [CHARGE_HUD_ID, buildKey(99, 104, 97, 114, 103, 101, 95, 104, 117, 100)],
  [SAFE_TIMER_ID, buildKey(115, 97, 102, 101, 95, 116, 105, 109, 101, 114)],
];

function buildKey() {
  return String.fromCharCode.apply(String, arguments);
}

const FEATURE_KEY = buildKey(99, 104, 97, 114, 103, 101, 95, 104, 117, 100);

const MENU_LABEL_EN = buildKey(
  83, 117, 112, 101, 114, 32, 47, 32, 72, 121, 112, 101, 114, 32, 115,
  116, 97, 116, 101
);
const MENU_LABEL_RU = buildKey(
  1059, 1083, 1100, 1090, 1072, 32, 47, 32, 1075, 1080, 1087, 1077, 1088
);

const STATE_EMPTY = 0;
const STATE_CHARGING = 1;
const STATE_SUPER_READY = 2;
const STATE_HYPER_READY = 3;

const WEAPON_SLOT_SELECTED = 'selected weapon';
const WEAPON_SLOT_PRIMARY = 'primary weapon';
const WEAPON_SLOT_SUPER = 'super weapon';
const WEAPON_SLOT_GADGET = 'gadget';

const COUNTER_SUPER_ATTEMPTS = 'superAttempts';
const COUNTER_SUPER_SHOTS = 'superShots';

const TICK_MS = 80;
const FULL_CHARGE = 1;

function registerFeatureKeys(registry, schemaPath) {
  for (const [id, key] of FROM_CHAR_CODE_TRIO) {
    registry[id] = key;
    if (schemaPath) schemaPath[id] = key;
  }
  return registry;
}

function defaultFeatureStates() {
  const defaults = {};
  defaults[GADGET_TIMER_ID] = true;
  defaults[CHARGE_HUD_ID] = true;
  defaults[SAFE_TIMER_ID] = true;
  return defaults;
}

function createChargeHud(deps) {
  const state = {
    enabled: deps.features()[CHARGE_HUD_ID] === true,
    widgetState: STATE_EMPTY,
    lastCharge: 0,
    lastSuperAvailable: false,
    lastTick: 0,
    draws: 0,
    errors: 0,
  };

  function classifySuperState(superState) {
    if (!superState) return STATE_EMPTY;
    if (superState.hyper) return STATE_HYPER_READY;
    if (superState.available) return STATE_SUPER_READY;
    if (superState.charge > 0) return STATE_CHARGING;
    return STATE_EMPTY;
  }

  function formatSuperState(superState) {
    switch (classifySuperState(superState)) {
      case STATE_HYPER_READY:
        return 'HYPER READY';
      case STATE_SUPER_READY:
        return 'SUPER READY';
      case STATE_CHARGING: {
        const pct = Math.round(superState.charge * 100);
        return 'SUPER ' + pct + '%';
      }
      default:
        return 'NO SUPER';
    }
  }

  function setEnabled(enabled) {
    state.enabled = enabled === true;
    if (!state.enabled) deps.drawHud('', null);
    return state.enabled;
  }

  function tick(now, battle) {
    const t = now == null ? Date.now() : now;
    if (!state.enabled || t - state.lastTick < TICK_MS) return null;
    state.lastTick = t;

    let superState;
    try {
      superState = deps.readSuperState(battle);
    } catch (error) {
      state.errors += 1;
      return null;
    }

    const next = classifySuperState(superState);
    if (
      next !== state.widgetState ||
      Math.abs(superState.charge - state.lastCharge) >= 0.01
    ) {
      state.widgetState = next;
      state.lastCharge = superState.charge;
      deps.drawHud(formatSuperState(superState), null);
      state.draws += 1;
    }

    if (superState.available && !state.lastSuperAvailable) {
      deps.bump && deps.bump(COUNTER_SUPER_ATTEMPTS, 1);
    }
    if (
      state.lastSuperAvailable &&
      !superState.available &&
      state.lastCharge >= FULL_CHARGE
    ) {
      deps.bump && deps.bump(COUNTER_SUPER_SHOTS, 1);
    }
    state.lastSuperAvailable = superState.available;
    return superState;
  }

  function getState() {
    return {
      enabled: state.enabled,
      widgetState: state.widgetState,
      lastCharge: state.lastCharge,
      lastSuperAvailable: state.lastSuperAvailable,
      draws: state.draws,
      errors: state.errors,
    };
  }

  function dispose() {
    deps.drawHud('', null);
  }

  return {
    FEATURE_ID: CHARGE_HUD_ID,
    FEATURE_KEY,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    setEnabled,
    classifySuperState,
    formatSuperState,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  GADGET_TIMER_ID,
  CHARGE_HUD_ID,
  SAFE_TIMER_ID,
  FEATURE_KEY,
  FROM_CHAR_CODE_TRIO,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  STATE_EMPTY,
  STATE_CHARGING,
  STATE_SUPER_READY,
  STATE_HYPER_READY,
  WEAPON_SLOT_SUPER,
  COUNTER_SUPER_ATTEMPTS,
  COUNTER_SUPER_SHOTS,
  TICK_MS,
  buildKey,
  registerFeatureKeys,
  defaultFeatureStates,
  createChargeHud,
};
