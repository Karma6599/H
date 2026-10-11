'use strict';

const FEATURE_ID = 5;

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
const ACTIVATE_WEAPON_HOOK = INPUT_OFFSET_KEYS.indexOf('activateWeapon');

const OPTION_KEYS = [
  'targeting',
  'ignoreBots',
  'useSuper',
  'useGadget',
  'debugView',
  'minOwnHp',
  'maxTargetHp',
];
const IDX_TARGETING = 0;
const IDX_IGNORE_BOTS = 1;
const IDX_SLOT10 = 10;

const TARGETING_NEAREST = 0;
const TARGETING_LOWEST_HP = 1;

const HOLD_FIRE_INTERVAL_MS = 150;
const TICK_THROTTLE_MS = 40;

function featureId(feature) {
  if (Number.isInteger(feature)) {
    return FEATURE_KEYS[feature] ? feature : -1;
  }
  return FEATURE_KEYS.indexOf(feature);
}

function compareCandidates(a, b) {
  return (a[2] - b[2]) || (a[1] - b[1]);
}

function createHoldToShoot(deps) {
  const offsets = Object.values(deps.offsets);
  const ext = deps.extendedOffsets;
  const inputGate = deps.inputGate;
  const hooks = new Map();
  const log = typeof deps.log === 'function' ? deps.log : () => {};

  const state = Object.fromEntries(BATTLE_FEATURES.map((id) => [id, false]));

  const tuning = [
    TARGETING_NEAREST,
    false,
    false,
    false,
    false,
    0,
    0,
  ];
  tuning[IDX_SLOT10] = undefined;

  let disposed = false;
  let suspended = false;
  let lastError = null;
  let focusGid = null;
  let lastHoldMs = 0;
  let holdStartedAt = 0;
  let lastTickMs = 0;

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
    const hook = Interceptor.attach(offsets[hookId], spec);
    hooks.set(hookId, hook);
    return hook;
  }

  function onWeaponActivate(args) {
    deps.recordInvocation(args);
    if (!(state[XRAY] || deps.isFireInFlight()) && focusGid !== null) return;
    try {
      const pending = deps.pendingCount();
      if (!pending) return;
      const slot = inputGate.getActiveSlot();
      if (slot && deps.readSlotIndex(slot) !== 4) return;
      const now = Date.now();
      if (!(deps.refreshWorld(now) ||
            now - deps.lastWorldRefreshMs() > 180 ||
            deps.worldNeedsRescan())) {
        return;
      }
      const weapon = deps.getWeaponContext();
      if (!weapon || !weapon[1].equals(deps.getWorld().battle)) return;
      const shooterA = deps.getQueuedWeapon();
      const shooterB = deps.getQueuedWeapon(1);
      if (!(args[4].equals(shooterA.append_array_83) ||
            (shooterB && args[4].equals(shooterB.append_array_83)))) {
        return;
      }
      const projectile = (deps.getWorld().entities || []).find(
        deps.isProjectileEntity
      );
      if (!projectile || !deps.validateRoot(projectile.array_904)) return;
      if (projectile.array_904.add(ext.projectileState).readS32() <= 0) return;
      args[1] = ptr(deps.readCoordinateX(projectile.array_904));
      args[2] = ptr(deps.readCoordinateY(projectile.array_904));
      args[5] = ptr(1);
      args[6] = ptr(projectile.gid);
      deps.countXrayRewrite(projectile.gid);
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
    }
  }

  function collectTarget(world, force) {
    const candidates = [];
    for (const entity of world.entities || []) {
      const enemyPass = deps.isEnemyEntity(entity, tuning[IDX_IGNORE_BOTS]);
      const priorityPass = tuning[IDX_SLOT10] && focusGid === null;
      if (!enemyPass && !(priorityPass && deps.isPriorityEntity(entity))) continue;
      if (focusGid !== null &&
          String(entity['capture_2435']) !== String(focusGid)) continue;
      const hpCapped = tuning[6] > 0 && entity['capture_2395'] > tuning[6];
      if ((!deps.isPriorityEntity(entity) || force) && hpCapped) continue;
      const dist = Math.hypot(entity.x - world.ownX, entity.y - world.ownY);
      if (!Number.isFinite(dist)) continue;
      const sortKey = deps.isPriorityEntity(entity)
        ? -1
        : (tuning[IDX_TARGETING] === TARGETING_LOWEST_HP
          ? entity['capture_2395']
          : dist);
      candidates.push([entity, dist, sortKey]);
    }
    if (candidates.length === 0) return null;
    candidates.sort(compareCandidates);
    return candidates[0];
  }

  function getTarget(now, force) {
    const world = deps.getWorld();
    if (!world) return null;
    if (force) {
      const focusTarget = deps.getFocusTarget(now);
      if (!focusTarget) {
        deps.clearKillauraTarget();
        return null;
      }
    }
    const best = collectTarget(world, force);
    if (!best) return null;
    const entity = best[0];
    if (!deps.isTargetable(entity, world)) return null;
    const cacheEntry = deps.getCacheEntry(entity['capture_2435']);
    let aim = { x: Math.round(entity.x), y: Math.round(entity.y) };
    aim = deps.applyLeadPrediction(aim, cacheEntry, entity, now);
    const dist = best[1];
    const weaponState = deps.getQueuedWeapon();
    return [
      entity,
      aim,
      dist,
      true,
      0,
      weaponState,
    ];
  }

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
      if (!state[HOLD_TO_SHOOT] && !state[XRAY] && !state[KILLAURA] &&
          !state[FOLLOW]) {
        return;
      }
      const screen = deps.getScreen();
      const attackHeld = screen.add(ext.attackHeld).readU8() !== 0;
      const superOverride = deps.superFlagOverride === true;
      const superCharging =
        (screen.add(ext.superFlagA).readU8() !== 0 && !superOverride) ||
        screen.add(ext.superFlagB).readU8() !== 0;
      const attackExtra = attackHeld &&
        screen.add(ext.attackExtra).readU8() !== 0;
      if (!state[HOLD_TO_SHOOT] || !attackHeld || superCharging) {
        holdStartedAt = 0;
        return;
      }
      if (!holdStartedAt) holdStartedAt = now;
      if (now - holdStartedAt >= HOLD_FIRE_INTERVAL_MS) {
        const target = focusGid !== null ? getTarget(now, true) : null;
        const hasPending = !target && deps.pendingCount() > 0;
        if (focusGid === null || target || hasPending) {
          deps.fire(parts, screen, target ? target[1] : null, now, attackExtra);
        }
      }
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
    }
  }

  function apply() {
    attachHook(
      ACTIVATE_WEAPON_HOOK,
      state[XRAY] || state[HOLD_TO_SHOOT],
      { onEnter: onWeaponActivate }
    );
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

  function applySaved(saved) {
    state[HOLD_TO_SHOOT] = saved ? saved.enabled === true : false;
    apply();
  }

  function getState() {
    return {
      enabled: state[HOLD_TO_SHOOT],
      hookInstalled: hooks.has(ACTIVATE_WEAPON_HOOK),
      focusGid,
      holdStartedAt,
      disposed,
      lastError: lastError === null ? null : String(lastError.message || lastError),
    };
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
  INPUT_OFFSET_KEYS,
  OPTION_KEYS,
  featureId,
  createHoldToShoot,
};
