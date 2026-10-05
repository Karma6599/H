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
  '_$c4a008b45f098e9c9a99c679',
  '_$6ff76fd71ed8749d4b126f55',
  '_$a0ecdfeb91f25b0091d3e509',
  'fire',
  '_$ffbd8f1f343d7bcfdf56c231',
  '_$d822d590a1067e5a255382d1',
  '_$01e31636f1888bf1817d00ff',
  '_$53241e273efd49bf18d0164f',
  '_$1e1d1a0ea4a2176a2e52e360',
  '_$86ba4058ce7a7757d0d790db',
  '_$0577fe14f99e51f5b1eb4c9d',
  '_$c1471263b0d1e96e43128436',
  '_$05f14d4afd6ecbf8df7884b1',
  '_$abdd3d86d875b8cdaa3016e9',
  '_$095e11e0707dccd52138c65d',
  '_$598ce79000ea943bbfe4c64b',
  '_$a5f41b3a1a01395ef3cf2563',
  '_$0fceef48d031fbd184e4369a',
];

const INACTIVITY_OFFSET = INPUT_OFFSET_KEYS.indexOf('_$1e1d1a0ea4a2176a2e52e360');
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
