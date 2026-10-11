'use strict';

const FEATURE_ID = 22;

const POLL_MS = 120;

const EVENT_WINDOW_MAX = 128;

const DAMAGE_CAP = 100000;

const WALK_LIMIT = 2048;

const EVENT_ID_MODULUS = 1000000;

const DAMAGE_EVENT_TTL_MS = 1200;

const RECORD_FIELDS = [
  'id',
  'slot',
  'gid',
  'name',
  'hp',
  'maxHp',
  'alive',
  'ratio',
  'seen',
];

function createDamageRecord(entityId, gid, displayName, eventId) {
  return {
    id: entityId,
    slot: entityId,
    gid: gid,
    name: displayName,
    hp: 0,
    maxHp: 0,
    alive: false,
    ratio: 0,
    seen: 0,
    eventId: eventId,
    windowDamage: 0,
    totalDamage: 0,
  };
}

function createDpsCounter(deps) {
  const log = deps.log || function () {};
  const readEntity = deps.readEntity;
  const resolveName = deps.resolveName;
  const colorize = deps.colorize || function (ratio) { return ''; };
  const drawHud = deps.drawHud || function () {};

  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    battleKey: '',
    lastRun: 0,
    dpsValue: 0,
    records: new Map(),
    ranked: [],
    hpTracker: new Map(),
    respawnEntries: new Map(),
    respawnByTime: new Map(),
    damageEvents: [],
    scans: 0,
  };

  function isFeatureReady() {
    if (!state.enabled || state.disposed) {
      return false;
    }
    if (typeof deps.isVisualRuntimeEnabled === 'function') {
      return deps.isVisualRuntimeEnabled();
    }
    return true;
  }

  function resetState(battleKey) {
    state.battleKey = battleKey === undefined ? '' : battleKey;
    state.records.clear();
    state.ranked.length = 0;
    state.hpTracker.clear();
    state.respawnEntries.clear();
    state.respawnByTime.clear();
    state.damageEvents.length = 0;
    state.dpsValue = 0;
  }

  function throttleExpired(now) {
    if (state.lastRun !== 0 && now < state.lastRun) {
      return false;
    }
    state.lastRun = now + POLL_MS;
    return true;
  }

  function computeDamage(tracker, currentHp) {
    const lastHp = tracker[0];
    if (currentHp < 0 || currentHp >= lastHp) {
      return 0;
    }
    return Math.min(lastHp - currentHp, DAMAGE_CAP);
  }

  function pushDamageEvent(now, damage) {
    state.damageEvents.push([now, damage]);
    while (state.damageEvents.length > EVENT_WINDOW_MAX) {
      state.damageEvents.shift();
    }
  }

  function pruneDamageEvents(now) {
    const cutoff = now - DAMAGE_EVENT_TTL_MS;
    let total = 0;
    const kept = [];
    for (let i = 0; i < state.damageEvents.length; i++) {
      const event = state.damageEvents[i];
      if (event[0] >= cutoff) {
        kept.push(event);
        total += event[1];
      }
    }
    state.damageEvents = kept;
    return total;
  }

  function updateDpsValue(now, windowTotal) {
    const oldest = state.damageEvents.length > 0
      ? state.damageEvents[0][0]
      : now;
    const spanMs = Math.max(0, now - oldest);
    if (spanMs < POLL_MS) {
      state.dpsValue = 0;
      return state.dpsValue;
    }
    state.dpsValue = Math.ceil((windowTotal * 1000) / spanMs);
    return state.dpsValue;
  }

  function ensureRecord(entityId, gid, eventId) {
    let record = state.records.get(entityId);
    if (!record) {
      const displayName = typeof resolveName === 'function'
        ? resolveName(entityId, gid)
        : String(entityId);
      record = createDamageRecord(entityId, gid, displayName, eventId);
      state.records.set(entityId, record);
      state.ranked.push(record);
      state.ranked.sort(function (a, b) {
        if (a.ratio !== b.ratio) {
          return b.ratio - a.ratio;
        }
        return b.totalDamage - a.totalDamage;
      });
    }
    return record;
  }

  function applyEntitySample(record, sample) {
    record.gid = sample.gid;
    record.hp = sample.hp;
    record.maxHp = sample.maxHp;
    record.alive = sample.alive;
    record.ratio = sample.maxHp > 0 ? sample.hp / sample.maxHp : 0;
    record.seen = sample.eventCount;
    record.eventId = sample.eventId;
  }

  function trackDamageSource(gid, currentHp, eventCount) {
    const tracker = state.hpTracker.get(gid);
    if (!tracker) {
      state.hpTracker.set(gid, [currentHp, eventCount]);
      return;
    }
    tracker[0] = currentHp;
    tracker[1] = eventCount;
  }

  function forgetDamageSource(gid) {
    state.hpTracker.delete(gid);
  }

  function ensureRespawnEntry(record, now) {
    let entry = state.respawnEntries.get(record.gid);
    if (!entry) {
      entry = [null, null];
      state.respawnEntries.set(record.gid, entry);
    }
    if (entry[1] === null && typeof deps.resolveRespawnTime === 'function') {
      entry[1] = deps.resolveRespawnTime(now, record.slot, record.gid);
      state.respawnByTime.set(entry[1], entry);
    }
    return entry;
  }

  function respawnSecondsRemaining(entry, now) {
    if (entry[1] === null) {
      return 0;
    }
    const offset = entry[0] === null ? 0 : entry[0];
    return Math.max(0, Math.ceil((entry[1] - now - offset / 1000)));
  }

  function buildDpsLine() {
    return [
      FEATURE_ID,
      '<c' + colorize(state.dpsValue) + '>DPS: ' + state.dpsValue + '</c>',
    ];
  }

  function buildContributionLine(rank, record) {
    return [
      FEATURE_ID,
      '<c' + colorize(record.ratio) + '>' + rank + '. ' +
        record.name + ': ' + Math.round(record.ratio * 100) + '%</c>',
    ];
  }

  function buildRespawnLine(rank, record, seconds) {
    return [
      FEATURE_ID,
      '<cFF3333>' + rank + '. ' + record.name + ': ' + seconds + ' sec</c>',
    ];
  }

  function tick(pointer, timestamp) {
    const now = timestamp === undefined || timestamp === null
      ? Date.now()
      : timestamp;

    if (!isFeatureReady()) {
      return undefined;
    }
    if (!throttleExpired(now)) {
      return undefined;
    }

    try {
      if (typeof readEntity !== 'function') {
        return undefined;
      }

      const battleKey = typeof deps.readBattleKey === 'function'
        ? deps.readBattleKey(pointer)
        : '';
      if (battleKey !== state.battleKey) {
        resetState(battleKey);
      }

      let walked = 0;
      let sample;
      while (walked < WALK_LIMIT &&
             (sample = readEntity(pointer, walked)) !== null) {
        walked++;
        if (sample === undefined) {
          break;
        }
        const eventId = ((sample.eventId | 0) % EVENT_ID_MODULUS);
        const record = ensureRecord(sample.entityId, sample.gid, eventId);
        applyEntitySample(record, sample);

        if (sample.gid !== 0 && sample.sourceGid !== 0) {
          const tracker = state.hpTracker.get(sample.sourceGid);
          if (tracker !== undefined &&
              sample.hp >= 0 && sample.hp < tracker[0]) {
            const damage = computeDamage(tracker, sample.hp);
            pushDamageEvent(now, damage);
          }
          if (sample.alive) {
            trackDamageSource(sample.sourceGid, sample.hp, sample.eventCount);
          } else {
            forgetDamageSource(sample.sourceGid);
          }
        } else if (!sample.alive) {
          forgetDamageSource(sample.gid);
        }
      }

      const windowTotal = pruneDamageEvents(now);
      updateDpsValue(now, windowTotal);

      const lines = [];
      if (state.dpsValue > 0 || state.damageEvents.length > 0) {
        lines.push(buildDpsLine());
      }

      for (let i = 0; i < state.ranked.length; i++) {
        const record = state.ranked[i];
        if (record.alive) {
          lines.push(buildContributionLine(i + 1, record));
        } else if (typeof deps.showRespawnCountdown === 'function' &&
                   deps.showRespawnCountdown()) {
          const entry = ensureRespawnEntry(record, now);
          const seconds = respawnSecondsRemaining(entry, now);
          if (entry[1] !== null && entry[1] >= 0) {
            lines.push(buildRespawnLine(i + 1, record, seconds));
          }
        }
      }

      state.scans++;
      drawHud(lines);
    } catch (error) {
      state.lastError = String(error);
      log(error);
    }
    return undefined;
  }

  function setEnabled(value) {
    state.enabled = value === true;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      battleKey: state.battleKey,
      dpsValue: state.dpsValue,
      records: state.records.size,
      ranked: state.ranked.length,
      damageEvents: state.damageEvents.length,
      scans: state.scans,
      lastError: state.lastError,
    };
  }

  function dispose() {
    resetState('');
    state.enabled = false;
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    RECORD_FIELDS,
    setEnabled,
    applySaved,
    tick,
    resetState,
    computeDamage,
    pushDamageEvent,
    pruneDamageEvents,
    updateDpsValue,
    ensureRecord,
    applyEntitySample,
    trackDamageSource,
    forgetDamageSource,
    ensureRespawnEntry,
    respawnSecondsRemaining,
    buildDpsLine,
    buildContributionLine,
    buildRespawnLine,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  POLL_MS,
  EVENT_WINDOW_MAX,
  DAMAGE_CAP,
  WALK_LIMIT,
  EVENT_ID_MODULUS,
  DAMAGE_EVENT_TTL_MS,
  RECORD_FIELDS,
  createDamageRecord,
  createDpsCounter,
};
