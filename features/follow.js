'use strict';

const FEATURE_ID = 8;

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
const FOLLOW = 8;
const XRAY = 9;
const ANTI_AFK = 14;
const NANI_GADGET = 42;
const BATTLE_FEATURES = [KILLAURA, HOLD_TO_SHOOT, FOLLOW, XRAY, ANTI_AFK, NANI_GADGET];

const DEFAULT_FOLLOW_RADIUS = 700;
const TICK_THROTTLE_MS = 40;

function featureId(feature) {
  if (Number.isInteger(feature)) {
    return FEATURE_KEYS[feature] ? feature : -1;
  }
  return FEATURE_KEYS.indexOf(feature);
}

function createFollow(deps) {
  const ext = deps.extendedOffsets;
  const log = typeof deps.log === 'function' ? deps.log : () => {};

  const state = Object.fromEntries(BATTLE_FEATURES.map((id) => [id, false]));

  let disposed = false;
  let suspended = false;
  let lastError = null;
  let lastTickMs = 0;
  let followTarget = null;

  function tick(now, snapshot) {
    if (typeof now !== 'number') now = Date.now();
    if (disposed || suspended) return;
    if (!deps.anyFeatureActive() && now - lastTickMs < TICK_THROTTLE_MS) return;
    lastTickMs = now;
    try {
      const parts = [
        deps.readRoot(),
        snapshot ? snapshot.battle : undefined,
        snapshot ? snapshot.world.scene : undefined,
      ];
      if (!deps.refreshWorld(now, snapshot)) return;
      if (!state[FOLLOW] && !state[KILLAURA] && !state[HOLD_TO_SHOOT] &&
          !state[XRAY]) {
        return;
      }
      const screen = deps.getScreen();
      if (!state[FOLLOW] || screen.add(ext.attackHeld).readU8() !== 0) {
        followTarget = null;
        return;
      }
      const world = deps.getWorld();
      const target = deps.getTarget(now);
      if (!target) {
        followTarget = null;
        return;
      }
      const spec = deps.buildFollowSpec(
        { x: world.ownX, y: world.ownY },
        target[1],
        DEFAULT_FOLLOW_RADIUS
      );
      deps.submitMove(parts, screen, spec, now);
      followTarget = target;
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
    }
  }

  function setEnabled(feature, on) {
    const raw = feature;
    const id = featureId(feature);
    if (disposed) {
      throw new Error('Battle runtime disposed');
    }
    if (!BATTLE_FEATURES.includes(id)) {
      throw new Error('Unknown battle function: ' + raw);
    }
    on = !!on;
    if (state[id] === on) return on;
    state[id] = on;
    if (!on && id === FOLLOW) followTarget = null;
    return state[id];
  }

  function applySaved(saved) {
    state[FOLLOW] = saved ? saved.enabled === true : false;
    if (!state[FOLLOW]) followTarget = null;
  }

  function getState() {
    return {
      enabled: state[FOLLOW],
      hasTarget: followTarget !== null,
      target: followTarget
        ? {
            gid: followTarget[0]['capture_2435'],
            aim: followTarget[1],
            dist: followTarget[2],
          }
        : null,
      disposed,
      lastError: lastError === null ? null : String(lastError.message || lastError),
    };
  }

  function dispose() {
    disposed = true;
    followTarget = null;
  }

  return {
    FEATURE_ID,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  featureId,
  createFollow,
};
