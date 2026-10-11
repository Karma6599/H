'use strict';

const FEATURE_ID = 42;

const NANI_GADGET = 42;

const MENU_LABEL_EN = 'Nani gadget';
const MENU_LABEL_RU = 'Автогаджет Нани';

const NANI_GADGET_KEY = 'nani_gadget';

const CHAR_CODE_KEY = [110, 97, 110, 105, 95, 103, 97, 100, 103, 101, 116];

const DESCRIPTION_EN =
  'Nani only. Uses Return to Sender when a bullet that is ' +
  'really going to hit you is close. Turns Auto Dodge while ' +
  'the gadget is active. Aim bot and Killaura will not shoot ' +
  'at Nani while her gadget is active.';

const SCAN_INTERVAL_MS = 25;
const MIN_TIME_TO_HIT_S = 0.012;
const MAX_TIME_TO_HIT_S = 0.3;
const MAX_BULLET_SPEED = 2500;
const NANI_PROJECTILE_KIND = 30;
const MAX_TRAVEL_TICKS = 64;
const HISTORY_SLOTS = 5;
const POSITION_BLEND = 0.6;
const VELOCITY_BLEND = 0.4;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createNaniGadget(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readOwnEntity = deps.readOwnEntity;
  const isNull = deps.isNull;
  const readS32 = deps.readS32;
  const readU8 = deps.readU8;
  const readPointer = deps.readPointer;
  const isGadgetReady = deps.isGadgetReady;
  const activateGadget = deps.activateGadget;
  const onIncomingBullet = deps.onIncomingBullet;

  const history = [0, 0, 0, 0, 0];
  let lastScanAt = 0;
  let busy = false;
  let incoming = false;
  let incomingAt = 0;

  function reportState(willHit, now) {
    incoming = willHit;
    incomingAt = willHit ? now : 0;
    if (onIncomingBullet) {
      onIncomingBullet(willHit, now);
    }
  }

  function scan(ownEntity, now) {
    if (ownEntity === null || ownEntity === undefined) return;
    if (now - lastScanAt < SCAN_INTERVAL_MS) return;
    lastScanAt = now;
    busy = true;
    try {
      scanOwn(ownEntity, now);
    } catch (err) {
      state.lastError = String(err);
    } finally {
      busy = false;
    }
  }

  function scanOwn(ownEntity, now) {
    if (!ownEntity.projectiles || !ownEntity.projectiles.length) {
      reportState(false, now);
      return;
    }
    if (ownEntity.incomingCount === undefined ||
        ownEntity.incomingCount <= 0) {
      reportState(false, now);
      return;
    }
    const projectile = ownEntity.projectiles[0];
    if (!projectile) {
      reportState(false, now);
      return;
    }
    const flightTicks = projectile.flightTicks | 0;
    const totalTicks = projectile.totalTicks | 0;
    if (flightTicks < 0 || flightTicks >= totalTicks ||
        totalTicks > MAX_TRAVEL_TICKS) {
      reportState(false, now);
      return;
    }
    if (isNull && isNull(projectile.ptr)) {
      reportState(false, now);
      return;
    }
    const impact = readPointer
      ? readPointer(projectile.ptr.add(projectile.stride * flightTicks))
      : null;
    if (!impact || (isNull && isNull(impact))) {
      reportState(false, now);
      return;
    }
    if ((readS32 ? readS32(impact.add(projectile.kindOffset)) : -1) !==
        NANI_PROJECTILE_KIND) {
      reportState(false, now);
      return;
    }
    const willHit = readU8
      ? readU8(impact.add(projectile.flagOffset)) !== 0
      : false;
    reportState(willHit, now);
    if (!willHit) return;

    if (isGadgetReady && !isGadgetReady()) return;
    triggerIfLethal(ownEntity, projectile, now);
  }

  function triggerIfLethal(ownEntity, projectile, now) {
    const hitTimeS =
      (projectile.hitY - history[2]) / 1000;
    if (hitTimeS < MIN_TIME_TO_HIT_S || hitTimeS > MAX_TIME_TO_HIT_S) {
      return;
    }
    const velocityX = (projectile.hitX - history[0]) / hitTimeS;
    const velocityY = (projectile.hitY - history[1]) / hitTimeS;
    const speed = Math.hypot(velocityX, velocityY);
    if (speed > MAX_BULLET_SPEED) return;

    history[3] = history[3] * VELOCITY_BLEND +
      velocityX * POSITION_BLEND;
    history[4] = history[4] * VELOCITY_BLEND +
      velocityY * POSITION_BLEND;
    history[0] = projectile.hitX;
    history[1] = projectile.hitY;
    history[2] = projectile.hitY;
    if (activateGadget) {
      activateGadget(now);
    }
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      lastScanAt = 0;
      incoming = false;
      incomingAt = 0;
      for (let i = 0; i < HISTORY_SLOTS; i++) history[i] = 0;
    } else {
      reportState(false, 0);
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    if (busy) return;
    const ownEntity = readOwnEntity ? readOwnEntity(now) : null;
    if (ownEntity) scan(ownEntity, now);
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      incoming: incoming,
      incomingAt: incomingAt,
      lastScanAt: lastScanAt,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    NANI_GADGET,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    DESCRIPTION_EN,
    FEATURE_KEY: NANI_GADGET_KEY,
    label,
    buildKey,
    setEnabled,
    applySaved,
    tick,
    scan,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  NANI_GADGET,
  label,
  buildKey,
  createNaniGadget,
};
