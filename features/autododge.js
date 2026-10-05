'use strict';

const OPTION_KEYS = [
  'reactionSpeed',
  'directionPrecision',
  'safetyMargin',
  'horizonMs',
  'reactionMs',
  'commandIntervalMs',
  'moveDistance',
  'holdDirectionMs',
  'compactDodge',
  'parkMargin',
  'releaseHysteresis',
  'antiSnipe',
  'antiSnipeMs',
  'antiSnipeReach',
  'trimHazardEnd',
  'maxThreatRadius',
  'dodgeWhenCarrying',
  'dodgeWhenStanding',
  'ignoredBrawlerIds',
  'aggressiveness',
  'ignoredThreatPairs',
];

const OPTION_RANGES = {
  aggressiveness: [0, 100],
  antiSnipeReach: [0.3, 1.2],
  antiSnipeMs: [80, 400],
  parkMargin: [0, 200],
  releaseHysteresis: [0, 60],
  reactionSpeed: [0, 100],
  directionPrecision: [8, 128],
  safetyMargin: [0, 120],
  horizonMs: [200, 1200],
  reactionMs: [0, 150],
  commandIntervalMs: [16, 150],
  moveDistance: [60, 360],
  holdDirectionMs: [0, 250],
  maxThreatRadius: [100, 1200],
};

const OPTION_DEFAULTS = [
  100,
  48,
  45,
  700,
  0,
  16,
  360,
  0,
  true,
  40,
  8,
  false,
  130,
  0.85,
  true,
  360,
  true,
  true,
  [],
  75,
  [],
];

const IDX_REACTION_SPEED = 0;
const IDX_DIRECTION_PRECISION = 1;
const IDX_SAFETY_MARGIN = 2;
const IDX_HORIZON_MS = 3;
const IDX_REACTION_MS = 4;
const IDX_COMMAND_INTERVAL_MS = 5;
const IDX_MOVE_DISTANCE = 6;
const IDX_HOLD_DIRECTION_MS = 7;
const IDX_COMPACT_DODGE = 8;
const IDX_PARK_MARGIN = 9;
const IDX_RELEASE_HYSTERESIS = 10;
const IDX_ANTI_SNIPE = 11;
const IDX_ANTI_SNIPE_MS = 12;
const IDX_ANTI_SNIPE_REACH = 13;
const IDX_TRIM_HAZARD_END = 14;
const IDX_MAX_THREAT_RADIUS = 15;
const IDX_DODGE_WHEN_CARRYING = 16;
const IDX_DODGE_WHEN_STANDING = 17;
const IDX_IGNORED_BRAWLER_IDS = 18;
const IDX_AGGRESSIVENESS = 19;
const IDX_IGNORED_THREAT_PAIRS = 20;

const IDX_ACTIVE = 0;
const IDX_SIDE = 1;
const IDX_NEXT_FLIP = 2;
const IDX_ANCHOR_X = 3;
const IDX_ANCHOR_Y = 4;

const ANTI_SNIPE_DEFAULT_BRAWLERS = ['PIPER', 'COLT', 'BEA', 'BEE', 'BELLE', 'ELECTROSNIPER'];

const SNIPER_KINDS = [
  null,
  'belle_fast_native_round',
  'piper_fast_native_round',
  'bo_fast_native_round',
  'pierce_fast_native_round',
];

const SNIPER_KIND_BELLE = 1;
const SNIPER_KIND_PIPER = 2;
const SNIPER_KIND_BO = 3;
const SNIPER_KIND_PIERCE = 4;

const BELLE_PROJECTILES = ['ELECTROSNIPER', 'ELECTROSNIPERPROJECTILE', 'BELLEPROJECTILE'];
const PIPER_PROJECTILES = ['SNIPERPROJECTILE', 'PIPERPROJECTILE'];
const BO_PROJECTILES = ['BOWDUDE', 'BOWPROJECTILE', 'BOARROW', 'ARROWPROJECTILE'];
const PIERCE_PROJECTILES = ['PIERCE', 'PIERCEPROJECTILE'];

const HEADING_TRACKED_MATCH = /arrow|dart|bolt|shot/i;

const HISTORY_WINDOW_MS = 150;
const HISTORY_MAX_SAMPLES = 64;
const OWN_DATA_MAX_AGE_MS = 150;
const LATENCY_CLAMP_S = 0.15;
const TELEPORT_MAX_SPEED_FACTOR = 4;
const FALLBACK_MAX_SPEED = 720;
const MIN_REACTION_MS = 20;
const DRIFT_LIMIT = 150;
const ANTI_SNIPE_JITTER_LO = 0.75;
const ANTI_SNIPE_JITTER_HI = 0.5;
const DIRECTION_CHANGE_DOT = 0.98;
const PLAN_MOVE_EPS = 0.001;
const OWN_BASE_RADIUS = 60;
const OWN_MARKER_TTL = 2.5;
const AIM_TIME_CAP_S = 1.3;
const TAG_ENTITY_EVENT = 16167;
const TAG_WEAPON_EVENT = 39783;

function canonicalBrawlerName(value) {
  if (typeof value === 'number') {
    value = value & 0xFFFF;
  }
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function headingToVector(heading) {
  if (!Number.isFinite(heading)) {
    return { x: 0, y: 0 };
  }
  const deg = ((heading % 360) + 360) % 360;
  const rad = deg * Math.PI / 180;
  return { x: Math.cos(rad), y: Math.sin(rad) };
}

function normalizeDodgeOptions(options, applyOption) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('Dodge options must be an object');
  }
  for (const [key, value] of Object.entries(options)) {
    if (key === 'ignoredBrawlers') {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' && typeof entry !== 'number')) {
        throw new TypeError('ignoredBrawlers must be an array of names');
      }
    } else if (key === 'antiSnipeBrawlers') {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string' && typeof entry !== 'number')) {
        throw new TypeError('antiSnipeBrawlers must be an array of names');
      }
    } else if (key === 'ignoredThreatPairs') {
      if (!Array.isArray(value) || value.length > 512 || value.some((pair) => (
        !Array.isArray(pair) ||
        pair.length !== 2 ||
        !Number.isInteger(pair[0]) ||
        pair[0] < 0 ||
        pair[0] >= 512 ||
        !Number.isInteger(pair[1]) ||
        pair[1] < 0 ||
        pair[1] > 7
      ))) {
        throw new TypeError('ignoredThreatPairs must be [id 0..511, class 0..7] pairs');
      }
    } else if (key === 'ignoredBrawlerIds') {
      if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'number' && typeof entry !== 'string')) {
        throw new TypeError('ignoredBrawlerIds must contain base character refs');
      }
    } else if (key === 'dodgeWhenCarrying' || key === 'dodgeWhenStanding' || key === 'compactDodge' || key === 'antiSnipe' || key === 'trimHazardEnd') {
      if (typeof value !== 'boolean') {
        throw new TypeError(key + ' must be boolean');
      }
    } else if (!OPTION_RANGES[key] || !Number.isFinite(value)) {
      throw new TypeError('Invalid dodge option: ' + key);
    }
  }
  for (const [key, value] of Object.entries(options)) {
    if (key === 'ignoredBrawlers') {
      applyOption.ignoredBrawlers = new Set(value.map(canonicalBrawlerName).filter(Boolean));
    } else if (key === 'antiSnipeBrawlers') {
      applyOption.antiSnipeBrawlers = new Set(value.map(canonicalBrawlerName).filter(Boolean));
    } else if (key === 'ignoredThreatPairs') {
      applyOption.ignoredThreatPairs = value.map((pair) => pair.slice());
    } else if (key === 'ignoredBrawlerIds') {
      applyOption.ignoredBrawlerIds = Array.from(new Set(value));
    } else if (key === 'dodgeWhenCarrying' || key === 'dodgeWhenStanding' || key === 'compactDodge' || key === 'antiSnipe' || key === 'trimHazardEnd') {
      applyOption.state[OPTION_KEYS.indexOf(key)] = value;
    } else {
      const range = OPTION_RANGES[key];
      applyOption.state[OPTION_KEYS.indexOf(key)] = Math.round(Math.max(range[0], Math.min(range[1], value)));
    }
  }
}

function readOwnEntity(nativeHandle, offsets, ownProvider) {
  const cached = ownProvider.cached;
  if (cached) {
    return cached;
  }
  try {
    const ptr = nativeHandle[0]();
    if (!ptr || ptr.isNull()) {
      return null;
    }
    const view = nativeHandle[1];
    const record = {
      x: view.add(offsets.ownX).readFloat(),
      y: view.add(offsets.ownY).readFloat(),
      radius: view.add(offsets.ownRadius).readFloat(),
      speed: view.add(offsets.ownSpeed).readFloat(),
      maxSpeed: Math.abs(view.add(offsets.ownMaxSpeed).readFloat()),
      heading: view.add(offsets.ownHeading).readFloat(),
      gameTs: view.add(offsets.ownTimestamp).readFloat(),
      isCarrying: view.add(offsets.ownCarrying).readU8() !== 0,
    };
    if (!Number.isFinite(record.x) || !Number.isFinite(record.y)) {
      return null;
    }
    ownProvider.cached = record;
    return record;
  } catch (e) {
    return null;
  }
}

function readNativeFlagBool(nativeHandle, override, offsets, key) {
  try {
    if (!nativeHandle) {
      return false;
    }
    const ptr = nativeHandle[0]();
    if (!ptr || ptr.isNull()) {
      return false;
    }
    if (override && ptr.equals(override[0])) {
      return override[1] !== 0;
    }
    return ptr.add(offsets[key]).readU8() !== 0;
  } catch (e) {
    return false;
  }
}

function clampToPlayfield(x, y, ownProvider, helpers, clamp) {
  const r = Math.max(1, ownProvider.radius || OWN_BASE_RADIUS);
  const w = helpers.getPlayfieldWidth() * helpers.unitScale;
  const h = helpers.getPlayfieldHeight() * helpers.unitScale;
  return {
    x: Math.round(w > 2 * r ? clamp(x, r, w - r - 1) : x),
    y: Math.round(h > 2 * r ? clamp(y, r, h - r - 1) : y),
  };
}

function writePositionToNative(ptr, x, y, commit, context) {
  if (commit === undefined) {
    commit = true;
  }
  if (!ptr || ptr.isNull() || !Number.isFinite(x) || !Number.isFinite(y)) {
    return false;
  }
  const px = Math.round(x);
  const py = Math.round(y);
  let ok = false;
  try {
    ptr.add(context.offsets.positionX).writeS32(px);
    ptr.add(context.offsets.positionY).writeS32(py);
    ok = true;
  } catch (e) {
    ok = false;
  }
  if (ok && commit) {
    try {
      context.bridge.commitPosition(ptr, px, py, 1);
    } catch (e) {
    }
  } else if (!ok) {
    context.stats.nativeWriteFailures++;
  }
  return ok;
}

function recordPositionSample(now, own, history) {
  const last = history[history.length - 1];
  if (last && last[0] === now && last[1] === own.x && last[2] === own.y) {
    return;
  }
  history.push([now, own.x, own.y]);
  while (history.length > HISTORY_MAX_SAMPLES || (history.length > 1 && now - history[0][0] > HISTORY_WINDOW_MS)) {
    history.shift();
  }
}

function scanReactionHazards(now, reactionSec, speed, history, lastSampleTime, motion) {
  const fallback = motion || { x: 0, y: 0 };
  if (now - lastSampleTime > HISTORY_WINDOW_MS) {
    history.length = 0;
    return [fallback];
  }
  const out = [];
  for (let i = 0; i < history.length; i++) {
    const a = history[i];
    for (let j = i + 1; j < history.length; j++) {
      const b = history[j];
      const dt = (b[0] - a[0]) / 1000;
      if (dt <= 0) {
        continue;
      }
      const vx = (b[1] - a[1]) / dt;
      const vy = (b[2] - a[2]) / dt;
      if (Math.hypot(vx, vy) > Math.max(3000, speed * TELEPORT_MAX_SPEED_FACTOR)) {
        continue;
      }
      out.push({ x: vx, y: vy, from: 0, ttl: reactionSec });
    }
  }
  if (!out.length) {
    out.push(fallback);
  }
  return out;
}

function getMemoizedTraits(entity, evaluatorRegistry, cache) {
  const lastObj = cache.lastObj;
  if (lastObj === entity && cache.lastTuple) {
    return cache.lastTuple;
  }
  const keyParts = [
    entity.id,
    entity.classId,
    entity.name,
    entity.kind,
    entity.ownerId,
    entity.tag,
    entity.variant,
  ];
  const key = keyParts.join('\x01');
  let tuple = cache.map.get(key);
  if (!tuple) {
    tuple = [
      evaluatorRegistry[0](entity),
      evaluatorRegistry[1](entity),
      evaluatorRegistry[2](entity),
      evaluatorRegistry[3](entity),
    ];
    cache.map.set(key, tuple);
    if (cache.map.size > 512) {
      const firstKey = cache.map.keys().next().value;
      cache.map.delete(firstKey);
    }
  }
  cache.lastObj = entity;
  cache.lastTuple = tuple;
  return tuple;
}

function classifyHeadingTracked(entity) {
  const names = [
    entity.name,
    entity.projectileName,
    entity.kindName,
    entity.skinName,
    entity.weaponName,
  ].map(String);
  if (names.some((name) => HEADING_TRACKED_MATCH.test(name))) {
    return true;
  }
  return Number.isFinite(entity.traitA) && entity.traitA !== 0;
}

function classifyTimedBurst(entity) {
  return entity.fuseMs !== undefined && Number.isFinite(entity.fuseMs);
}

function classifyCurving(entity) {
  return entity.classId === 9 || Number.isFinite(entity.angVel);
}

function classifySniper(entity) {
  const names = [
    entity.name,
    entity.projectileName,
    entity.kindName,
    entity.skinName,
    entity.weaponName,
  ].map(canonicalBrawlerName);
  if (names.some((name) => BELLE_PROJECTILES.includes(name))) {
    return SNIPER_KIND_BELLE;
  }
  if (names.some((name) => PIPER_PROJECTILES.includes(name))) {
    return SNIPER_KIND_PIPER;
  }
  if (names.some((name) => BO_PROJECTILES.includes(name))) {
    return SNIPER_KIND_BO;
  }
  if (names.some((name) => PIERCE_PROJECTILES.includes(name))) {
    return SNIPER_KIND_PIERCE;
  }
  return null;
}

function matchThreatToEnemy(threat, entityById, findEnemyIter) {
  const enemy = entityById(threat.ownerId);
  if (!enemy) {
    return null;
  }
  const range = threat.range !== undefined ? threat.range : 4000;
  const along = threat.along;
  const perp = threat.perp;
  if (along < -60 || along > range + 200 || Math.abs(perp) > 350) {
    return null;
  }
  return { x: enemy.x, y: enemy.y };
}

function trimExpiredHazardEnd(hazard, now, trimEnabled, safetyMargin, biasSpeed) {
  if (!trimEnabled) {
    return hazard.ttl;
  }
  if (typeof hazard.name === 'string' && hazard.name.endsWith('_fast_native_round')) {
    return hazard.ttl;
  }
  const margin = hazard.effectiveMargin !== undefined ? hazard.effectiveMargin : safetyMargin;
  const speed = hazard.speed !== undefined ? hazard.speed : biasSpeed;
  const reduction = Math.max(0, margin - 0) / Math.max(1, speed);
  return Math.max(hazard.from, hazard.ttl - reduction);
}

function tryBuildHazardRecord(hazard, extraRadius, ttl, speed) {
  if (!hazard || hazard.ignored || hazard.static) {
    return null;
  }
  const dist = Math.hypot(hazard.x, hazard.y);
  if (dist > ttl * speed + hazard.radius + extraRadius) {
    return null;
  }
  return {
    x: hazard.x,
    y: hazard.y,
    vx: hazard.vx || 0,
    vy: hazard.vy || 0,
    radius: hazard.radius + extraRadius,
    from: 0,
    ttl,
    source: hazard.source,
  };
}

function expandHeadingTrackedHazard(t, safeRadius, horizonSec, estimate, state) {
  const out = [];
  const now = state.lastScan;
  const speed = Math.hypot(t.vx, t.vy);
  if (speed < 1) {
    return out;
  }
  const heading = headingToVector(t.headingDeg);
  const vx = heading.x * speed;
  const vy = heading.y * speed;
  const seen = new Map();
  const ttl = Math.min(horizonSec, Math.max(0.15, t.dist / speed));
  const record = {
    x: t.x,
    y: t.y,
    vx,
    vy,
    radius: t.radius + Math.min(45, speed * 0.008),
    from: 0,
    ttl,
    source: state.tags.heading,
  };
  out.push(record);
  for (const actor of state.iterableB) {
    const key = String(actor.id);
    const prev = seen.get(key);
    const hop = Math.hypot(actor.x - t.x, actor.y - t.y);
    if (prev !== undefined && hop > 1 && hop < speed * 0.3) {
      out.push({
        x: t.x,
        y: t.y,
        vx,
        vy,
        radius: t.radius,
        from: 0,
        ttl: 0.12,
        source: state.tags.segment,
        ownerBox: true,
      });
    }
    seen.set(key, hop);
    const dot = (actor.x - t.x) * vx + (actor.y - t.y) * vy;
    if (dot < 0.999 * hop * speed) {
      out.push({
        x: t.x,
        y: t.y,
        vx,
        vy,
        radius: t.radius,
        from: 0,
        ttl: 0.12,
        source: state.tags.retagged,
      });
    }
  }
  return out;
}

function expandTimedBurstHazard(t, safeRadius, horizonSec, estimate, state) {
  const out = [];
  const now = state.now;
  const planted = state.planted;
  const key = t.x + ':' + t.y + ':' + t.radius;
  let entry = planted.get(key);
  if (!entry) {
    entry = {
      x: t.x,
      y: t.y,
      radius: t.radius,
      expiry: now + (t.fuseMs !== undefined ? t.fuseMs / 1000 : 0.5),
    };
    planted.set(key, entry);
    if (planted.size > 64) {
      const firstKey = planted.keys().next().value;
      planted.delete(firstKey);
    }
  }
  if (entry.expiry < now) {
    planted.delete(key);
    return out;
  }
  const fuse = Math.max(0, entry.expiry - now);
  out.push({
    x: entry.x,
    y: entry.y,
    vx: 0,
    vy: 0,
    radius: entry.radius,
    from: 0,
    ttl: fuse,
    source: state.tags.planted,
  });
  out.push({
    x: entry.x,
    y: entry.y,
    vx: 0,
    vy: 0,
    radius: entry.radius + safeRadius,
    from: 0,
    ttl: fuse,
    source: state.tags.planted,
  });
  out.push({
    x: entry.x,
    y: entry.y,
    vx: 0,
    vy: 0,
    radius: entry.radius * 2,
    from: Math.max(0, fuse - 0.15),
    ttl: fuse,
    source: state.tags.burst,
  });
  return out;
}

function expandCurvingHazard(t, safeRadius, horizonSec, tx, ty, estimate, state) {
  const out = [];
  const lastSeen = state.lastSeen;
  const key = String(t.id);
  let entry = lastSeen.get(key);
  const now = state.now;
  if (!entry) {
    entry = { angle: t.angle, time: now, angVel: 0 };
    lastSeen.set(key, entry);
  } else {
    const dt = Math.min(250, Math.max(16, now - entry.time)) / 1000;
    if (dt > 0) {
      const dAngle = t.angle - entry.angle;
      let delta = Math.atan2(Math.sin(dAngle), Math.cos(dAngle));
      const angVel = delta / dt;
      entry.angVel = Math.max(-12, Math.min(12, angVel));
    }
    entry.angle = t.angle;
    entry.time = now;
  }
  const speed = Math.hypot(t.vx, t.vy);
  if (speed < 1) {
    return out;
  }
  let angle = entry.angle;
  let x = t.x;
  let y = t.y;
  const step = 0.025;
  for (let time = 0; time < horizonSec; time += step) {
    angle += (entry.angVel || 0) * step;
    const nx = x + Math.cos(angle) * speed * step;
    const ny = y + Math.sin(angle) * speed * step;
    const towardTarget = (tx - nx) * Math.cos(angle) + (ty - ny) * Math.sin(angle);
    out.push({
      x: nx,
      y: ny,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: t.radius + safeRadius * 0.5,
      from: time,
      ttl: time + 0.025,
      source: state.tags.curving,
    });
    if (towardTarget < 0) {
      break;
    }
    x = nx;
    y = ny;
  }
  return out;
}

function expandControllerProjectileHazard(t, safeRadius, horizonSec, gameTime, estimate, state) {
  const out = [];
  const speed = t.speed !== undefined ? t.speed : Math.hypot(t.vx, t.vy);
  if (speed < 1) {
    return out;
  }
  const heading = headingToVector(t.headingDeg);
  const vx = heading.x * speed;
  const vy = heading.y * speed;
  const ttl = Math.min(horizonSec, Math.max(0.15, t.dist / speed));
  out.push({
    x: t.x,
    y: t.y,
    vx,
    vy,
    radius: t.radius + Math.min(45, speed * 0.008),
    from: 0,
    ttl,
    source: state.tags.main,
    gid: String(t.id),
  });
  if (t.phase >= 380 && t.phase < 760) {
    for (const extraDeg of [-50, 50]) {
      const rad = extraDeg * Math.PI / 180;
      const sx = Math.cos(rad) * vx - Math.sin(rad) * vy;
      const sy = Math.sin(rad) * vx + Math.cos(rad) * vy;
      out.push({
        x: t.x,
        y: t.y,
        vx: sx,
        vy: sy,
        radius: t.radius,
        from: 0,
        ttl: Math.min(horizonSec, 0.12),
        source: state.tags.swept,
        gid: String(t.id),
        ownerBox: true,
      });
    }
  }
  return out;
}

function expandSniperHazard(t, safeRadius, horizonSec, helpers, estimate, planHorizon, state) {
  const out = [];
  const kind = classifySniper(t);
  if (kind === null) {
    return out;
  }
  const speed = t.speed !== undefined ? t.speed : Math.hypot(t.vx, t.vy);
  if (speed < 1) {
    return out;
  }
  const range = t.range !== undefined ? t.range : 4000;
  const along = t.along;
  const perp = Math.abs(t.perp);
  if (along < -60 || along > range + 200 || perp > 350) {
    return out;
  }
  const corridor = Math.min(70, speed * 0.012) + safeRadius;
  const ttl = Math.min(planHorizon, Math.max(0.15, along / speed));
  const dir = { x: t.vx / speed, y: t.vy / speed };
  const away = (t.targetX - t.x) * dir.x + (t.targetY - t.y) * dir.y;
  if (away < 0 && perp > corridor) {
    return out;
  }
  out.push({
    x: t.x,
    y: t.y,
    vx: dir.x * speed,
    vy: dir.y * speed,
    radius: corridor,
    from: 0,
    ttl,
    source: SNIPER_KINDS[kind],
  });
  if (kind === SNIPER_KIND_BO) {
    const contactT = Math.max(0, along / speed - 0.05);
    const cx = t.x + dir.x * speed * contactT;
    const cy = t.y + dir.y * speed * contactT;
    out.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: corridor * 1.5,
      from: contactT,
      ttl: contactT + 0.15,
      source: SNIPER_KINDS[kind],
    });
    out.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: corridor,
      from: contactT,
      ttl: contactT + 0.15,
      source: state.tags.moduleCtx,
    });
  }
  return out;
}

function expandSpreadHazard(t, safeRadius, horizonSec, planHorizon, state) {
  const out = [];
  const speed = Math.hypot(t.vx, t.vy);
  if (speed < 1) {
    return out;
  }
  const dir = { x: t.vx / speed, y: t.vy / speed };
  let contactT = planHorizon;
  let contactDist = Infinity;
  for (const actor of state.allActors) {
    const relX = actor.x - t.x;
    const relY = actor.y - t.y;
    const along = relX * dir.x + relY * dir.y;
    if (along <= 0) {
      continue;
    }
    const perp = Math.abs(relX * dir.y - relY * dir.x);
    if (perp > t.radius + safeRadius) {
      continue;
    }
    if (along / speed < contactT) {
      contactT = along / speed;
      contactDist = along;
    }
  }
  out.push({
    x: t.x,
    y: t.y,
    vx: t.vx,
    vy: t.vy,
    radius: t.radius + Math.min(45, speed * 0.008),
    from: 0,
    ttl: contactT,
    source: t.source,
  });
  if (contactDist !== Infinity) {
    out.push({
      x: t.x + dir.x * contactDist,
      y: t.y + dir.y * contactDist,
      vx: 0,
      vy: 0,
      radius: t.radius * 1.5 + safeRadius,
      from: contactT,
      ttl: contactT + 0.15,
      source: state.tags.spreadBurst,
    });
  }
  return out;
}

function planDodge(now, speed, module) {
  const state = module.state;
  const own = module.ownProvider;
  const helpers = module.helpers;
  const providers = module.providers;
  const ctx = module.ctx;

  const hazards = [];
  const horizonSec = state[IDX_HORIZON_MS] / 1000;
  const planHorizon = Math.max(horizonSec, module.constants.minHorizonSec);
  const safeRadius = (own.radius || OWN_BASE_RADIUS) + state[IDX_SAFETY_MARGIN];
  const gameTime = own.gameTs !== undefined && own.gameTs !== null ? own.gameTs : now;
  const dt = Math.max(0, Math.min(LATENCY_CLAMP_S, (now - gameTime) / 1000));

  const isIgnored = (record) => {
    if (module.ignoredBrawlerIds.has(record.ownerId)) {
      return true;
    }
    if (module.ignoredBrawlers.has(canonicalBrawlerName(record.name))) {
      return true;
    }
    for (const pair of state[IDX_IGNORED_THREAT_PAIRS]) {
      if (pair[0] === record.classId && pair[1] === record.threatClass) {
        return true;
      }
      if (pair[0] === record.ownerId && pair[1] === 0) {
        return true;
      }
    }
    return false;
  };
  const estimate = (record, ref) => ctx.estimateDistance(record, ref);
  const isVisibleEnemy = (entity) => {
    if (!entity || entity.dead) {
      return false;
    }
    if (providers.skip(entity)) {
      return false;
    }
    if (String(entity.ownerId) === String(own.ownerId)) {
      return false;
    }
    if (entity.invisible) {
      return false;
    }
    return true;
  };
  const inRange = (record) => {
    if (record.flagged) {
      return true;
    }
    const dx = record.x - own.x;
    const dy = record.y - own.y;
    return dx * dx + dy * dy <= record.reach * record.reach;
  };
  const shouldTrackProjectile = (record) => {
    if (!providers.roster(record)) {
      return false;
    }
    return !isIgnored(record);
  };
  const pushProjectileHazard = (record) => {
    if (providers.log) {
      providers.log('id:' + record.ownerId + ':x:' + record.x + ':y:' + record.y);
    }
    module.tracker.push(record);
  };

  const ownRec = {
    x: own.x,
    y: own.y,
    speed,
    radius: safeRadius,
    margin: state[IDX_SAFETY_MARGIN],
    horizon: horizonSec,
  };

  if (providers.projectileScanner) {
    for (const projectile of providers.projectileScanner(ownRec, now, shouldTrackProjectile)) {
      pushProjectileHazard(projectile);
    }
  }

  const weaponCtx = helpers.getOwnWeaponContext && helpers.getOwnWeaponContext();
  if (weaponCtx) {
    const zone = providers.zoneProvider(own, weaponCtx, [], ownRec, now, 0, isIgnored);
    if (zone && zone.hazardZones) {
      hazards.push({
        x: own.x,
        y: own.y,
        vx: 0,
        vy: 0,
        radius: 0,
        from: 0,
        ttl: OWN_MARKER_TTL,
        zone,
      });
    }
  }

  const enemies = [];
  for (const entity of own.enemies || []) {
    if (isVisibleEnemy(entity)) {
      enemies.push(entity);
    }
  }

  let enemyAiming = false;
  if (enemies.length) {
    const aimHazards = providers.enemyAimPredictor(enemies, now, gameTime, safeRadius, estimate, own.enemiesB);
    for (const aim of aimHazards || []) {
      if (aim && aim.threat) {
        enemyAiming = true;
      }
      if (aim) {
        hazards.push(aim);
      }
    }
  }

  for (const entity of own.enemiesB || []) {
    if (providers.skip(entity, true)) {
      continue;
    }
    if (isIgnored(entity)) {
      continue;
    }
    if (String(entity.ownerId) === String(own.ownerId)) {
      continue;
    }
    const threatRadius = safeRadius + entity.bodyRadius - module.constants.enemyRadiusBias;
    const dx = entity.x - own.x;
    const dy = entity.y - own.y;
    if (dx * dx + dy * dy <= speed * planHorizon * (speed * planHorizon) + threatRadius * threatRadius) {
      hazards.push({
        x: entity.x,
        y: entity.y,
        vx: 0,
        vy: 0,
        radius: threatRadius,
        from: 0,
        ttl: planHorizon,
        source: module.constants.enemySource,
      });
    }
  }

  const tracked = module.tracker.update(enemies, own.trackedRef, gameTime, now, (record) => {
    const speed2 = Math.hypot(record.vx, record.vy);
    if (speed2 < 1) {
      return {
        x: record.x,
        y: record.y,
        vx: 0,
        vy: 0,
        radius: record.radius + safeRadius,
        from: 0,
        ttl: planHorizon,
        source: record.source,
      };
    }
    const lead = Math.min(planHorizon, Math.max(0.15, record.dist / speed2));
    return {
      x: record.x,
      y: record.y,
      vx: record.vx,
      vy: record.vy,
      radius: record.radius + Math.min(45, speed2 * 0.008),
      from: 0,
      ttl: lead,
      source: record.source,
    };
  });
  for (const record of tracked) {
    if (!Number.isFinite(record.x) || !Number.isFinite(record.y) || !record.visible) {
      continue;
    }
    if (isIgnored(record)) {
      continue;
    }
    if (!inRange(record)) {
      continue;
    }
    const traits = getMemoizedTraits(record, module.evaluators, module.traitCache);
    if (traits[3] !== null && traits[3] !== module.constants.boClass) {
      for (const rec of expandSniperHazard(record, safeRadius, horizonSec, helpers, estimate, planHorizon, module.subsystemState)) {
        hazards.push(rec);
      }
      continue;
    }
    if (traits[0]) {
      for (const rec of expandHeadingTrackedHazard(record, safeRadius, horizonSec, estimate, module.subsystemState)) {
        hazards.push(rec);
      }
    }
    if (traits[1]) {
      for (const rec of expandTimedBurstHazard(record, safeRadius, horizonSec, estimate, module.subsystemState)) {
        hazards.push(rec);
      }
    }
    if (traits[2]) {
      const target = matchThreatToEnemy(record, module.entityById);
      if (target) {
        for (const rec of expandCurvingHazard(record, safeRadius, horizonSec, target.x, target.y, estimate, module.subsystemState)) {
          hazards.push(rec);
        }
      }
    }
    if (module.expanderSpread(record, safeRadius, horizonSec, planHorizon, module.subsystemState)) {
      for (const rec of module.expanderSpread(record, safeRadius, horizonSec, planHorizon, module.subsystemState)) {
        hazards.push(rec);
      }
    }
    if (record.ownerBox) {
      hazards.push(record.ownerBox);
    }
    const dtShifted = {
      x: record.x + record.vx * dt,
      y: record.y + record.vy * dt,
      vx: record.vx,
      vy: record.vy,
      radius: record.radius,
      from: 0,
      ttl: record.ttl !== undefined ? record.ttl : planHorizon,
      source: record.source,
    };
    if (Number.isFinite(dtShifted.x) && Number.isFinite(dtShifted.y)) {
      hazards.push(dtShifted);
    }
  }

  for (const hazard of hazards) {
    if (hazard.ttl === undefined || !Number.isFinite(hazard.ttl)) {
      continue;
    }
    if (hazard.zone) {
      hazard.ttl = Math.min(hazard.ttl, OWN_MARKER_TTL);
    } else if (hazard.source === module.constants.enemySource) {
      hazard.ttl = Math.min(hazard.ttl, planHorizon);
    } else if (hazard.aim) {
      hazard.ttl = Math.min(hazard.ttl, AIM_TIME_CAP_S);
    }
    if (state[IDX_TRIM_HAZARD_END]) {
      hazard.ttl = trimExpiredHazardEnd(hazard, now, false, state[IDX_SAFETY_MARGIN], 1);
    }
  }

  hazards.planHorizon = planHorizon;
  hazards.enemyAiming = enemyAiming;
  hazards.ownContext = [helpers, Math.max(1, own.radius || OWN_BASE_RADIUS), state[IDX_SAFETY_MARGIN]];
  return hazards;
}

function planDodgeStep(module) {
  const state = module.state;
  const own = module.ownProvider;
  const out = module.antiSnipeOut;
  const now = Date.now();

  if (!module.enabled) {
    return;
  }
  if (module.isSuspended(now)) {
    module.history.length = 0;
    module.stats.hazardCount = 0;
    module.stats.lastScore = null;
    return abortActiveDodge(module);
  }
  if (!state[IDX_DODGE_WHEN_STANDING] && !module.readNativeFlag()) {
    module.history.length = 0;
    module.stats.hazardCount = 0;
    module.stats.lastScore = null;
    return abortActiveDodge(module);
  }
  if (!state[IDX_DODGE_WHEN_CARRYING] && own.isCarrying) {
    module.history.length = 0;
    module.stats.hazardCount = 0;
    module.stats.lastScore = null;
    return abortActiveDodge(module);
  }
  if (!own.gameTs || now - own.gameTs > OWN_DATA_MAX_AGE_MS) {
    module.history.length = 0;
    return abortActiveDodge(module);
  }
  if (own.gameTs === module.lastOwnTs) {
    return;
  }
  module.lastOwnTs = own.gameTs;

  const input = module.readInput();
  module.stats.lastInput = input;

  if (!module.snapshot) {
    module.snapshot = [own.x, own.y, own.gameTs];
  } else {
    const snapDt = (own.gameTs - module.snapshot[2]) / 1000;
    const dx = own.x - module.snapshot[0];
    const dy = own.y - module.snapshot[1];
    if (snapDt > 0 && snapDt <= LATENCY_CLAMP_S) {
      const vx = dx / snapDt;
      const vy = dy / snapDt;
      const speed = Math.hypot(vx, vy);
      const maxEst = Math.max(1, own.maxSpeed || FALLBACK_MAX_SPEED);
      if (speed <= Math.max(3000, maxEst * TELEPORT_MAX_SPEED_FACTOR)) {
        const scale = Math.min(1, maxEst / Math.max(1, speed));
        module.motion = { x: vx * scale, y: vy * scale };
      } else {
        module.motion = null;
      }
      module.snapshot = [own.x, own.y, own.gameTs];
    } else if (snapDt > LATENCY_CLAMP_S) {
      module.motion = { x: 0, y: 0 };
      module.snapshot = [own.x, own.y, own.gameTs];
    }
  }

  const maxSpeed = Math.max(1, Math.min(5000, own.maxSpeed || FALLBACK_MAX_SPEED));
  const hazards = planDodge(now, maxSpeed, module);
  module.stats.hazardCount = hazards.length;

  if (!hazards.length) {
    if (antiSnipeStep(input, now, module)) {
      return;
    }
    return abortActiveDodge(module);
  }

  const ownRadius = Math.max(1, own.radius || OWN_BASE_RADIUS);
  const horizonSec = hazards.planHorizon || state[IDX_HORIZON_MS] / 1000;
  const reach = Math.max(state[IDX_MOVE_DISTANCE], maxSpeed * horizonSec);
  const directions = module.directions;
  const reactionSec = Math.max(MIN_REACTION_MS, state[IDX_REACTION_MS]) / 1000;
  const reactionHazards = scanReactionHazards(now, reactionSec, maxSpeed, module.history, module.lastSampleTime, module.motion);

  const result = module.helpers.directionEngine({
    best: null,
    angleSpread: Math.PI * (0.12 + 0.88 * state[IDX_AGGRESSIVENESS] / 100),
    hopDistance: Math.max(60, Math.min(360, state[IDX_MOVE_DISTANCE])) * (1.3 - 0.7 * state[IDX_AGGRESSIVENESS] / 100),
    hazards,
    x: own.x,
    y: own.y,
    speed: maxSpeed,
    input,
    plan: module.plan,
    directions,
    horizon: horizonSec,
    reactionSec,
    motion: module.motion,
    reactionHazards,
    parking: false,
    holdCurrent: module.dodging && !!module.plan && now < module.holdUntil && (
      !module.readNativeFlag() ||
      !module.heldCommand ||
      (input.x * module.heldCommand.x + input.y * module.heldCommand.y) > DIRECTION_CHANGE_DOT
    ),
    parkMargin: state[IDX_COMPACT_DODGE] ? state[IDX_PARK_MARGIN] : false,
    releaseHysteresis: state[IDX_RELEASE_HYSTERESIS],
    clearanceAt: (dir, px, py, limit) => module.helpers.raycast(
      px !== undefined ? px : own.x,
      py !== undefined ? py : own.y,
      dir.x,
      dir.y,
      limit,
      ownRadius,
      module.helpers.arena
    ),
    isBlocked: (dir, limit) => {
      const clearance = module.helpers.raycast(
        own.x,
        own.y,
        dir.x,
        dir.y,
        limit,
        ownRadius,
        module.helpers.arena
      );
      return Math.min(clearance, limit) < limit;
    },
  });
  module.stats.ticks++;

  module.stats.lastScore = result && Number.isFinite(result.score) ? result.score : null;
  if (!result) {
    return abortActiveDodge(module);
  }

  const oldPlan = module.plan;
  module.plan = result.plan;

  if (!oldPlan || (oldPlan.x * module.plan.x + oldPlan.y * module.plan.y) < DIRECTION_CHANGE_DOT) {
    module.holdUntil = now + state[IDX_HOLD_DIRECTION_MS];
    module.heldCommand = { ...input };
    module.stats.directionChanges++;
  }
  if (!oldPlan || Math.abs(oldPlan.x - module.plan.x) + Math.abs(oldPlan.y - module.plan.y) > PLAN_MOVE_EPS) {
    module.planMoved = true;
  }
  module.dodging = true;
}

function antiSnipeStep(aim, now, module) {
  const state = module.state;
  const own = module.ownProvider;
  const out = module.antiSnipeOut;

  if (!state[IDX_ANTI_SNIPE] || !state[IDX_DODGE_WHEN_STANDING] || !aim || !aim.x || !aim.y) {
    out[IDX_ACTIVE] = false;
    return false;
  }
  const threat = module.getAimThreat();
  if (!threat) {
    out[IDX_ACTIVE] = false;
    return false;
  }
  const ox = own.x;
  const oy = own.y;
  const r = Math.max(1, own.radius || OWN_BASE_RADIUS);
  const dx = (threat.x - ox) / threat.width;
  const dy = (threat.y - oy) / threat.width;
  const perpX = -dy;
  const perpY = dx;

  if (!out[IDX_ACTIVE]) {
    out[IDX_ACTIVE] = true;
    out[IDX_ANCHOR_X] = ox;
    out[IDX_ANCHOR_Y] = oy;
    out[IDX_SIDE] = 1;
    out[IDX_NEXT_FLIP] = 0;
  }

  if (now >= out[IDX_NEXT_FLIP]) {
    out[IDX_SIDE] = -out[IDX_SIDE];
    const drift = (ox - out[IDX_ANCHOR_X]) * perpX + (oy - out[IDX_ANCHOR_Y]) * perpY;
    if (Math.abs(drift) > DRIFT_LIMIT) {
      out[IDX_SIDE] = drift > 0 ? -1 : 1;
    }
    out[IDX_NEXT_FLIP] = now + state[IDX_ANTI_SNIPE_MS] * (ANTI_SNIPE_JITTER_LO + Math.random() * ANTI_SNIPE_JITTER_HI);
    module.stats.antiSnipeFlips++;
  }

  let dir = { x: perpX * out[IDX_SIDE], y: perpY * out[IDX_SIDE] };
  if (!module.helpers.raycast(ox, oy, dir.x, dir.y, 140, r, module.helpers.arena)) {
    dir = { x: -dir.x, y: -dir.y };
    if (!module.helpers.raycast(ox, oy, dir.x, dir.y, 140, r, module.helpers.arena)) {
      out[IDX_ACTIVE] = false;
      return false;
    }
    out[IDX_SIDE] = -out[IDX_SIDE];
  }

  const oldPlan = module.plan;
  module.plan = dir;
  if (!oldPlan || (oldPlan.x * dir.x + oldPlan.y * dir.y) < DIRECTION_CHANGE_DOT) {
    module.holdUntil = now + state[IDX_HOLD_DIRECTION_MS];
    module.heldCommand = { ...aim };
    module.stats.directionChanges++;
  }
  if (!oldPlan || Math.abs(oldPlan.x - dir.x) + Math.abs(oldPlan.y - dir.y) > PLAN_MOVE_EPS) {
    module.planMoved = true;
  }
  module.dodging = true;
  return true;
}

function abortActiveDodge(module) {
  if (!module.dodging) {
    return;
  }
  module.plan = null;
  module.dodging = false;
  module.planMoved = false;
  module.holdUntil = -Infinity;
  module.releaseHandle = module.providers.getReleaseHandle();
  module.stats.aborts++;
}

function emitEntityTag(value, module) {
  module.tagEmitter(TAG_ENTITY_EVENT, value);
}

function emitWeaponTag(value, module) {
  module.tagEmitter(TAG_WEAPON_EVENT, value);
}

function matchesTagCategory(tag, info, module) {
  if (tag !== TAG_ENTITY_EVENT && tag !== TAG_WEAPON_EVENT) {
    return false;
  }
  const id = info.id;
  if (id >= module.constants.entityIdBase && id < module.constants.entityIdEnd) {
    return true;
  }
  return module.constants.specialIds.includes(id);
}

function installNativeHook(module) {
  const offsets = module.offsets;
  const nativeFn = new NativeFunction(module.deps.add(offsets.hook), 'pointer', []);
  const base = module.deps.add(offsets.hook);
  module.nativeHandle = [nativeFn, base];
  return Interceptor.attach(base, {
    onEnter: function (args) {
      const now = Date.now();
      const view = module.nativeHandle[1];
      const own = module.ownProvider;
      own.cached = null;
      const entity = readOwnEntity(module.nativeHandle, offsets, own);
      if (!entity) {
        return;
      }
      if (now - module.lastHookTs < module.state[IDX_COMMAND_INTERVAL_MS]) {
        return;
      }
      module.lastHookTs = now;
      recordPositionSample(entity.gameTs, entity, module.history);
      module.lastSampleTime = entity.gameTs;
      if (module.plan) {
        const target = clampToPlayfield(
          entity.x + module.plan.x * module.state[IDX_MOVE_DISTANCE],
          entity.y + module.plan.y * module.state[IDX_MOVE_DISTANCE],
          entity,
          module.helpers,
          module.clamp
        );
        writePositionToNative(module.nativeHandle[0](), target.x, target.y, true, module);
        emitEntityTag(target, module);
      }
    },
    onLeave: function (retval) {
      const now = Date.now();
      const view = module.nativeHandle[1];
      try {
        if (module.plan) {
          view.add(module.offsets.commandX).writeFloat(module.plan.x * 100);
          view.add(module.offsets.commandY).writeFloat(module.plan.y * 100);
          view.add(module.offsets.commandActive).writeU8(1);
        } else {
          view.add(module.offsets.commandActive).writeU8(0);
        }
        view.add(module.offsets.hookTimestamp).writeFloat(now);
      } catch (e) {
      }
    },
  });
}

function buildDirections(module) {
  const count = module.state[IDX_DIRECTION_PRECISION];
  module.directions = Array.from({ length: count }, (_, i) => ({
    x: Math.cos(2 * Math.PI * i / count),
    y: Math.sin(2 * Math.PI * i / count),
  }));
  module.plan = null;
}

function getStateSnapshot(module) {
  const state = module.state;
  const snapshot = {};
  for (const key of module.statsKeys) {
    snapshot[key] = module.stats[key];
  }
  snapshot.dodging = module.dodging;
  snapshot.planMoved = module.planMoved;
  snapshot.plan = module.plan ? { x: module.plan.x, y: module.plan.y } : null;
  snapshot.options = {};
  for (let i = 0; i < OPTION_KEYS.length; i++) {
    snapshot.options[OPTION_KEYS[i]] = state[i];
  }
  snapshot.ignoredBrawlers = [...module.ignoredBrawlers];
  snapshot.antiSnipeBrawlers = [...module.antiSnipeBrawlers];
  snapshot.ignoredBrawlerIds = [...module.ignoredBrawlerIds];
  return snapshot;
}

function resetDodgeState(full, module) {
  module.plan = null;
  module.dodging = false;
  module.planMoved = false;
  module.holdUntil = -Infinity;
  module.heldCommand = null;
  module.antiSnipeOut[IDX_ACTIVE] = false;
  if (full) {
    module.releaseAll(module);
  }
  module.tracker.clear();
  for (const key of module.statsKeys) {
    if (typeof module.stats[key] === 'number') {
      module.stats[key] = 0;
    }
  }
  module.stats.lastScore = null;
  module.stats.lastInput = null;
  module.history.length = 0;
  module.subsystemState.planted.clear();
  module.subsystemState.lastSeen.clear();
}

function createAutoDodge(deps, logger) {
  if (typeof logger === 'function') {
    logger = { log: logger };
  }

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const module = {
    deps,
    state: OPTION_DEFAULTS.slice(),
    helpers: logger.helpers,
    providers: logger.providers,
    ctx: logger.context,
    evaluators: [classifyHeadingTracked, classifyTimedBurst, classifyCurving, classifySniper],
    traitCache: { map: new Map(), lastObj: null, lastTuple: null },
    ignoredBrawlers: new Set(),
    antiSnipeBrawlers: new Set(ANTI_SNIPE_DEFAULT_BRAWLERS),
    ignoredBrawlerIds: new Set(),
    directions: [],
    plan: null,
    dodging: false,
    planMoved: false,
    holdUntil: -Infinity,
    heldCommand: null,
    motion: null,
    snapshot: null,
    history: [],
    lastSampleTime: 0,
    lastOwnTs: 0,
    lastHookTs: 0,
    antiSnipeOut: [false, 1, 0, 0, 0],
    stats: {
      ticks: 0,
      hazardCount: 0,
      directionChanges: 0,
      antiSnipeFlips: 0,
      aborts: 0,
      nativeWriteFailures: 0,
      lastScore: null,
      lastInput: null,
    },
    statsKeys: ['ticks', 'hazardCount', 'directionChanges', 'antiSnipeFlips', 'aborts', 'nativeWriteFailures'],
    offsets: logger.offsets,
    subsystemState: {
      planted: new Map(),
      lastSeen: new Map(),
      tags: {
        heading: 'heading_tracked',
        segment: 'heading_segment',
        retagged: 'heading_retagged',
        planted: 'timed_planted',
        burst: 'timed_burst',
        curving: 'curving',
        main: 'controller_main',
        swept: 'controller_swept',
        moduleCtx: 'sniper_module',
        spreadBurst: 'spread_burst',
      },
    },
    constants: {
      minHorizonSec: logger.constants.minHorizonSec,
      enemyRadiusBias: logger.constants.enemyRadiusBias,
      enemySource: 'enemy',
      boClass: SNIPER_KIND_BO,
      entityIdBase: logger.constants.entityIdBase,
      entityIdEnd: logger.constants.entityIdEnd,
      specialIds: logger.constants.specialIds,
    },
    clamp,
  };

  module.tracker = logger.createTracker(module);
  module.entityById = logger.entityById;
  module.getAimThreat = logger.getAimThreat;
  module.readInput = logger.readInput;
  module.readNativeFlag = () => readNativeFlagBool(module.nativeHandle, module.flagOverride, module.offsets, 'isMoving');
  module.isSuspended = logger.isSuspended;
  module.enabled = true;
  module.tagEmitter = logger.tagEmitter;
  module.expanderSpread = (record, safeRadius, horizonSec, planHorizon, subsystemState) =>
    expandSpreadHazard(record, safeRadius, horizonSec, planHorizon, {
      allActors: [...(module.ownProvider.enemies || []), ...(module.ownProvider.enemiesB || [])],
      tags: subsystemState.tags,
    });
  module.ownProvider = { get cached() { return module.cachedOwn; }, set cached(v) { module.cachedOwn = v; } };
  Object.assign(module.ownProvider, logger.ownProviderFields);
  module.releaseAll = () => {
    abortActiveDodge(module);
  };

  buildDirections(module);

  const setOptions = (options) => {
    normalizeDodgeOptions(options, {
      state: module.state,
      get ignoredBrawlers() { return module.ignoredBrawlers; },
      set ignoredBrawlers(v) { module.ignoredBrawlers = v; },
      get antiSnipeBrawlers() { return module.antiSnipeBrawlers; },
      set antiSnipeBrawlers(v) { module.antiSnipeBrawlers = v; },
      get ignoredBrawlerIds() { return module.ignoredBrawlerIds; },
      set ignoredBrawlerIds(v) { module.ignoredBrawlerIds = v; },
      get ignoredThreatPairs() { return module.state[IDX_IGNORED_THREAT_PAIRS]; },
      set ignoredThreatPairs(v) { module.state[IDX_IGNORED_THREAT_PAIRS] = v; },
    });
    if (options && (OPTION_KEYS.indexOf(Object.keys(options).find((k) => k === 'directionPrecision')) >= 0)) {
      buildDirections(module);
    }
    if (options && 'antiSnipeBrawlers' in options) {
      const canon = options.antiSnipeBrawlers.map(canonicalBrawlerName).filter(Boolean);
      module.antiSnipeBrawlers = new Set(canon.length ? canon : ANTI_SNIPE_DEFAULT_BRAWLERS);
    }
  };

  const hook = installNativeHook(module);

  return {
    setOptions,
    planDodgeStep: () => planDodgeStep(module),
    planDodge: (now, speed) => planDodge(now, speed, module),
    antiSnipeStep: (aim, now) => antiSnipeStep(aim, now, module),
    getPlan: () => module.plan,
    isDodging: () => module.dodging,
    isDodgingOrMoved: () => module.dodging || module.planMoved,
    readOwnEntity: () => readOwnEntity(module.nativeHandle, module.offsets, module.ownProvider),
    readNativeFlag: () => module.readNativeFlag(),
    clampToPlayfield: (x, y) => clampToPlayfield(x, y, module.ownProvider, module.helpers, clamp),
    writePosition: (ptr, x, y, commit) => writePositionToNative(ptr, x, y, commit, module),
    installNativeHook: () => installNativeHook(module),
    resetDodgeState: (full) => resetDodgeState(full, module),
    abortActiveDodge: () => abortActiveDodge(module),
    setEnabled: (value) => { module.enabled = !!value; },
    getState: () => getStateSnapshot(module),
    dispose: () => {
      if (hook) {
        hook.detach();
      }
      resetDodgeState(true, module);
    },
  };
}
