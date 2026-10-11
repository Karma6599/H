'use strict';

const FEATURE_ID = 4;

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
const IDX_USE_SUPER = 2;
const IDX_USE_GADGET = 3;
const IDX_DEBUG_VIEW = 4;
const IDX_MIN_OWN_HP = 5;
const IDX_MAX_TARGET_HP = 6;
const IDX_SLOT10 = 10;

const TARGETING_NEAREST = 0;
const TARGETING_LOWEST_HP = 1;
const TARGETING_MODES = [TARGETING_NEAREST, TARGETING_LOWEST_HP];

const LASERBALL_CLASS_IDS = [3, 4, 10, 23];
const LASERBALL_NAME = '^(Multi)?LaserBall$';
const FIELD_CLASS_ID = 'classId';
const FIELD_FALLBACK_NAME = 'fallbackName';
const FIELD_ACTIVE = 'active';

const FIRE_INTERVAL_MS = 250;
const ATTEMPT_COOLDOWN_MS = 90;
const QUEUE_COOLDOWN_MS = 90;
const TICK_THROTTLE_MS = 40;
const INPUT_WINDOW_MS = 80;

const COUNTER_KEYS = [
  'ticks',
  'scans',
  'shots',
  'attempts',
  'queued',
  'heldAimResolved',
  'xrayRewrites',
  'xrayLastGid',
  'xrayBlocked',
  'superAttempts',
  'superShots',
  'moves',
  'pulses',
  'rejectedWalls',
  'errors',
  'weaponResolves',
  'targetTraces',
  'nativeSuppressed',
  'tickMsTotal',
  'tickMsMax',
];
const IDX_TICKS = 0;
const IDX_SCANS = 1;
const IDX_SHOTS = 2;
const IDX_ATTEMPTS = 3;
const IDX_QUEUED = 4;
const IDX_HELD_AIM_RESOLVED = 5;
const IDX_SUPER_ATTEMPTS = 9;
const IDX_SUPER_SHOTS = 10;
const IDX_TARGET_TRACES = 16;
const IDX_TICK_MS_TOTAL = 18;
const IDX_TICK_MS_MAX = 19;

const REASON_GATE = 100;
const REASON_NOT_READY = 102;

const BUTTON_MAIN = 4;

function featureId(feature) {
  if (Number.isInteger(feature)) {
    return FEATURE_KEYS[feature] ? feature : -1;
  }
  return FEATURE_KEYS.indexOf(feature);
}

function isEnemyEntity(entity, ignoreBots) {
  return deps_isEnemy(entity, ignoreBots);
}

function deps_isEnemy() {
  return false;
}

function createKillaura(deps) {
  const offsets = Object.values(deps.offsets);
  const ext = deps.extendedOffsets;
  const inputGate = deps.inputGate;
  const log = typeof deps.log === 'function' ? deps.log : () => {};

  const state = Object.fromEntries(BATTLE_FEATURES.map((id) => [id, false]));
  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));

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
  let killauraHook = null;
  let targetPosition = null;
  let focusGid = null;
  let rangeMultiplier = 1;
  let fireIntervalMs = FIRE_INTERVAL_MS;
  let lastFireMs = 0;
  let lastAttemptMs = 0;
  let lastQueueMs = 0;
  let lastTickMs = 0;
  let inFlight = false;

  function applyTuning(options) {
    const opts = options === undefined ? {} : options;
    const settings = deps.readSettings(6, opts);
    for (const key of [IDX_MIN_OWN_HP, IDX_MAX_TARGET_HP]) {
      if (settings[key] !== undefined) {
        const value = Number(settings[key]);
        if (!Number.isFinite(value) || value < 0 || value > 1000000) {
          throw new Error('Invalid ' + OPTION_KEYS[key]);
        }
        tuning[key] = Math.round(value);
      }
    }
    if (settings[IDX_TARGETING] !== undefined) {
      if (typeof opts['capture_2095'] !== 'string' ||
          !TARGETING_MODES.includes(settings[IDX_TARGETING])) {
        throw new Error('Invalid target selection');
      }
      tuning[IDX_TARGETING] = settings[IDX_TARGETING];
    }
    if (settings[IDX_IGNORE_BOTS] !== undefined) {
      tuning[IDX_IGNORE_BOTS] = !!settings[IDX_IGNORE_BOTS];
    }
    for (const key of [IDX_USE_SUPER, IDX_USE_GADGET, IDX_DEBUG_VIEW, IDX_SLOT10]) {
      if (settings[key] !== undefined) {
        tuning[key] = !!settings[key];
      }
    }
    return deps.writeSettings(6, tuning);
  }

  function setTuning(rangePercent, intervalMs) {
    if (Number.isFinite(rangePercent)) {
      rangeMultiplier = Math.max(0.5, Math.min(1, rangePercent / 100));
    } else {
      rangeMultiplier = 1;
    }
    if (Number.isFinite(intervalMs)) {
      fireIntervalMs = Math.max(90, Math.min(600, intervalMs));
    } else {
      fireIntervalMs = FIRE_INTERVAL_MS;
    }
  }

  function isTargetable(entity, world) {
    try {
      if (deps.isFriendlyUnit(world ? world.battle : world, entity)) return false;
      const enemyPass = deps.isEnemyEntity(entity, tuning[IDX_IGNORE_BOTS]);
      const priorityPass = tuning[IDX_SLOT10] && focusGid === null;
      if (!enemyPass && !(priorityPass && deps.isPriorityEntity(entity))) return false;
      if (!state[KILLAURA]) return true;
      const entityPtr = entity.array_904;
      if (!entityPtr || entityPtr.isNull()) return false;
      if (entityPtr.add(ext.entityHp).readS32() <= 0) return false;
      return true;
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
      return false;
    }
  }

  function isKillauraCandidate(entity) {
    if (!entity || !(entity['capture_2395'] > 0)) return false;
    if (!deps.isEnemyEntity(entity, tuning[IDX_IGNORE_BOTS])) return false;
    if (!LASERBALL_CLASS_IDS.includes(entity[FIELD_CLASS_ID])) return false;
    const name = entity.name || entity[FIELD_FALLBACK_NAME] || String();
    if (!new RegExp(LASERBALL_NAME).test(name)) return false;
    return true;
  }

  function findKillauraTarget(world, ownPos, snapshot) {
    const wallScan = world.wallScan;
    const maxDist = snapshot.range * rangeMultiplier;
    const candidates = [];
    for (const entity of world.entities || []) {
      if (focusGid !== null &&
          String(entity['capture_2435']) !== String(focusGid)) continue;
      if (tuning[IDX_MAX_TARGET_HP] > 0 &&
          entity['capture_2395'] > tuning[IDX_MAX_TARGET_HP]) continue;
      if (!isKillauraCandidate(entity)) continue;
      if (!isTargetable(entity, world)) continue;
      const predicted = deps.predictPosition(entity, snapshot.dt);
      const dist = Math.hypot(predicted.x - ownPos[0], predicted.y - ownPos[1]);
      if (dist > maxDist) continue;
      const radius = Math.max(1, entity.radius || 60);
      const wallHit = wallScan.castRay(
        ownPos[0],
        ownPos[1],
        (predicted.x - ownPos[0]) / dist,
        (predicted.y - ownPos[1]) / dist,
        dist,
        Math.max(1, snapshot.radius),
        wallScan.layers
      );
      if (wallHit < dist - radius) continue;
      candidates.push([
        tuning[IDX_TARGETING] === TARGETING_LOWEST_HP
          ? entity['capture_2395']
          : dist,
        dist,
        entity,
        predicted,
      ]);
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
    return candidates[0];
  }

  function fire(parts, screen, targetOverride, now, superFlag, queuedOverride) {
    const queued = queuedOverride === undefined
      ? deps.getQueuedWeapon()
      : queuedOverride;
    if (!deps.canAct(parts)) {
      if (targetPosition) {
        targetPosition[FIELD_ACTIVE] = false;
        targetPosition.reason = REASON_GATE;
      }
      return false;
    }
    if (inputGate && inputGate.isButtonBlocked &&
        inputGate.isButtonBlocked(BUTTON_MAIN, INPUT_WINDOW_MS)) {
      return false;
    }
    if (inFlight && now - lastFireMs < fireIntervalMs) return false;
    if (now - lastAttemptMs < ATTEMPT_COOLDOWN_MS) return false;
    if (now - lastQueueMs < QUEUE_COOLDOWN_MS) {
      counters[COUNTER_KEYS[IDX_QUEUED]]++;
      return false;
    }
    if (!queued || !queued.ready()) {
      if (targetPosition) {
        targetPosition[FIELD_ACTIVE] = false;
        targetPosition.reason = REASON_NOT_READY;
      }
      return false;
    }
    inFlight = true;
    let aim = targetOverride;
    if (!aim || superFlag) {
      const packed = deps.readPackedPosition(screen, parts[2], queued.capture_2000);
      const hex = packed.toString(16).padStart(16, '0');
      aim = {
        x: parseInt(hex.slice(-8), 16) | 0,
        y: parseInt(hex.slice(0, -8), 16) | 0,
      };
    }
    aim = deps.resolveAim(superFlag ? 'manual' : aim, parts[1]);
    if (Number.isFinite(aim.x) && Number.isFinite(aim.y)) {
      aim = { x: Math.round(aim.x), y: Math.round(aim.y) };
      counters[COUNTER_KEYS[IDX_HELD_AIM_RESOLVED]]++;
    }
    lastAttemptMs = now;
    if (queued['capture_1292'] === 'super') {
      counters[COUNTER_KEYS[IDX_SUPER_ATTEMPTS]]++;
    }
    screen.add(offsets[17]).writeS32(aim.x);
    screen.add(offsets[18]).writeS32(aim.y);
    const result = deps.activateWeapon(
      screen,
      aim.x,
      aim.y,
      parts[2],
      queued.append_array_83,
      0
    );
    counters[COUNTER_KEYS[IDX_ATTEMPTS]]++;
    const stillValid = screen.add(ext.weaponPtr).readPointer().isNull() ||
      !(screen.add(ext.weaponState).readFloat() > 0);
    if (result || stillValid) {
      lastFireMs = now;
      if (result) {
        counters[COUNTER_KEYS[IDX_SHOTS]]++;
        if (queued['capture_1292'] === 'super') {
          counters[COUNTER_KEYS[IDX_SUPER_SHOTS]]++;
        }
      } else {
        counters[COUNTER_KEYS[IDX_SCANS]]++;
      }
      inFlight = false;
      if (inputGate && inputGate.notifyFired) {
        inputGate.notifyFired(BUTTON_MAIN);
      }
      return true;
    }
    return false;
  }

  function tick(now, snapshot) {
    if (typeof now !== 'number') now = Date.now();
    if (disposed || suspended) return;
    if (!deps.anyFeatureActive() && now - lastTickMs < TICK_THROTTLE_MS) return;
    lastTickMs = now;
    const startedAt = now;
    try {
      const parts = [
        deps.readRoot(),
        snapshot ? snapshot.battle : undefined,
        snapshot ? snapshot.world.scene : undefined,
      ];
      if (!parts[2] || parts[2].isNull() ||
          parts[2].add(ext.sceneState).readS32() <= 0 ||
          !deps.validateRoot(parts[0])) {
        deps.resetRuntime();
        return;
      }
      if (!state[KILLAURA] && !state[HOLD_TO_SHOOT] &&
          !state[FOLLOW] && !state[XRAY]) {
        return;
      }
      const world = deps.refreshWorld(now, snapshot);
      if (!world || !world.battle.equals(parts[1])) {
        deps.resetRuntime();
        return;
      }
      if (!state[KILLAURA]) {
        targetPosition = null;
        return;
      }
      counters[COUNTER_KEYS[IDX_TICKS]]++;
      const target = findKillauraTarget(
        world,
        [world.ownX, world.ownY],
        deps.getSnapshot()
      );
      if (target) {
        targetPosition = { x: target[3].x, y: target[3].y };
        fire(parts, deps.getScreen(), targetPosition, now, false);
      }
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
    } finally {
      const elapsed = Math.max(0, Date.now() - startedAt);
      counters[COUNTER_KEYS[IDX_TICK_MS_TOTAL]] += elapsed;
      counters[COUNTER_KEYS[IDX_TICK_MS_MAX]] = Math.max(
        counters[COUNTER_KEYS[IDX_TICK_MS_MAX]],
        elapsed
      );
      suspended = false;
    }
  }

  function onHookEnter(args) {
    if (state[KILLAURA] && isKillauraCandidate(args[0])) {
      counters[COUNTER_KEYS[IDX_TARGET_TRACES]]++;
    }
  }

  function installHook() {
    if (state[KILLAURA] && !killauraHook) {
      const target = deps.resolveNativeAddress(
        deps.base,
        deps.hookOffset,
        String(deps.hookOffset)
      );
      killauraHook = Interceptor.attach(target, { onEnter: onHookEnter });
    } else if (!state[KILLAURA] && killauraHook) {
      killauraHook.detach();
      killauraHook = null;
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
    const previous = state[id];
    state[id] = on;
    try {
      installHook();
    } catch (e) {
      state[id] = previous;
      lastError = e;
      log(String(e && e.message ? e.message : e));
      throw e;
    }
    if (!on && id === KILLAURA) targetPosition = null;
    return state[id];
  }

  function applySaved(saved) {
    applyTuning(saved);
    state[KILLAURA] = saved ? saved.enabled === true : false;
    installHook();
  }

  function setFocus(gid) {
    focusGid = gid === undefined || gid === null ? null : gid;
    if (focusGid === null) targetPosition = null;
    return focusGid;
  }

  function getState() {
    return {
      enabled: state[KILLAURA],
      tuning: tuning.slice(0, OPTION_KEYS.length),
      rangeMultiplier,
      fireIntervalMs,
      counters: Object.assign({}, counters),
      hookInstalled: killauraHook !== null,
      focusGid,
      hasTarget: targetPosition !== null,
      disposed,
      lastError: lastError === null ? null : String(lastError.message || lastError),
    };
  }

  function dispose() {
    disposed = true;
    if (killauraHook) {
      try {
        killauraHook.detach();
      } catch (e) {}
      killauraHook = null;
    }
  }

  return {
    FEATURE_ID,
    setEnabled,
    applySaved,
    applyTuning,
    setTuning,
    setFocus,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  OPTION_KEYS,
  COUNTER_KEYS,
  featureId,
  createKillaura,
};
