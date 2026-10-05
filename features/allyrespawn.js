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

const LEON_CLONE = 17;
const ENEMY_AMMO = 18;
const DISABLE_SHAKE = 19;
const TEAMMATE_HP = 20;
const ALLY_RESPAWN = 21;
const DPS_COUNTER = 22;
const CAMERA = 23;

const VISUAL_FEATURES = [
  LEON_CLONE,
  ENEMY_AMMO,
  DISABLE_SHAKE,
  TEAMMATE_HP,
  ALLY_RESPAWN,
  DPS_COUNTER,
  CAMERA,
];

const HUD_SHARED_FEATURES = [TEAMMATE_HP, ALLY_RESPAWN, DPS_COUNTER];

const WIDGET_TICK_MS = 120;
const MAX_SLOTS = 64;
const RED = 'FF3333';

const ENTITY_FIELDS = {
  slot: 27,
  team: 3,
  state: 9,
  hp: 28,
};

function featureId(feature) {
  if (Number.isInteger(feature)) {
    return FEATURE_KEYS[feature] ? feature : -1;
  }
  return FEATURE_KEYS.indexOf(feature);
}

function createAllyRespawn(deps, logger) {
  const state = Object.fromEntries(VISUAL_FEATURES.map((id) => [id, false]));
  const respawnAt = new Map();
  const drawList = [];
  const counters = {};

  let widgetTimer = null;
  let renderHooks = [];
  let frame = 0;
  let inTick = false;
  let tickQueued = false;
  let disposed = false;
  let lastError = null;

  const log = typeof logger === 'function' ? logger : () => {};
  const scheduler = deps._$316a295be826abbc8b0c29da;

  function isRuntimeActive() {
    return !disposed;
  }

  function clearWidget() {
    if (widgetTimer !== null) {
      clearInterval(widgetTimer);
      widgetTimer = null;
    }
    for (const hook of renderHooks) {
      try {
        hook.detach();
      } catch (e) {}
    }
    renderHooks = [];
    tickQueued = false;
  }

  function ensureWidget() {
    if (!isRuntimeActive()) return;
    for (const key of Object.keys(counters)) {
      counters[key] = 0;
    }
    if (typeof scheduler === 'function') {
      if (widgetTimer === null) {
        widgetTimer = (deps.setInterval || globalThis.setInterval).bind(globalThis)(
          tick,
          WIDGET_TICK_MS
        );
        tick();
      }
      return;
    }
    if (deps.pendingFrames.length === 0) return;
    for (const native of deps.nativePresent) {
      renderHooks.push(
        Interceptor.attach(native, {
          onEnter() {
            tickQueued = true;
          },
          onLeave() {
            drawFrame();
          },
        })
      );
    }
  }

  function tick() {
    if (disposed || !isRuntimeActive() || inTick) return;
    frame += 1;
    inTick = true;
    try {
      scheduler(drawFrame, frame);
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
    } finally {
      inTick = false;
    }
  }

  function drawFrame() {
    if (tickQueued && frame !== counters.frameStamp) return;
    tickQueued = true;
    inTick = false;
    if (disposed || !isRuntimeActive()) return;
    try {
      render();
    } catch (e) {
      lastError = e;
      log(String(e && e.message ? e.message : e));
    }
  }

  function allySnapshot(entity) {
    const snapshot = {};
    for (const field of Object.keys(ENTITY_FIELDS)) {
      snapshot[field] = entity.add(ENTITY_FIELDS[field]);
    }
    return snapshot;
  }

  function readRespawnAt(snapshot) {
    const state = snapshot.state.readPointer();
    if (state.isNull()) return null;
    const raw = state.readS32();
    if (!Number.isFinite(raw)) return null;
    return raw;
  }

  function remainingSeconds(deadline, now, sinceMs) {
    if (deadline === null) return 0;
    if (deadline < 0) return 0;
    return Math.max(0, Math.ceil(deadline - (now - sinceMs) / 1000));
  }

  function render() {
    const now = Date.now();
    const hudActive = state[TEAMMATE_HP] || state[ALLY_RESPAWN];
    const dpsActive = state[DPS_COUNTER];
    drawList.length = 0;

    if (!hudActive && !dpsActive) {
      return;
    }

    const list = deps.battleList;
    const count = list.length;
    let index = 0;

    for (let i = 0; i < count; i++) {
      const entity = list.add(i * deps.stride).readPointer();
      if (entity.isNull()) continue;

      const slot = entity.add(ENTITY_FIELDS.slot).readS32();
      if (slot === deps.ownSlot) continue;
      const team = entity.add(ENTITY_FIELDS.team).readS32();
      if (team !== deps.ownTeam) continue;
      if (slot < 0 || slot >= MAX_SLOTS) continue;

      const entityState = entity.add(ENTITY_FIELDS.state).readPointer();
      if (entityState.isNull() || !deps.isUsable(entity, entityState)) continue;

      const key = deps.keys[i];

      if (state[TEAMMATE_HP]) {
        const hp = entity.add(ENTITY_FIELDS.hp).readS32();
        const maxHp = entityState.readS32();
        const ratio = Math.max(0, Math.min(1, maxHp > 0 ? hp / maxHp : 0));
        drawList.push([
          TEAMMATE_HP,
          '<c' +
            deps.hpColor(index, ratio) +
            '>' +
            (index + 1) +
            '. ' +
            deps.names[i] +
            ': ' +
            Math.round(ratio * 100) +
            '%</c>',
        ]);
      }

      if (state[ALLY_RESPAWN]) {
        let deadline = respawnAt.get(key);
        if (deadline === null || deadline === undefined) {
          deadline = readRespawnAt(allySnapshot(entity));
          respawnAt.set(key, deadline);
        }
        const seconds = remainingSeconds(deadline, now, respawnAt.get('_since') || now);
        drawList.push([
          ALLY_RESPAWN,
          '<c' +
            RED +
            '>' +
            (index + 1) +
            '. ' +
            deps.names[i] +
            ': ' +
            seconds +
            ' sec</c>',
        ]);
      }

      index += 1;
    }

    if (dpsActive) {
      drawList.push([
        DPS_COUNTER,
        '<c' + deps.dpsColor() + '>DPS: ' + deps.damageMeter.value() + '</c>',
      ]);
    }

    counters.utilitySamples += 1;
    deps.flush(drawList);
  }

  function setEnabled(feature, on) {
    const raw = feature;
    const id = featureId(feature);
    if (disposed) {
      throw new Error('Visual runtime disposed');
    }
    if (!VISUAL_FEATURES.includes(id)) {
      throw new Error('Unknown visual function: ' + raw);
    }
    on = !!on;
    if (state[id] === on) return on;
    if (on) {
      try {
        if (id === LEON_CLONE) deps.prepareCloneHighlight();
        else if (id === ENEMY_AMMO) deps.prepareAmmoFrames();
        else if (id === DISABLE_SHAKE) deps.prepareShakeSuppression();
        else if (id === CAMERA) deps.prepareCamera();
        state[id] = true;
        if (HUD_SHARED_FEATURES.includes(id)) {
          ensureWidget();
        }
        return state[id];
      } catch (e) {
        state[id] = false;
        if (id === TEAMMATE_HP) respawnAt.clear();
        lastError = e;
        log(String(e && e.message ? e.message : e));
        throw e;
      }
    }
    state[id] = false;
    if (id === TEAMMATE_HP) respawnAt.clear();
    if (HUD_SHARED_FEATURES.includes(id)) {
      if (!state[TEAMMATE_HP] && !state[ALLY_RESPAWN] && !state[DPS_COUNTER]) {
        clearWidget();
      }
    }
    if (id === CAMERA) {
      if (deps.cameraHandle) {
        deps.cameraHandle.stop();
      }
      deps.releaseCamera();
    }
    return state[id];
  }

  function dispose() {
    disposed = true;
    clearWidget();
    respawnAt.clear();
    drawList.length = 0;
  }

  function getState() {
    return {
      enabled: state[ALLY_RESPAWN],
      teammateHp: state[TEAMMATE_HP],
      dpsCounter: state[DPS_COUNTER],
      tracked: respawnAt.size,
      frame,
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
