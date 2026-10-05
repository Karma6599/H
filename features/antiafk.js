'use strict';

const FEATURE_KEYS = [
  '',
  'aim_bot',
  'auto_dodge',
  'auto_farm',
  'killaura',
  'hold_to_shoot',
  'auto_spin',
  'emotes',
  'follow',
  'xray',
  'goal',
  'ball_assist',
  'ball_trajectory',
  null,
  'anti_afk',
  'mortis_chain',
  'server_region',
  'leon_clone',
  'enemy_ammo',
  'disable_shake',
  'teammate_hp',
  'ally_respawn',
  'dps_counter',
  'camera',
  'chromatic_name',
  'fps_counter',
  'vsync_bypass',
  'server_ip',
];

const KILLAURA = 4;
const HOLD_TO_SHOOT = 5;
const XRAY = 8;
const GOAL = 9;
const ANTI_AFK = 14;

const INPUT_FEATURES = [KILLAURA, HOLD_TO_SHOOT, XRAY, GOAL, ANTI_AFK, 42];

const INPUT_OFFSET_KEYS = [
  'mode',
  'screen',
  'own',
  'x',
  'y',
  'data',
  'move',
  'input',
  'submit',
  'alloc',
  'free',
  'fire',
  'activateWeapon',
  'native13',
  'native14',
  'native15',
  'inactivityCheck',
  'aimX',
  'aimY',
  'packedPosition',
  'ctxGate',
  'ctxGateAlt',
  'ctxGateFallback',
  'cellIndex',
  'cellOffset',
  'native25',
];

const INACTIVITY_OFFSET = INPUT_OFFSET_KEYS.indexOf('inactivityCheck');
const INACTIVITY_HOOK = INACTIVITY_OFFSET;

function featureId(feature) {
  if (Number.isInteger(feature)) {
    return FEATURE_KEYS[feature] ? feature : -1;
  }
  return FEATURE_KEYS.indexOf(feature);
}

function createAntiAfk(deps, logger) {
  const offsets = Object.values(deps.offsets);
  const hooks = new Map();
  const state = Object.fromEntries(INPUT_FEATURES.map((id) => [id, false]));

  let disposed = false;
  let lastError = null;

  const log = typeof logger === 'function' ? logger : () => {};

  function attachHook(hookId, on, spec) {
    if (!on) {
      const existing = hooks.get(hookId);
      if (existing) {
        existing.detach();
        hooks.delete(hookId);
      }
      return undefined;
    }
    if (hooks.has(hookId)) return undefined;
    return Interceptor.attach(offsets[hookId], spec);
  }

  function onLeave(retval) {
    if (!state[ANTI_AFK]) return;
    retval.replace(ptr(0));
  }

  function apply() {
    attachHook(INACTIVITY_HOOK, state[ANTI_AFK], { onLeave });
  }

  function setEnabled(feature, on) {
    const raw = feature;
    const id = featureId(feature);
    if (disposed) {
      throw new Error('Battle runtime disposed');
    }
    if (!INPUT_FEATURES.includes(id)) {
      throw new Error('Unknown battle function: ' + raw);
    }
    on = !!on;
    if (state[id] === on) return on;
    const previous = state[id];
    state[id] = on;
    try {
      apply();
    } catch (e) {
      state[id] = previous;
      lastError = e;
      log(String(e && e.message ? e.message : e));
      throw e;
    }
    return state[id];
  }

  function dispose() {
    disposed = true;
    for (const hook of hooks.values()) {
      try {
        hook.detach();
      } catch (e) {}
    }
    hooks.clear();
  }

  function getState() {
    return {
      enabled: state[ANTI_AFK],
      features: Object.fromEntries(
        INPUT_FEATURES.map((id) => [FEATURE_KEYS[id], state[id]])
      ),
      disposed,
      lastError: lastError === null ? null : String(lastError.message || lastError),
    };
  }

  return {
    setEnabled,
    dispose,
    getState,
  };
}
