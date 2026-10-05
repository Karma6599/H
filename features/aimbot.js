'use strict';

const ENTITY_INFO = 0;
const ENTITY_AIM = 1;
const ENTITY_WEAPON = 2;
const ENTITY_SCORE = 3;
const ENTITY_STAMP = 4;

const STATE_KEY = 0;
const STATE_TIME = 1;
const STATE_DATA = 2;

const TARGETING_NEAREST = 0;
const TARGETING_LOWEST_HP = 1;
const TARGETING_MANUAL = 2;
const TARGETING_MODES = ['nearest', 'lowest_hp', 'manual'];

const WEAPON_KINDS = ['selected', 'attack', 'super', 'gadget'];
const KIND_ATTACK = 1;
const KIND_SUPER = 2;
const KIND_GADGET = 3;

const RANGE = 0;
const PROJECTILE_SPEED = 1;

function isPointerUsable(ptr) {
  try {
    if (!ptr || ptr.isNull()) return false;
    ptr.readU8();
    return true;
  } catch (e) {
    return false;
  }
}

function createAim(deps, logger, scanner, config) {
  if (config === undefined) config = {};
  deps = ptr(deps);

  const isValidWeapon = (weapon) => {
    if (!weapon) return false;
    const kind = WEAPON_KINDS.indexOf(weapon.kind);
    return kind === KIND_ATTACK ||
           (kind === KIND_SUPER && useSuper) ||
           (kind === KIND_GADGET && useGadget);
  };

  const weaponNatives = createWeaponNatives(deps);
  const cache = createCache();

  if (!logger || typeof logger.scanBattle !== 'function') {
    throw new Error('Aim requires the shared on-demand battle scanner');
  }

  resolveNativeOffset(deps, AIM_OFFSETS.activateWeapon, 'activate weapon');

  let hooks = [];
  let manualAim = null;
  let enabled = false;
  let manual = true;
  let auto = true;
  let useSuper = false;
  let useGadget = false;
  let debugView = false;
  let ignoreBots = false;
  let focusName = null;
  let targeting = TARGETING_NEAREST;
  let anyTarget = false;
  let disposed = false;
  let context = null;
  let lastCounterA = 0;
  let lastCounterB = 0;
  let target = null;
  let aimResult = null;
  let cachedWeaponState = null;
  let aliveNative = null;
  let unsubscribeMotion = null;
  let lastTick = 0;
  let velocityScale = 1;
  let aimCone = 0.72;
  let latencyFloor = 0.035;
  let shots = 0;
  let updates = 0;
  let rejected = 0;
  let lastError = '';
  let creationError = '';
  let debugPayload = null;

  try {
    manualAim = createManualAim(deps);
  } catch (e) {
    creationError = String(e);
  }

  const onMotion = (snapshot) => {
    if (!snapshot) {
      debugPayload = null;
      clearPreview();
      lastTick = 0;
      context = null;
      lastCounterA = 0;
      target = null;
      cachedWeaponState = null;
      cache.clear();
      return false;
    }

    const prevChar = context && context.world ? String(context.world.ownCharacter) : null;
    const nextChar = snapshot.world ? String(snapshot.world.ownCharacter) : null;
    if (prevChar !== nextChar) {
      cache.clear();
      target = null;
      cachedWeaponState = null;
      lastCounterA = 0;
      lastCounterB = 0;
    }
    context = snapshot;

    const counterA = snapshot.world.counterA || 0;
    const counterB = snapshot.world.counterB || counterA;
    if (counterA !== lastCounterA) {
      lastCounterA = counterA;
      target = null;
    }
    if (counterB !== lastCounterB) {
      lastCounterB = counterB;
      syncMotionCache(snapshot);
      cache.update(snapshot.world.entities, counterB);
      updates++;
    }

    aimTick();

    if (debugView && enabled) {
      const pick = aimResult || pickTarget();
      if (pick) {
        debugPayload = {
          at: Date.now(),
          counterB: snapshot.world.counterB,
          ownY: snapshot.world.ownY,
          x: pick[ENTITY_AIM].x,
          y: pick[ENTITY_AIM].y,
          active: true,
        };
      } else {
        debugPayload = null;
      }
    }

    if (typeof config.onFrame === 'function') {
      config.onFrame();
    }
    return true;
  };

  const requestScan = (budget) => {
    try {
      return onMotion(logger.scanBattle(budget));
    } catch (e) {
      return false;
    }
  };

  const clearPreview = () => {
    aimResult = null;
    if (manualAim) manualAim.clear();
  };

  const isCandidate = (info) => {
    return isEnemyEntity(info, ignoreBots) ||
           (anyTarget && focusName === null) ||
           isPriorityEntity(info);
  };

  const hasPriorityTarget = (info) => {
    return !!isCandidate(info) &&
           (focusName === null || String(info.gid) === focusName);
  };

  const matchesFocus = (info) => {
    return focusName === null || String(info.gid) === focusName;
  };

  const isTargetable = (info) => {
    return matchesFocus(info) && isValidTarget(info);
  };

  const isValidTarget = (info) => {
    try {
      if (!isCandidate(info) ||
          isFriendlyUnit(context && context.battle, info) ||
          !info.ptr || info.ptr.isNull() ||
          info.ptr.add(AIM_OFFSETS.entityHealth).readS32() <= 0) {
        return false;
      }
      if (!isPriorityEntity(info)) return true;
      if (!aliveNative) {
        aliveNative = new NativeFunction(
          deps.add(AIM_OFFSETS.isAlive), 'bool', ['pointer']);
      }
      return info.ptr.add(AIM_OFFSETS.nearDistance).readS32() < 100 &&
             info.ptr.add(AIM_OFFSETS.visibleFlag).readU8() === 0
        ? !aliveNative(info.ptr)
        : false;
    } catch (e) {
      return false;
    }
  };

  const aimTick = () => {
    try {
      const world = context && context.world;
      if (!(enabled && manual && world && !world.paused)) return;

      const screen = manualAim.screen();
      if (!isPointerUsable(screen) || !isPointerUsable(world.ownCharacter) ||
          !screen.add(AIM_OFFSETS.screenAimFlag).readU8() ||
          !screen.add(AIM_OFFSETS.screenStateFlag).readU8() ||
          !world.ownCharacter.add(AIM_OFFSETS.charActiveFlag).readU8() ||
          world.ownCharacter.add(AIM_OFFSETS.charHealth).readS32() <= 0) {
        clearPreview();
        return;
      }

      const now = Date.now();
      if (now - lastTick < 40) return;
      lastTick = now;

      if (!(world.entities || []).some(hasPriorityTarget)) {
        clearPreview();
        return;
      }

      const weapon = weaponNatives.resolve(world.ownCharacter, context.battle);
      if (!isWeaponReady(weapon)) {
        clearPreview();
        return;
      }

      const aimPoint = manualAim.getAimPoint(screen, world.ownCharacter, weapon.data);
      if (!aimPoint) {
        clearPreview();
        return;
      }

      const shot = engine(aimPoint, weapon);
      if (!shot) {
        clearPreview();
        return;
      }
      aimResult = shot;
      manualAim.commit(screen, world.ownCharacter, shot);
    } catch (e) {
      lastError = String(e);
    }
  };

  const pickTarget = () => {
    const world = context && context.world;
    if (target && world &&
        target[ENTITY_STAMP] === world.counterA &&
        isValidTarget(target[ENTITY_INFO])) {
      return target;
    }
    target = engine();
    return target;
  };

  const engine = (aimPoint, weapon) => {
    if (!context || !context.world || !context.world.counterA) return null;
    const world = context.world;
    const scanState = context.wallScan;
    const candidates = (world.entities || []).filter(isTargetable);
    if (!candidates.length) return null;

    weapon = weapon || weaponNatives.resolve(world.ownCharacter, context.battle);
    if (!isValidWeapon(weapon)) return null;

    const weaponState = getWeaponState(world, weapon);
    if (!weaponState || !(weaponState[RANGE] > 0)) return null;

    const scanning = (anyTarget && focusName === null) ||
                     canScan(world, weaponState, scanState);

    let best = null;

    for (const candidate of candidates) {
      if (isPriorityEntity(candidate) || !scanning) continue;

      const dx = candidate.x - world.ownX;
      const dy = candidate.y - world.ownY;
      const dist = Math.hypot(dx, dy);
      if (!(dist > 1) ||
          dist > weaponState[RANGE] + Math.max(80, candidate.radius || 0)) {
        continue;
      }

      const cached = cache.get(candidate.gid);
      const threat = Math.max(300, candidate.threat || 1200);

      let vx = 0;
      let vy = 0;
      if (cached && cached.seen >= 2) {
        vx = Number.isFinite(cached.velX) ? cached.velX : 0;
        vy = Number.isFinite(cached.velY) ? cached.velY : 0;
        const speed = Math.hypot(vx, vy);
        if (speed > threat) {
          vx = vx / speed * threat;
          vy = vy / speed * threat;
        }
        vx *= velocityScale;
        vy *= velocityScale;
      }

      const latency = Math.max(latencyFloor,
        typeof config.measureLatency === 'function'
          ? config.measureLatency()
          : 0);
      const dt = Math.min(0.12,
        Math.max(0, (Date.now() - (world.counterB || world.counterA)) / 1000) +
        latency);

      const predicted = intercept(
        { x: world.ownX, y: world.ownY },
        { x: candidate.x, y: candidate.y },
        { x: vx, y: vy },
        { x: 0, y: 0 },
        dt,
        weaponState[PROJECTILE_SPEED]);

      const missX = predicted.x - candidate.x;
      const missY = predicted.y - candidate.y;
      const miss = Math.hypot(missX, missY);

      if (miss > 1) {
        const wallDist = scanState.raycast(
          candidate.x, candidate.y,
          missX / miss, missY / miss,
          miss,
          Math.max(1, candidate.radius || 60),
          scanState.BLOCKS_MOVEMENT);
        if (wallDist < miss) {
          const clearance = Math.max(15, (candidate.radius || 60) * 0.25);
          const t = Math.max(0, wallDist - clearance) / miss;
          predicted.x = candidate.x + missX * t;
          predicted.y = candidate.y + missY * t;
        }
      }

      if (!canHit(world, scanState, weaponState, predicted, candidate)) {
        rejected++;
        continue;
      }

      let score = targeting === TARGETING_LOWEST_HP ? candidate.hp : dist;

      if (aimPoint && focusName === null) {
        const aimDx = aimPoint.x - world.ownX;
        const aimDy = aimPoint.y - world.ownY;
        const aimDist = Math.hypot(aimDx, aimDy);
        if (aimDist > 1) {
          const cosAngle = clamp(
            (dx * aimDx + dy * aimDy) / (dist * aimDist), -1, 1);
          const angle = Math.acos(cosAngle);
          if (angle > aimCone) continue;
          score = angle * 9000 + dist * 0.08;
        }
      }

      if (isPriorityEntity(candidate)) score = -1;

      if (!best || score < best[ENTITY_SCORE]) {
        best = [
          candidate,
          { x: Math.round(predicted.x), y: Math.round(predicted.y) },
          weaponState,
          score,
          world.counterA,
        ];
      }
    }

    return best;
  };

  const getWeaponState = (world, weapon) => {
    const now = Date.now();
    if (!weapon) return null;
    const stateKey = String(world.ownCharacter) + ':' + String(weapon.data);

    if (cachedWeaponState &&
        cachedWeaponState[STATE_KEY] === stateKey &&
        now - cachedWeaponState[STATE_TIME] < 250) {
      return cachedWeaponState[STATE_DATA];
    }

    let minRange = 0;
    let maxRange = 3200;
    let speed = 35;
    let flat = false;
    let kind = 0;

    try {
      const profile = weapon.profile;
      if (profile) {
        if (Number.isFinite(profile.range)) maxRange = profile.range;
        if (Number.isFinite(profile.speed)) speed = profile.speed;
        if (Number.isFinite(profile.radius)) minRange = profile.radius;
        flat = profile.pierces === true;
      }
      if (isPointerUsable(weapon.ptr)) {
        flat = weapon.ptr.add(AIM_OFFSETS.flatFlag).readU8() !== 0;
        kind = weapon.ptr.add(AIM_OFFSETS.kindByte).readU8();
      }
    } catch (e) {
      return null;
    }

    const state = [minRange, maxRange, speed, flat, kind];
    cachedWeaponState = [stateKey, now, state];
    return state;
  };

  const isWeaponReady = (weapon) => {
    return isValidWeapon(weapon);
  };

  const onActivateWeapon = (args) => {
    if (!enabled || disposed) return;

    const kind = (args[5].toInt32() & 1) ? KIND_SUPER : KIND_ATTACK;
    if ((kind === KIND_ATTACK && !manual) ||
        (kind === KIND_SUPER && !auto)) return;

    const slotInfo = logger.getActiveSlot();
    if (!slotInfo || getSlotOwner(slotInfo) !== SLOT_OWNER_PLAYER) return;

    try {
      if (!requestScan(65)) return;

      const world = context.world;
      if (!world || world.paused || !isPointerUsable(world.ownCharacter)) return;
      if (!args[3].equals(world.ownCharacter)) return;
      if (!isPointerUsable(args[4])) return;
      if (!(world.entities || []).some(matchesFocus)) return;

      const weapon = weaponNatives.resolve(world.ownCharacter, context.battle);
      if (!isValidWeapon(weapon) || !args[4].equals(weapon.runtime)) return;

      executeAutoAim(args[0], kind, args, weapon);
    } catch (e) {
      lastError = String(e);
    }
  };

  const executeAutoAim = (handle, kind, args, weapon) => {
    if (kind === KIND_SUPER &&
        typeof config.vetoSuper === 'function' && config.vetoSuper()) {
      return false;
    }

    if (!enabled ||
        (kind === KIND_ATTACK && !manual) ||
        (kind === KIND_SUPER && !auto) ||
        !isPointerUsable(handle)) {
      return false;
    }

    const slotInfo = logger.getActiveSlot();
    if (!slotInfo || getSlotOwner(slotInfo) !== SLOT_OWNER_PLAYER) return false;
    if (context && context.world && context.world.paused) return false;

    let aimPoint = null;
    if (kind === KIND_ATTACK) {
      if (!args) {
        aimPoint = {
          x: handle.add(AIM_OFFSETS.aimX).readS32(),
          y: handle.add(AIM_OFFSETS.aimY).readS32(),
        };
      } else {
        aimPoint = (manualAim && manualAim.getAimPoint(handle, context.world.ownCharacter)) ||
                   { x: args[1].toInt32(), y: args[2].toInt32() };
      }
    }

    const shot = engine(aimPoint, weapon);
    if (!shot || !isValidTarget(shot[ENTITY_INFO])) return false;

    handle.add(AIM_OFFSETS.aimX).writeS32(shot[ENTITY_AIM].x);
    handle.add(AIM_OFFSETS.aimY).writeS32(shot[ENTITY_AIM].y);

    if (args) {
      args[1] = ptr(shot[ENTITY_AIM].x);
      args[2] = ptr(shot[ENTITY_AIM].y);
      args[5] = ptr(0);
      args[6] = ptr(0);
    }

    debugPayload = {
      at: Date.now(),
      counterB: context.world.counterB,
      ownY: context.world.ownY,
      x: shot[ENTITY_AIM].x,
      y: shot[ENTITY_AIM].y,
      active: true,
    };
    shots++;
    return shot;
  };

  const getDebugPayload = () => {
    return debugView && debugPayload && Date.now() - debugPayload.at <= 200
      ? debugPayload
      : null;
  };

  const setEnabled = (value) => {
    if (disposed) throw new Error('Aim disposed');

    const next = !!value && !!(manual || auto);
    if (next === enabled) return enabled;

    if (next) {
      if (typeof logger.subscribeMotion !== 'function') {
        throw new Error('Aim motion subscription is unavailable');
      }
      unsubscribeMotion = logger.subscribeMotion(onMotion, { noImmediate: false });
      enabled = true;
      return enabled;
    }

    enabled = false;
    if (unsubscribeMotion) {
      unsubscribeMotion();
      unsubscribeMotion = null;
    }
    onMotion(null);
    return enabled;
  };

  const setFlags = (flags) => {
    if (flags === undefined) flags = {};
    if (disposed) throw new Error('Aim disposed');

    if (typeof flags.useSuper === 'boolean') useSuper = flags.useSuper;
    if (typeof flags.useGadget === 'boolean') useGadget = flags.useGadget;
    if (typeof flags.debugView === 'boolean') debugView = flags.debugView;
    if (typeof flags.manual === 'boolean') manual = flags.manual;
    if (typeof flags.auto === 'boolean') auto = flags.auto;
    if (typeof flags.ignoreBots === 'boolean') ignoreBots = flags.ignoreBots;

    if (flags) {
      const merged = readSettings(SETTINGS_GROUP, flags);
      if (merged[SETTING_ANY_TARGET] !== undefined) {
        anyTarget = !!merged[SETTING_ANY_TARGET];
      }
    }

    clearPreview();
    target = null;
    debugPayload = null;
    if (!manual && !auto) {
      setEnabled(false);
    }
    return { manual, auto, ignoreBots };
  };

  const setTargeting = (options) => {
    clearPreview();
    if (options.targeting !== undefined) {
      if (options.targeting !== 'nearest' && options.targeting !== 'lowest_hp') {
        throw new Error('Invalid target selection');
      }
      targeting = TARGETING_MODES.indexOf(options.targeting);
      target = null;
    }
    if (options.ignoreBots !== undefined) {
      ignoreBots = !!options.ignoreBots;
      target = null;
    }
    return { targeting: targetingLabel(targeting), ignoreBots };
  };

  const setFocus = (value) => {
    focusName = value == null ? null : String(value);
    clearPreview();
    target = null;
    return focusName;
  };

  const setTuning = (velocityPercent, coneDegrees, latencyMs) => {
    if (Number.isFinite(velocityPercent)) {
      velocityScale = Math.max(0, Math.min(1.5, velocityPercent / 100));
    }
    if (Number.isFinite(coneDegrees)) {
      aimCone = Math.max(10, Math.min(90, coneDegrees)) / 180 * Math.PI;
    }
    if (Number.isFinite(latencyMs)) {
      latencyFloor = Math.max(0, Math.min(180, latencyMs)) / 1000;
    }
    target = null;
  };

  const peekAim = (kindStr, snapshot, useEngine) => {
    const kind = WEAPON_KINDS.indexOf(kindStr);

    if (disposed || !enabled) return null;
    if (kind === KIND_ATTACK && !manual) return null;
    if (kind === KIND_SUPER && !auto) return null;

    if (!snapshot) return null;
    if (!onMotion(snapshot)) return null;
    if (!context || !context.world || context.world.paused) return null;

    if (kind === KIND_ATTACK && manualAim) {
      const screen = manualAim.screen();
      const point = manualAim.getAimPoint(screen, context.world.ownCharacter);
      if (point) return { x: point.x, y: point.y };
    }

    if (useEngine) {
      const shot = engine(null, null);
      if (shot) {
        return { x: shot[ENTITY_AIM].x, y: shot[ENTITY_AIM].y };
      }
    }
    return null;
  };

  const getState = () => {
    const state = {
      runtime: manualAim ? manualAim.getState()
        : { ready: false, error: creationError },
      creationError,
      enabled,
      manual,
      auto,
      useSuper,
      useGadget,
      debugView,
      ignoreBots,
      focusName,
      targeting: targetingLabel(targeting),
      hasTarget: !!context &&
        (context.world.entities || []).some(isAliveEntity),
      disposed,
      target: target ? String(target[ENTITY_INFO].gid)
        : (aimResult ? String(aimResult[ENTITY_INFO].gid) : null),
      aim: target ? target[ENTITY_AIM]
        : (aimResult ? aimResult[ENTITY_AIM] : null),
      tracked: cache.size(),
      shots,
      updates,
      rejected,
      lastError,
      hooks: hooks.length,
    };
    return state;
  };

  const dispose = () => {
    if (disposed) return;
    setEnabled(false);
    disposed = true;
    cache.clear();
    for (const hook of hooks) {
      if (hook && typeof hook === 'object' && typeof hook.detach === 'function') {
        hook.detach();
      } else if (typeof hook === 'function') {
        hook();
      }
    }
    hooks = [];
    if (manualAim && typeof manualAim.dispose === 'function') {
      manualAim.dispose();
    }
    target = null;
    aimResult = null;
    debugPayload = null;
    context = null;
  };

  hooks.push(Interceptor.attach(deps.add(AIM_OFFSETS.activateWeapon), {
    onEnter: onActivateWeapon,
  }));

  return {
    setEnabled,
    setFlags,
    setTargeting,
    setFocus,
    getFocus: () => focusName,
    setTuning,
    peekAim,
    getDebugPayload,
    dispose,
    getState,
  };
}
