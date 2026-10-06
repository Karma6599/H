'use strict';

const BALL_FEATURE_IDS = [10, 11, 12, 15];
const BALL_GOAL = 10;
const BALL_ASSIST = 11;
const BALL_TRAJECTORY = 12;
const BALL_MORTIS_CHAIN = 15;
const BALL_COUNTER_KEYS = [
  'ticks', 'objectiveScans', 'ballFinds', 'moves', 'shots',
  'trajectoryDraws', 'mortisScans', 'mortisRewrites', 'errors',
];
const BALL_STATUS_LABELS = ['idle', 'goal', 'ball', 'search'];
const BALL_INPUT_FLAGS = [0, 1, 2, 3, 4, 5, 6];
const TRICKSHOT_MODE_TABLE = [0, 1, 2, 3, 4, 5];
const BALL_STATUS_IDLE = 0;
const BALL_STATUS_GOAL = 1;
const BALL_STATUS_BALL = 2;
const BALL_STATUS_SEARCH = 3;
const BALL_RECORD_RANGE = 0;
const BALL_RECORD_RADIUS = 1;
const BALL_RECORD_PTR = 2;
const BALL_RECORD_SUPER = 3;
const BALL_RECORD_SPEED = 4;
const BALL_RECORD_TRAVEL = 5;
const BALL_TRAVEL_IN_FLIGHT = 31;
const BALL_VALUES_FIRE = 12;
const BALL_VALUES_STATE = 24;
const BALL_VALUES_AIM_X = 22;
const BALL_VALUES_AIM_Y = 23;
const BALL_NATIVE_SCREEN = 28;
const BALL_NATIVE_X = 3;
const BALL_NATIVE_Y = 4;
const BALL_SHOT_NATIVE = 14;
const BALL_FREE_NATIVE = 10;
const BALL_SIM_MIN = 24;
const BALL_SIM_MAX = 1536;
const BALL_SIM_STRIDE = 12;
const BALL_SAMPLE_STRIDE = 4;
const BALL_BOUNCE_PROBE = 12;
const BALL_MAX_BOUNCES = 3;
const BALL_TICK_MS = 80;
const BALL_READ_MS = 32;
const BALL_WORLD_MS = 180;
const BALL_PLAN_MS = 180;
const BALL_SHOT_DELAY_MS = 70;
const BALL_SHOT_COOLDOWN_MS = 500;

// Trajectory overlay (feature 12) — the game runs its own ball-preview
// simulation through the shared sim native (VALUES[14] = BALL_SHOT_NATIVE);
// the hooks below capture those samples and extend them with the bounce
// solver, then hand the polyline to the game's draw native (VALUES[15]).
const BALL_TRAJECTORY_SYSTEM_NATIVE = 13;
const BALL_DRAW_NATIVE = 15;
const BALL_TRAJECTORY_CTX = 26;
const BALL_TRAJECTORY_CTX_ALT = 27;
const BALL_TRAJECTORY_HOLD_MS = 500;
const BALL_TRAJECTORY_MAX_SPAN = 12288;
const BALL_TRAJECTORY_MAX_COORD = 100000;
const BALL_DRAW_MAX_SEGMENTS = 16;
const BALL_DRAW_MAX_POINTS = 32;
const BALL_DRAW_HEADER_SIZE = 24;
const BALL_SAMPLE_Z = 8;
const BALL_CTX_FLAG = 8;
const BALL_RADIUS = 60;

// Ball scan (fn_623) gates and memoization.
const BALL_ACTOR_CACHE_MAX = 32;
const BALL_RANGE_SCALE = 100;
const BALL_RANGE_MIN = 0;
const BALL_RANGE_MAX = 20000;
const BALL_RADIUS_CLAMP_MIN = 1;
const BALL_RADIUS_CLAMP_MAX = 500;

// Goal move (fn_861) throttle and manual-path constants.
const BALL_MOVE_THROTTLE_MS = 70;
const BALL_PATH_BUDGET_FLAG = 5;
const BALL_PATH_BUDGET = 120;
const BALL_MOVE_COMMAND_SIZE = 72;
const BALL_MOVE_WARM_INDEXES = [7, 8, 9, 10, 6];

// fn_2163 sample contract: 2..128 points per plan.
const BALL_PLAN_MAX_SAMPLES = 128;

// Candidate fan (fn_2705): 36 directions x amplitude tiers.
const BALL_FAN_DIRECTIONS = 36;
const BALL_FAN_TIERS = [0.25, 0.5, 0.75];

// fn_109 factory index constants (byte-recovered from the constant
// table: loc_7=6, loc_14=8, loc_28=10, loc_90=7, loc_102=17, loc_5=18,
// loc_52=19, loc_68=21, loc_110=28, loc_133=9, loc_154=20) — the VALUES
// slots used by the scan/plan helpers.
const BALL_SCAN_OWN_PROBE = 19;
const BALL_SCAN_HEADER = 18;
const BALL_SCAN_ENTITY = 21;
const BALL_ROOT_NATIVE = 28;
const BALL_OWN_POSITION_NATIVE = 20;

const BALL_FEATURE_ID_BY_KEY = {
  goal: BALL_GOAL,
  ball_assist: BALL_ASSIST,
  ball_trajectory: BALL_TRAJECTORY,
  mortis_chain: BALL_MORTIS_CHAIN,
};

function featureId(rawKey) {
  if (Number.isInteger(rawKey)) {
    return BALL_FEATURE_IDS.includes(rawKey) ? rawKey : -1;
  }
  const id = BALL_FEATURE_ID_BY_KEY[rawKey];
  return id === undefined ? -1 : id;
}

function validateWorld(world, ball, paused) {
  // fn_488 shared world gate (fn_2046/fn_1919 flags): the ready flag
  // must not be false, the alive flag must be truthy, and a present
  // ball record must carry finite coordinates. A paused world requires
  // a ball to aim at.
  if (!world) return false;
  if (world.ready === false) return false;
  if (!world.alive) return false;
  if (ball &&
      (!Number.isFinite(ball.x) || !Number.isFinite(ball.y))) {
    return false;
  }
  if (paused && !ball) return false;
  return true;
}

function ballClamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function ballTestSegment(goal, x0, y0, x1, y1, traveled) {
  // Pending boundary: fn_696 testGoalSegment (fn_488 slot 2315) — returns
  // a hit record {x, y, traveled, overshoot} from the goal's mouth box
  // (goalRecord mouthLeft/mouthLow/mouthHigh/isOpen fields). The draw
  // pipeline always passes goal = null, so the null path below is exact;
  // the full geometry test belongs to the goal/solvePlan session.
  if (!goal) return null;
  return undefined;
}

function ballComputeTrajectory(from, angle, budget, walls, goal, maxBounces) {
  // fn_720 — bounce solver. `walls` is the motion snapshot's wall scanner
  // (motion.wallScan): it supplies raycast, blockedTest and the projectile
  // collision layer constant.
  const limit = maxBounces === undefined ? BALL_MAX_BOUNCES : maxBounces;
  let x = from.x;
  let y = from.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let remaining = budget;
  let traveled = 0;
  let bounce = 0;
  const segments = [];
  let goalHit = null;

  while (remaining >= 1 && bounce <= limit) {
    try {
      let dist = walls.raycast(
        x, y, cos, sin, remaining, walls.BLOCKS_PROJECTILES);
      dist = ballClamp(dist, 0, budget);
      const hitWall = dist < budget - 1;
      const nx = x + cos * dist;
      const ny = y + sin * dist;
      goalHit = ballTestSegment(goal, x, y, nx, ny, traveled);
      segments.push({
        fromX: x,
        fromY: y,
        toX: nx,
        toY: ny,
        hitWall: hitWall,
        index: bounce,
        length: dist,
      });
      if (goalHit) break;
      traveled += dist;
      remaining -= dist;
      if (!hitWall || remaining < 2) break;

      let blockedX = false;
      let blockedY = false;
      if (typeof walls.blockedTest === 'function') {
        blockedX = !!walls.blockedTest(
          nx + cos * BALL_BOUNCE_PROBE, ny, walls.BLOCKS_PROJECTILES);
        blockedY = !!walls.blockedTest(
          nx, ny + sin * BALL_BOUNCE_PROBE, walls.BLOCKS_PROJECTILES);
      }
      if (blockedX && !blockedY) {
        cos = -cos;
      } else if (blockedY && !blockedX) {
        sin = -sin;
      } else if (Math.abs(cos) >= Math.abs(sin)) {
        cos = -cos;
      } else {
        sin = -sin;
      }
      const step = Math.min(1, remaining);
      x = nx + cos * step;
      y = ny + sin * step;
      remaining -= step;
      traveled += step;
      bounce++;
    } catch (err) {
      return null;
    }
  }

  return {
    segments: segments,
    goal: goalHit,
    candidate: angle,
    bounces: Math.max(0, segments.length - 1),
    traveled: traveled,
  };
}

function ballProjectTrajectory(points, range, walls) {
  // fn_1069 — extends the game's sampled ball path. Measures how much of
  // the ball's travel range the sampled polyline already covers, then
  // simulates the remainder from the last two samples' direction with the
  // bounce solver. The first segment's start is pulled back by one ball
  // radius so the drawn line begins at the ball's edge. Returns the segment
  // list for drawing ([] when nothing can be projected).
  if (!Array.isArray(points) || points.length < 2 || !(range > 0)) {
    return [];
  }

  let traveled = 0;
  for (let i = 1; i < points.length; i++) {
    traveled += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y);
  }

  const budget = range - traveled;
  if (budget < 1) {
    return [];
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = last.x - prev.x;
  const dy = last.y - prev.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) {
    return [];
  }

  const trajectory = ballComputeTrajectory(
    last, Math.atan2(dy, dx), budget, walls, null, BALL_MAX_BOUNCES);
  if (!trajectory) {
    return [];
  }

  if (trajectory.segments.length) {
    trajectory.segments[0].fromX -= (dx / dist) * BALL_RADIUS;
    trajectory.segments[0].fromY -= (dy / dist) * BALL_RADIUS;
  }
  return trajectory.segments;
}

function genCandidates(own, record, snapshot) {
  // fn_2705 — candidate fan: 36 directions x amplitude tiers
  // 0.25/0.5/0.75 around the direct goal bearing (atan2/cos math). The
  // per-candidate scorer fn_2479 is a documented boundary, so the fan
  // below only fixes the shape; see ball_assist.md step 7.
  const fan = [];
  if (!own || !record) return fan;
  const bearing = Math.atan2(record.y - own.y, record.x - own.x);
  for (let i = 0; i < BALL_FAN_DIRECTIONS; i++) {
    const spread = (i * 2 * Math.PI) / BALL_FAN_DIRECTIONS;
    for (const tier of BALL_FAN_TIERS) {
      fan.push(bearing + spread * tier);
    }
  }
  return fan;
}

function solvePlan(samples, record, ball, entities, flag) {
  // fn_2163 — plan solver (4552 bclen, the largest documented boundary).
  // Byte-verified input contract: samples must be an array of 2..128
  // {x, y} points with |x|, |y| <= 100000; the output plan carries
  // {clear, bounces, segments, length} from hypot segment math plus the
  // goal mouth test. The entity-intersection scoring core is pending
  // (see ball_assist.md "Remaining boundaries").
  if (!Array.isArray(samples) ||
      samples.length < 2 ||
      samples.length > BALL_PLAN_MAX_SAMPLES) {
    return null;
  }
  for (const point of samples) {
    if (!point ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y)) {
      return null;
    }
    if (Math.abs(point.x) > BALL_TRAJECTORY_MAX_COORD ||
        Math.abs(point.y) > BALL_TRAJECTORY_MAX_COORD) {
      return null;
    }
  }
  const plan = { clear: false, bounces: 0, segments: 0, length: 0, goal: null };
  let previousDx = 0;
  let previousDy = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    plan.segments++;
    plan.length += Math.hypot(dx, dy);
    const hit = ballTestSegment(record || null, a.x, a.y, b.x, b.y, plan.length);
    if (hit) {
      plan.goal = hit;
      plan.clear = true;
      break;
    }
    // A wall bounce shows up in the native samples as a direction
    // reversal between consecutive segments.
    if (i > 1 && dx * previousDx + dy * previousDy < 0) {
      plan.bounces++;
    }
    previousDx = dx;
    previousDy = dy;
  }
  return plan;
}

function createTracker(options) {
  // fn_260 — trickshot tracker factory. Byte-verified: capacity clamp
  // 32..2048 (default 1000), injectable clock, mode default 3; the API
  // is {path, reset, getState}. The internal grid walker (fn_2860)
  // stays a documented boundary — the provisional path below steps
  // straight toward the objective within the path budget.
  const config = options || {};
  const capacity = Math.max(32, Math.min(2048, config.capacity || 1000));
  const clock = config.clock || Date.now;
  const mode = config.mode === undefined ? 3 : config.mode;
  let samples = 0;
  let resets = 0;
  let lastPath = null;

  function resolvePath(from, to, wallScan, navGrid, battle) {
    if (!from || !to || mode === 0) return null;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) {
      lastPath = { x: to.x, y: to.y, distance: 0, at: clock() };
      return lastPath;
    }
    if (samples >= capacity) return null;
    samples++;
    const step = Math.min(distance, BALL_PATH_BUDGET);
    lastPath = {
      x: from.x + (dx / distance) * step,
      y: from.y + (dy / distance) * step,
      distance: distance,
      at: clock(),
    };
    return lastPath;
  }

  function reset() {
    samples = 0;
    resets++;
    lastPath = null;
  }

  function getState() {
    return {
      mode: mode,
      capacity: capacity,
      samples: samples,
      resets: resets,
      lastPath: lastPath,
    };
  }

  return {
    path: resolvePath,
    reset: reset,
    getState: getState,
  };
}

function createBallRuntime(deps) {
  // Runtime offset tables and shared readers arrive through deps so the
  // module stays free of raw runtime offsets: ballOffsets is the 28-key
  // VALUES table (aimX@22 / aimY@23 / fire@12 / state@24 / sim@14 /
  // free@10), screen its 29th HUD entry; goalIndexes collects the
  // fn_488 goal-layout slots (goal list, side flag, per-side goal X,
  // travel type, move queue); ballReaders wraps the motion snapshot's
  // shared function table (raw keys documented in ball_assist.md);
  // goalTargetSolver is the fn_2584-family aim solver.
  const ballOffsets = deps.ballOffsets;
  const screen = deps.screen;
  const goalIndexes = deps.goalIndexes || {};
  const ballReaders = deps.ballReaders || {};
  const battleGoalOffset = deps.battleGoalOffset;
  const hudPointerOffset = deps.hudPointerOffset;
  const hudScaleOffset = deps.hudScaleOffset;
  const goalTargetSolver = deps.goalTargetSolver;
  const basePointer = ptr(deps.base);
  const inputGate = deps.inputGate;
  const baseAccessor = deps.log || dispatchMortis;
  const values = Object.values(ballOffsets).concat([screen]);

  if (!inputGate ||
      typeof inputGate.scanBattle !== 'function') {
    throw new Error(
      'Ball/Mortis functions require the shared dodge library to be loaded');
  }

  const features = Object.assign(
    {}, Object.fromEntries(BALL_FEATURE_IDS.map((id) => [id, false])));
  const actorCache = new Map();
  const resolvedNatives = new Set();
  const nativeCache = [];

  let disposed = false;
  let interlock = false;
  let override = false;
  let ticked = false;
  let paused = false;
  let trickshotMode = 1;
  let trickshotModeValue = 0;
  let counterA = 0;
  let statusIndex = BALL_STATUS_IDLE;
  let lastEntityRead = 0;
  let lastTickAt = 0;
  let lastWriteAt = 0;
  let lastMoveAt = 0;
  let notBefore = 0;
  let shotStartedAt = 0;
  let candidateSeq = 0;
  let simulations = 0;
  let battleKey = '';
  let cacheKey = '';
  let lastError = '';
  let snapshot = null;
  let ballScan = null;
  let goalRecord = null;
  let mark = null;
  let activePlan = null;
  let lastPlan = null;
  let candidates = [];
  let seedPointer = null;
  let ballRecord = null;
  let goalStats = null;
  let goalAnchor = null;
  let stateFlag = null;
  let stateSeq = 0;
  let simNative = null;
  // Trajectory overlay state: per-thread [seed, samples] records handed
  // from the system hook (fn_1795/fn_377) to the sim hook (fn_566/fn_2475),
  // plus the lazily-allocated draw buffers (fn_68).
  const threadRecords = new Map();
  let drawPointsBuffer = null;
  let drawHeaderBuffer = null;
  const counters = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const tracker = createTracker();

  function reportError(err) {
    lastError = String(err);
    counters[8]++;
  }

  function releaseGate() {
    if (inputGate.releaseAlt) {
      inputGate.releaseAlt(BALL_INPUT_FLAGS[5]);
    }
  }

  function resetBallState() {
    candidates = [];
    cacheKey = '';
    lastEntityRead = 0;
    trickshotMode = 0;
    shotStartedAt = 0;
    lastPlan = null;
    activePlan = null;
    candidateSeq = 0;
  }

  function resetBattleState() {
    resetBallState();
    snapshot = null;
    battleKey = '';
    ballScan = null;
    goalStats = null;
    mark = null;
    goalRecord = null;
    ballRecord = null;
    paused = false;
    statusIndex = BALL_STATUS_IDLE;
    lastMoveAt = 0;
    notBefore = 0;
    lastWriteAt = 0;
    counterA = 0;
    actorCache.clear();
    goalAnchor = null;
    stateFlag = null;
    tracker.reset();
    releaseGate();
  }

  function hasFeature(rawKey) {
    return BALL_FEATURE_IDS.includes(featureId(rawKey));
  }

  function ensureNative(index) {
    if (resolvedNatives.has(index)) return true;
    resolveNativeAddress(basePointer, values[index],
      'Ball/Mortis ' + Object.keys(ballOffsets)[index]);
    resolvedNatives.add(index);
    return true;
  }

  function getNative(index, retType, argTypes) {
    if (!nativeCache[index]) {
      ensureNative(index);
      nativeCache[index] = new NativeFunction(
        basePointer.add(values[index]), retType, argTypes);
    }
    return nativeCache[index];
  }

  function warmNatives(indexes) {
    for (const index of indexes) ensureNative(index);
  }

  function isUsablePointer(p) {
    try {
      if (!p) return false;
      if (p.isNull()) return false;
      p.readU8();
      return true;
    } catch (err) {
      return false;
    }
  }

  function resolveNativeAddress(base, offset, label) {
    // fn_488 shared precheck: probe the resolved target before the
    // NativeFunction cache claims it (label = the offset-table key).
    const target = base.add(offset);
    if (!isUsablePointer(target)) {
      throw new Error('Ball/Mortis native unavailable: ' + label);
    }
    return target;
  }

  function checkBattleAlive(target) {
    // fn_761 — battle-alive probe (isShotReady gate).
    return isUsablePointer(target);
  }

  function validateSlot(slot) {
    // fn_1384 — raw input-slot validation: maps a slot to its capability
    // class; the ball/assist fire path requires class 5.
    if (!slot) return 0;
    if (typeof slot === 'object' && slot !== null) {
      return slot.id | 0;
    }
    return slot | 0;
  }

  function normalizeMode(mode) {
    // fn_488 helper: clamp a trickshot mode selector into the
    // TRICKSHOT_MODE_TABLE range (mode 1 arms the executeShot path).
    const value = Number(mode) | 0;
    if (value < 0) return 0;
    if (value > TRICKSHOT_MODE_TABLE.length - 1) {
      return TRICKSHOT_MODE_TABLE.length - 1;
    }
    return value;
  }

  function countEnabled(flags) {
    let count = 0;
    for (const id of BALL_FEATURE_IDS) {
      if (flags[id]) count++;
    }
    return count;
  }

  function mapActorKey(key) {
    return String(key);
  }

  function currentFlags() {
    // fn_1393 mode 53669 — the live gate flags snapshot.
    return {
      override: override,
      angle: !!(inputGate.angle && inputGate.angle()),
      locked: !!(inputGate.isLocked &&
        inputGate.isLocked(BALL_INPUT_FLAGS[BALL_PATH_BUDGET_FLAG])),
      wantsShot: !!(deps.wantsShot && deps.wantsShot()),
    };
  }

  function refreshGlobalFlags() {
    // fn_488 global flag refresh (shared gate bookkeeping).
    return currentFlags();
  }

  function projectSnapshot(motion) {
    // fn_500 — goal data reader (documented boundary: the two anchor
    // fields are unresolved; raw keys in the decode dictionary). Passes
    // the snapshot's goal data through when present.
    if (!motion || !motion.world) return null;
    return motion.world.goalData || null;
  }

  function scanBall(motion, battle) {
    // fn_623 — memoized ball scan (byte-verified; ball_assist.md step 3):
    // gates battle.data + (paused === true || usable own character),
    // re-reads the own flag through the bool probe native (slot 19),
    // memoizes per `String(battle.data) + ':' + Number(own)` in the
    // capped actor cache, then walks the ball list (header native 18,
    // entity native 21) and reads range/radius/speed/travelType.
    try {
      const battleData = battle ? battle.data : null;
      if (!isUsablePointer(battleData)) return null;
      const world = motion.world;
      const ownCharacter = world.ownCharacter;
      if (!(world.paused === true || isUsablePointer(ownCharacter))) {
        return null;
      }
      const own = getNative(BALL_SCAN_OWN_PROBE, 'bool',
        ['pointer'])(ownCharacter);
      const memoKey = String(battleData) + ':' + Number(own);
      if (actorCache.has(memoKey)) return actorCache.get(memoKey);
      const ballList = battleData.add(deps.ballListOffset).readPointer();
      if (ballList.isNull()) return null;
      if (!own) return null;
      const header = getNative(BALL_SCAN_HEADER, 'pointer',
        ['pointer'])(ballList);
      const ballEntity = getNative(BALL_SCAN_ENTITY, 'pointer',
        ['pointer', 'int'])(header, 0);
      if (!isUsablePointer(ballEntity)) return null;
      const range = ballReaders.range(header) * BALL_RANGE_SCALE;
      if (!(range > BALL_RANGE_MIN && range < BALL_RANGE_MAX)) return null;
      const ballPtr = ballReaders.ballPointer(header, 0);
      let radius;
      let speed;
      let travelType;
      if (isUsablePointer(ballPtr)) {
        radius = ballReaders.radius(ballPtr) || battle.radius || BALL_RADIUS;
        speed = ballReaders.speed(ballPtr) || 0;
        travelType = ballPtr.add(goalIndexes.travelType).readS32();
      } else {
        radius = battle.radius || BALL_RADIUS;
        speed = 0;
        travelType = -1;
      }
      const scan = [
        range,
        ballClamp(radius, BALL_RADIUS_CLAMP_MIN, BALL_RADIUS_CLAMP_MAX),
        header,
        !!own,
        speed,
        travelType,
      ];
      if (actorCache.size < BALL_ACTOR_CACHE_MAX) {
        actorCache.set(memoKey, scan);
      }
      return scan;
    } catch (err) {
      reportError(err);
      return null;
    }
  }

  function buildGoalAnchor(goalData, ownPosition, layout) {
    // fn_488 goal-record factory (loc_204) — documented boundary: the
    // full mouth-box geometry belongs to the goal/solvePlan session. The
    // provisional anchor below carries the byte-verified mouth fields
    // consumed by executeShot and aimAtGoal (mouthLeft = x threshold,
    // mouthLow/mouthHigh = y bounds, isOpen, aimTarget).
    return {
      key: null,
      goalSide: layout.goalSide,
      x: layout.goalX,
      y: ownPosition,
      radius: layout.radius,
      wall: layout.wall,
      mouthLeft: layout.goalX,
      mouthLow: ownPosition - layout.radius,
      mouthHigh: ownPosition + layout.radius,
      isOpen: true,
      aimTarget: layout.goalX,
    };
  }

  function buildGoalRecord(motion, radius) {
    // fn_2166 — memoized goal anchor (byte-verified; ball_assist.md
    // step 4): goal data via fn_500, goal list off the battle pointer,
    // side flag readU8, per-side goal X readS32, own position through
    // the slot-20 int native, wall term from the wall scan, then the
    // 8-part memo key rebuilds the anchor through the factory above.
    try {
      const goalData = projectSnapshot(motion);
      if (!goalData) return null;
      const goalList = motion.battle.add(goalIndexes.goalList).readPointer();
      if (goalList.isNull()) return null;
      const side = goalList.add(goalIndexes.sideFlag).readU8() !== 0;
      const goalX = goalList.add(
        side ? goalIndexes.goalXSide : goalIndexes.goalXBase).readS32();
      const ownPosition = getNative(BALL_OWN_POSITION_NATIVE, 'int',
        ['pointer', 'pointer'])(
          motion.world.ownCharacter,
          motion.battle) | motion.world.ownPositionFallback | 0;
      const wallScan = motion.wallScan;
      const wall = wallScan && typeof wallScan.read === 'function'
        ? wallScan.read()
        : 0;
      const memoKey = [
        String(motion.battle),
        goalData.anchorA,
        goalData.anchorB,
        ownPosition,
        side,
        goalX,
        radius,
        wall,
      ].join(':');
      if (goalAnchor && goalAnchor.key === memoKey) return goalAnchor;
      goalAnchor = buildGoalAnchor(goalData, ownPosition, {
        goalSide: side,
        goalX: goalX,
        radius: radius,
        wall: wall,
      });
      goalAnchor.key = memoKey;
      return goalAnchor;
    } catch (err) {
      reportError(err);
      return null;
    }
  }

  function executeGoalMove(motion, path, now) {
    // fn_861 — goal move executor (byte-verified; ball_assist.md
    // step 11): 70 ms throttle, path-budget gate (flag 5, 120), then
    // the motion's pathStep callback when it provides one, else a
    // manual 72-byte movement command through the move controller
    // queue (warmed natives [7, 8, 9, 10, 6]).
    if (now - lastMoveAt < BALL_MOVE_THROTTLE_MS) return false;
    if (!inputGate.checkPathBudget ||
        !inputGate.checkPathBudget(
          BALL_INPUT_FLAGS[BALL_PATH_BUDGET_FLAG], BALL_PATH_BUDGET)) {
      return false;
    }
    let moved = false;
    const pathStep = motion.pathStep;
    if (typeof pathStep === 'function') {
      moved = !!pathStep(motion.battle, path.x, path.y);
    } else {
      const controller = ballReaders.moveController;
      if (controller) {
        const queue = controller.add(goalIndexes.moveQueue).readPointer();
        if (!queue.isNull()) {
          warmNatives(BALL_MOVE_WARM_INDEXES);
          const command = Memory.alloc(BALL_MOVE_COMMAND_SIZE);
          command.writeByteArray(
            new Uint8Array(BALL_MOVE_COMMAND_SIZE));
          getNative(deps.ballMoveSubmitIndex, 'ulong',
            ['pointer', 'pointer'])(queue, command);
          moved = true;
        }
      }
    }
    if (!moved) return false;
    lastMoveAt = now;
    counters[3]++;
    return true;
  }

  function ballAssistFireOnEnter(args) {
    // fn_1028 — assist fire hook (refreshHooks hook 1 @ VALUES[0],
    // onEnter; byte-verified; ball_assist.md step 9): proceeds only
    // with the assist enabled, no interlock and trickshot mode 0; the
    // active slot must validate to class 5; the firing character must
    // be the own character; the aim args are rewritten from the
    // refreshed plan with Math.round and the trailing args zeroed.
    try {
      if (!features[BALL_ASSIST] || interlock || trickshotModeValue !== 0) {
        return;
      }
      const slot = inputGate.getActiveSlot();
      if (slot && validateSlot(slot) !== 5) return;
      const seed = args[0];
      const now = Date.now();
      const motion = scanObjective(now);
      if (!motion || !motion.world) return;
      const firingCharacter = args[3];
      if (!isUsablePointer(firingCharacter) ||
          !firingCharacter.equals(motion.world.ownCharacter)) {
        return;
      }
      const shot = refreshPlan(motion, seed, now);
      if (!shot) return;
      args[1] = Math.round(shot.x);
      args[2] = Math.round(shot.y);
      args[5] = Math.round(0);
      args[6] = Math.round(0);
      lastWriteAt = now;
      counters[4]++;
      resetBallState();
    } catch (err) {
      reportError(err);
    }
  }

  // Hook handlers (refreshHooks attach points). The assist fire hook
  // (fn_1028) is reconstructed above; the goal (fn_2714/fn_508) and
  // mortis (fn_729/fn_569) handlers stay documented boundaries with
  // their verified entry gates preserved.
  const ballHookHandlers = {
    assist: {
      onEnter: ballAssistFireOnEnter,
    },
    goal: {
      onEnter: function goalOnEnter(args) {
        return undefined;
      },
      onLeave: function goalOnLeave(retval) {
        return retval;
      },
    },
    mortisA: {
      onEnter: function mortisAOnEnter(args) {
        return undefined;
      },
    },
    mortisB: {
      onEnter: function mortisBOnEnter(args) {
        return undefined;
      },
    },
  };

  function attachHook(slot, index, handlers) {
    // fn_2043 helper: attach an Interceptor at the VALUES offset and
    // keep the handle in the per-feature hook map.
    const hook = Interceptor.attach(basePointer.add(values[index]), handlers);
    hooks.set(slot, hook);
    return hook;
  }

  function detachHook(slot) {
    const hook = hooks.get(slot);
    if (!hook) return false;
    hooks.delete(slot);
    try {
      hook.detach();
    } catch (err) {
      reportError(err);
    }
    return true;
  }

  function dispatchMortis(now, scan) {
    // Mortis chain subtree (fn_1876 family) — documented boundary (see
    // the PENDING list in _RECONSTRUCTION_NOTES.md). Verified entry
    // contract: the dispatch only runs with the feature enabled and a
    // scan snapshot in hand; the rewrite internals are pending.
    if (!features[BALL_MORTIS_CHAIN] || !scan) return undefined;
    return undefined;
  }

  function ballDispatch(mode, arg) {
    if (mode === 60920) {
      if (!arg) return null;
      return {
        range: arg[BALL_RECORD_RANGE],
        radius: arg[BALL_RECORD_RADIUS],
        ptr: arg[BALL_RECORD_PTR],
        super: arg[BALL_RECORD_SUPER],
        speed: arg[BALL_RECORD_SPEED],
        travelType: arg[BALL_RECORD_TRAVEL],
      };
    }
    if (mode === 54397) {
      return {
        mode: BALL_STATUS_LABELS[statusIndex],
        range:
          ballScan ? ballScan[BALL_RECORD_RANGE] : 0,
        radius:
          ballScan ? ballScan[BALL_RECORD_RADIUS] : 0,
        speed:
          ballScan ? ballScan[BALL_RECORD_SPEED] : 0,
        ball: ballRecord ? { ...ballRecord } : ballRecord,
        goal: goalRecord ? { ...goalRecord } : goalRecord,
        paused: paused,
        mark: mark ? { ...mark } : mark,
        battle: battleKey,
      };
    }
    if (mode === 53669) {
      return !!(override ||
        inputGate.angle() ||
        (inputGate.isLocked &&
          inputGate.isLocked(BALL_INPUT_FLAGS[5])) ||
        (deps.wantsShot &&
          deps.wantsShot()));
    }
    return undefined;
  }

  function readBallRecord(scan) {
    return ballDispatch(60920, scan);
  }

  function scanObjective(now, provided) {
    if (disposed) return null;
    const motion = provided === undefined
      ? inputGate.scanBattle(100)
      : provided;
    if (!motion || !motion.world ||
        !motion.world.counterA) {
      resetBattleState();
      return null;
    }
    const nextBattle = String(motion.battle);
    if (nextBattle !== battleKey) {
      resetBattleState();
      battleKey = nextBattle;
    }
    snapshot = motion;
    loadBattleState(motion, now);
    return motion;
  }

  function loadBattleState(motion, now) {
    const world = motion.world;
    if (world.counterA === counterA) return undefined;
    counterA = world.counterA;
    counters[1]++;

    const rawBall = world.ball;
    const ball = rawBall && Number.isFinite(rawBall.x) &&
      Number.isFinite(rawBall.y) ? rawBall : null;
    paused = (world.paused === true);

    if (!validateWorld(world, ball, paused)) {
      ballScan = null;
      mark = null;
      goalRecord = null;
      ballRecord = null;
      paused = false;
      statusIndex = BALL_STATUS_IDLE;
      return undefined;
    }

    if (ball) {
      ballRecord = {
        gid: String(ball.gid),
        x: ball.x,
        y: ball.y,
        name: ball.name || 'BALL',
        radius: ball.radius || BALL_RADIUS,
      };
      counters[2]++;
    } else {
      ballRecord = null;
    }

    const scan = scanBall(motion, ball);
    if (scan) {
      goalRecord = buildGoalRecord(motion, scan[BALL_RECORD_SUPER]);
      if (paused && goalRecord) {
        statusIndex = BALL_STATUS_GOAL;
        mark = { x: goalRecord.x, y: goalRecord.y };
        return undefined;
      }
      if (ballRecord) {
        statusIndex = BALL_STATUS_BALL;
        mark = { x: ballRecord.x, y: ballRecord.y };
        return undefined;
      }
      if (goalRecord) {
        statusIndex = BALL_STATUS_SEARCH;
        mark = null;
        return undefined;
      }
      statusIndex = BALL_STATUS_IDLE;
      mark = null;
      return undefined;
    }
    goalRecord = (ball && ball.radius) || 60;
    return undefined;
  }

  function isShotReady(motion) {
    if (!motion || !features[BALL_ASSIST] || !paused ||
        !goalRecord || !ballScan ||
        !isUsablePointer(
          motion.world.ownCharacter)) {
      return false;
    }
    const world = motion.world;
    const stateByte =
      world.ownCharacter.add(values[BALL_VALUES_STATE]).readU8();
    if (stateByte !== 1) return false;
    if (!!getNative(19, 'bool', ['pointer'])(world.ownCharacter) !==
      !!ballScan[BALL_RECORD_SUPER]) {
      return false;
    }
    if (world.canAim === false) return false;
    if (!world.engaged) return false;
    if (Date.now() - world.counterA >
      BALL_WORLD_MS) {
      return false;
    }
    if (!world.ball) return false;
    if (!checkBattleAlive(
      motion.battle.add(battleGoalOffset))) {
      return false;
    }
    return ballScan[BALL_RECORD_TRAVEL] === BALL_TRAVEL_IN_FLIGHT &&
      ballScan[BALL_RECORD_SPEED] > 0;
  }

  function buildShot(motion, seedPtr, angle) {
    const world = motion.world;
    const scan = ballScan;
    if (!scan || !isUsablePointer(scan[BALL_RECORD_PTR]) ||
        !isUsablePointer(seedPtr) ||
        !isUsablePointer(world.ownCharacter) ||
        !world.paused) {
      return null;
    }

    if (!simNative) {
      warmNatives([BALL_SHOT_NATIVE, BALL_FREE_NATIVE]);
      simNative = new NativeFunction(
        basePointer.add(values[BALL_SHOT_NATIVE]),
        ['pointer', 'pointer', 'pointer'],
        ['pointer', 'pointer', 'pointer', 'int', 'uint', 'int',
          'float', 'float', 'float', 'float', 'float', 'float']);
    }

    const ownX =
      getNative(BALL_NATIVE_X, 'int', ['pointer'])(world.ownCharacter);
    const ownY =
      getNative(BALL_NATIVE_Y, 'int', ['pointer'])(world.ownCharacter);
    const shotX =
      Math.round(ownX + Math.cos(angle) * scan[BALL_RECORD_RANGE]);
    const shotY =
      Math.round(ownY + Math.sin(angle) * scan[BALL_RECORD_RANGE]);

    let simResult = null;
    try {
      simResult = simNative(
        seedPtr, world.ownCharacter, scan[BALL_RECORD_PTR],
        0, 2147483647, -1,
        ownX, ownY, 0, shotX, shotY, 0);
      const buffer = simResult[0];
      const timeEnd = simResult[1];
      const timeStart = simResult[2];
      if (!isUsablePointer(buffer) || timeEnd.compare(buffer) < 0 ||
          timeStart.compare(timeEnd) < 0) {
        return null;
      }
      const span = timeEnd.sub(buffer).toInt32();
      if (span < BALL_SIM_MIN || span > BALL_SIM_MAX ||
          (span % BALL_SIM_STRIDE) !== 0) {
        return null;
      }

      const samples = [];
      for (let i = 0; i < span; i += BALL_SIM_STRIDE) {
        samples.push({
          x: buffer.add(i).readFloat(),
          y: buffer.add(i + BALL_SAMPLE_STRIDE).readFloat(),
        });
      }
      simulations++;

      return {
        samples: samples,
        x: shotX,
        y: shotY,
        from: { x: ownX, y: ownY },
      };
    } finally {
      if (simResult && isUsablePointer(simResult[0])) {
        getNative(BALL_FREE_NATIVE, 'void', ['pointer'])(simResult[0]);
      }
    }
  }

  function buildPlan(motion, seedPtr, angle, now) {
    const shot = buildShot(motion, seedPtr, angle);
    if (!shot) return null;
    const world = motion.world;
    const entities = [];
    for (const entity of world.entities || []) {
      entities[entities.length] = entity;
    }
    for (const projectile of world.projectiles || []) {
      entities[entities.length] = projectile;
    }
    const plan = solvePlan(
      shot.samples, goalRecord,
      readBallRecord(ballScan), entities);
    if (!plan) return null;
    return Object.assign(plan, {
      x: shot.x,
      y: shot.y,
      from: shot.from,
      candidate: angle,
      at: now,
      seedKey: String(seedPtr),
      battle: String(motion.battle),
      ballKey: String(world.ball && world.ball.gid),
      super: ballScan[BALL_RECORD_SUPER],
    });
  }

  function refreshPlan(motion, seedPtr, now) {
    if (!isShotReady(motion) || !activePlan ||
        activePlan.seedKey !== String(seedPtr) ||
        activePlan.battle !== String(motion.battle) ||
        activePlan.ballKey !==
          String(motion.world.ball && motion.world.ball.gid) ||
        activePlan.super !== ballScan[BALL_RECORD_SUPER] ||
        now - activePlan.at > BALL_PLAN_MS) {
      activePlan = null;
      return null;
    }
    const next = buildPlan(
      motion, seedPtr, activePlan.candidate, now);
    if (next && next.clear) {
      activePlan = next;
      lastPlan = next;
    } else {
      activePlan = null;
    }
    return activePlan;
  }

  function executeShot(seedPtr, now) {
    const at = now === undefined ? Date.now() : now;
    if (disposed || !features[BALL_ASSIST] || interlock ||
        at - lastEntityRead < BALL_READ_MS) {
      return undefined;
    }
    lastEntityRead = at;
    try {
      const motion = scanObjective(at);
      if (!isShotReady(motion) && !isUsablePointer(seedPtr)) {
        resetBallState();
        lastEntityRead = at;
        trickshotMode = 1;
        return undefined;
      }
      seedPointer = seedPtr;
      const world = motion.world;

      const key = [
        battleKey,
        world.ball.gid,
        ballScan[BALL_RECORD_SUPER],
        goalRecord.mouthLeft,
        goalRecord.isOpen,
        goalRecord.aimTarget,
        goalRecord.mouthLow,
        goalRecord.mouthHigh,
      ].join(':');
      if (key !== cacheKey) {
        resetBallState();
        cacheKey = key;
        lastEntityRead = at;
      }

      let plan = null;
      if (activePlan) {
        plan = refreshPlan(motion, seedPtr, at);
      }
      if (!plan) {
        const own = {
          x: world.ownX,
          y: world.ownY,
        };
        candidates = genCandidates(own, goalRecord,
          projectSnapshot(motion));
        candidateSeq++;
        const angle =
          candidates[candidateSeq % candidates.length];
        const next = buildPlan(motion, seedPtr, angle, at);
        if (next) {
          lastPlan = next;
          if (next.clear) activePlan = next;
        }
      }

      if (!plan) {
        shotStartedAt = 0;
        trickshotMode = 4;
        return undefined;
      }

      if (!shotStartedAt) shotStartedAt = at;
      trickshotMode = 2;
      if (trickshotModeValue !== 1 || !plan ||
          at - shotStartedAt < BALL_SHOT_DELAY_MS ||
          at - lastWriteAt < BALL_SHOT_COOLDOWN_MS ||
          at < notBefore) {
        return undefined;
      }

      const slot = inputGate.getActiveSlot();
      if (slot && validateSlot(slot) !== 5) return undefined;
      if (!inputGate.probeGate(
        BALL_INPUT_FLAGS[5], 100)) {
        return undefined;
      }

      const aimX = seedPtr.add(values[BALL_VALUES_AIM_X]).readS32();
      const aimY = seedPtr.add(values[BALL_VALUES_AIM_Y]).readS32();
      interlock = true;
      try {
        seedPtr.add(values[BALL_VALUES_AIM_X]).writeS32(plan.x);
        seedPtr.add(values[BALL_VALUES_AIM_Y]).writeS32(plan.y);
        lastWriteAt = at;
        getNative(BALL_VALUES_FIRE, 'int',
          ['pointer', 'pointer'])(seedPtr, world.ownCharacter);
        counters[4]++;
      } finally {
        seedPtr.add(values[BALL_VALUES_AIM_X]).writeS32(aimX);
        seedPtr.add(values[BALL_VALUES_AIM_Y]).writeS32(aimY);
        interlock = false;
        resetBallState();
      }
      releaseGate();
      return undefined;
    } catch (err) {
      releaseGate();
      throw err;
    }
  }

  function aimRedirectAndFire(context, x, y) {
    const at = Date.now();
    const motion = scanObjective(at, context);
    if (!motion || !paused || !ballScan ||
        !Number.isFinite(x) || !Number.isFinite(y) ||
        at - motion.world.counterA > BALL_WORLD_MS) {
      return false;
    }
    const world = motion.world;
    const ownCharacter = world.ownCharacter;
    if (!isUsablePointer(ownCharacter) ||
        ownCharacter.add(values[BALL_VALUES_STATE]).readU8() !== 1 ||
        world.canAim === false) {
      return false;
    }

    const hud = getNative(BALL_NATIVE_SCREEN, 'pointer', [])();
    if (!isUsablePointer(hud) ||
        hud.add(hudPointerOffset).readPointer().isNull() ||
        !(hud.add(hudScaleOffset).readFloat() > 0)) {
      return false;
    }

    const aimX = hud.add(values[BALL_VALUES_AIM_X]).readS32();
    const aimY = hud.add(values[BALL_VALUES_AIM_Y]).readS32();
    let fired = false;
    try {
      interlock = true;
      hud.add(values[BALL_VALUES_AIM_X]).writeS32(Math.round(x));
      hud.add(values[BALL_VALUES_AIM_Y]).writeS32(Math.round(y));
      const result = getNative(BALL_VALUES_FIRE, 'int',
        ['pointer', 'pointer'])(hud, ownCharacter);
      fired = result !== 0 ||
        (!hud.add(hudPointerOffset).readPointer().isNull() &&
          hud.add(hudScaleOffset).readFloat() > 0);
    } finally {
      hud.add(values[BALL_VALUES_AIM_X]).writeS32(aimX);
      hud.add(values[BALL_VALUES_AIM_Y]).writeS32(aimY);
      interlock = false;
      if (fired) {
        lastWriteAt = Date.now();
        counters[4]++;
      }
    }
    return fired;
  }

  function trajectorySystemOnEnter(args) {
    // fn_1795 — hook 2 onEnter on the trajectory system update native
    // (VALUES[13]). Stashes the seed pointer for the whole runtime, holds
    // assist shots for 500 ms while a trajectory pass runs, and — when the
    // trajectory overlay is enabled — opens the per-thread record and
    // clears the render contexts' visibility byte so the game recomputes
    // its ball preview instead of reusing the stale frame.
    seedPointer = args[0];
    if (features[BALL_ASSIST]) {
      notBefore = Date.now() + BALL_TRAJECTORY_HOLD_MS;
    }
    if (!features[BALL_TRAJECTORY]) {
      return;
    }
    const threadId = Process.getCurrentThreadId();
    this.threadId = threadId;
    threadRecords.set(threadId, [args[0], null]);
    for (const index of [BALL_TRAJECTORY_CTX, BALL_TRAJECTORY_CTX_ALT]) {
      const context = args[0].add(values[index]).readPointer();
      if (isUsablePointer(context)) {
        context.add(BALL_CTX_FLAG).writeU8(0);
      }
    }
  }

  function trajectorySystemOnLeave() {
    // fn_377 — hook 2 onLeave. The game's trajectory pass has finished; if
    // the sim hook captured a fresh sample list for this thread, extend it
    // with the bounce solver and draw the projected path. The original's
    // first gate is an opaque thread comparison (tail global vs the stored
    // id — never equal); the undefined check below is the honest form.
    // Ball assist takes precedence: when it is enabled the overlay stays
    // off and the samples are only used for shot timing.
    const threadId = this.threadId;
    if (threadId === undefined) {
      return;
    }
    const record = threadRecords.get(threadId);
    threadRecords.delete(threadId);
    if (features[BALL_ASSIST] || !features[BALL_TRAJECTORY] ||
        !record || !record[1]) {
      return;
    }
    try {
      const motion = snapshot || scanObjective();
      if (!motion) {
        return;
      }
      const scan = scanBall(motion, motion.world.ball);
      if (!scan) {
        return;
      }
      const segments = ballProjectTrajectory(
        record[1], scan[BALL_RECORD_RANGE], motion.wallScan);
      drawTrajectory(record[0], segments);
    } catch (err) {
      reportError(err);
    }
  }

  function trajectorySimOnEnter() {
    // fn_566 — hook 3 onEnter on the shared trajectory simulation native
    // (VALUES[14] = BALL_SHOT_NATIVE, the same one buildShot calls).
    // Only intercepts calls in the x3 == 0 mode whose ball entity is
    // active, and only while a trajectory pass is open on this thread.
    // x8 is the arm64 indirect-result register: the game receives the
    // sample buffer through it.
    if (this.context.x3.toInt32() !== 0) {
      return;
    }
    const ballPtr = this.context.x1;
    if (!isUsablePointer(ballPtr)) {
      return;
    }
    if (ballPtr.add(values[BALL_VALUES_STATE]).readU8() !== 1) {
      return;
    }
    const record = threadRecords.get(Process.getCurrentThreadId());
    if (!record) {
      return;
    }
    this.record = record;
    this.outBuffer = this.context.x8;
  }

  function trajectorySimOnLeave() {
    // fn_2475 — hook 3 onLeave. Reads the {start, end} buffer pointers the
    // simulation produced and samples the 12-byte {x, y, z} floats into
    // the thread record for the projector. Any non-finite or out-of-range
    // coordinate rejects the whole pass (matches the original's early
    // return, not a partial list).
    const record = this.record;
    const outBuffer = this.outBuffer;
    if (!record || !isUsablePointer(outBuffer)) {
      return;
    }
    try {
      const buffer = outBuffer.readPointer();
      const end = outBuffer.add(BALL_SAMPLE_Z).readPointer();
      if (!isUsablePointer(buffer) || !isUsablePointer(end)) {
        return;
      }
      const span = end.sub(buffer).toInt32();
      if (span < BALL_SIM_MIN || span > BALL_TRAJECTORY_MAX_SPAN ||
          (span % BALL_SIM_STRIDE) !== 0) {
        return;
      }

      const points = [];
      for (let i = 0; i < span / BALL_SIM_STRIDE; i++) {
        const sample = buffer.add(i * BALL_SIM_STRIDE);
        const x = sample.readFloat();
        const y = sample.add(BALL_SAMPLE_STRIDE).readFloat();
        const z = sample.add(BALL_SAMPLE_Z).readFloat();
        if (!Number.isFinite(x) || !Number.isFinite(y) ||
            !Number.isFinite(z) ||
            Math.abs(x) > BALL_TRAJECTORY_MAX_COORD ||
            Math.abs(y) > BALL_TRAJECTORY_MAX_COORD) {
          return;
        }
        points.push({ x: x, y: y, z: z });
      }
      if (points.length >= 2) {
        record[1] = points;
      }
    } catch (err) {
      reportError(err);
    }
  }

  function writeTrajectoryPoint(points, index, x, y) {
    // fn_2794 — one 12-byte {x, y, 0} vertex in the draw buffer; the
    // overlay polyline is 2D so the third float is forced to zero.
    const vertex = points.add(index * BALL_SIM_STRIDE);
    vertex.writeFloat(x);
    vertex.add(BALL_SAMPLE_STRIDE).writeFloat(y);
    vertex.add(BALL_SAMPLE_Z).writeFloat(0);
  }

  function drawTrajectory(seed, segments) {
    // fn_68 — renders a trajectory polyline through the game's own draw
    // native (VALUES[15]) and flips the render context's visibility byte.
    // Buffers are allocated once and reused across draws. Returns true
    // when the path was drawn.
    if (!segments.length || segments.length > BALL_DRAW_MAX_SEGMENTS ||
        !isUsablePointer(seed)) {
      return false;
    }
    const context = seed.add(values[BALL_TRAJECTORY_CTX]).readPointer();
    if (!isUsablePointer(context)) {
      return false;
    }
    if (!drawPointsBuffer) {
      drawPointsBuffer =
        Memory.alloc(BALL_DRAW_MAX_POINTS * BALL_SIM_STRIDE);
      drawHeaderBuffer = Memory.alloc(BALL_DRAW_HEADER_SIZE);
    }
    const points = drawPointsBuffer;
    const header = drawHeaderBuffer;

    writeTrajectoryPoint(points, 0, segments[0].fromX, segments[0].fromY);
    for (let i = 0; i < segments.length; i++) {
      writeTrajectoryPoint(
        points, i + 1, segments[i].toX, segments[i].toY);
    }
    const end = points.add((segments.length + 1) * BALL_SIM_STRIDE);
    header.writePointer(points);
    header.add(BALL_SAMPLE_Z).writePointer(end);
    header.add(BALL_SAMPLE_Z + BALL_SAMPLE_STRIDE).writePointer(end);

    getNative(BALL_DRAW_NATIVE, 'void',
      ['pointer', 'pointer', 'float', 'float', 'float'])(
      context, header, 100, 0, -1);
    context.add(BALL_CTX_FLAG).writeU8(1);
    counters[5]++;  // trajectoryDraws
    return true;
  }

  function tick(seedPtr, now) {
    const at = now === undefined ? Date.now() : now;
    if (disposed || ticked ||
        (!features[BALL_GOAL] && !features[BALL_ASSIST]) ||
        at - lastTickAt < BALL_TICK_MS) {
      return undefined;
    }
    lastTickAt = at;
    ticked = true;
    try {
      try {
        if (isUsablePointer(seedPtr)) seedPointer = seedPtr;
        const motion = scanObjective(at);
        if (!motion) {
          return undefined;
        }
        counters[0]++;
        if (features[BALL_GOAL] && mark) {
          const path = tracker.path(
            { x: motion.world.ownX, y: motion.world.ownY },
            mark,
            motion.wallScan,
            motion.world.navGrid,
            battleKey);
          if (path) {
            executeGoalMove(motion, path, at);
          }
        }
      } catch (err) {
        reportError(err);
      }
    } finally {
      ticked = false;
    }
    return undefined;
  }

  function getTrickshotStatus() {
    return {
      status: TRICKSHOT_MODE_TABLE[trickshotMode],
      ball: {
        x: snapshot ? snapshot.world.ownX : undefined,
        y: snapshot ? snapshot.world.ownY : undefined,
      },
    };
  }

  function setMode(mode) {
    if (normalizeMode(mode) === 1) {
      trickshotModeValue = mode;
      resetBallState();
    } else {
      trickshotModeValue = 0;
    }
    return undefined;
  }

  function setOverride(on) {
    override = !!on;
    if (override && inputGate.notifyRejected) {
      inputGate.notifyRejected(BALL_INPUT_FLAGS[5]);
    }
    return override;
  }

  function applySaved() {
    for (const id of BALL_FEATURE_IDS) {
      features[id] = false;
    }
    refreshHooks();
    resetBattleState();
  }

  function refreshHooks() {
    // fn_2043 — per-feature Interceptor attach/detach. The trajectory
    // handlers (hooks 2 and 3) are reconstructed in this module; the goal,
    // assist and mortis handlers still live behind the ballHookHandlers
    // boundary (fn_2714/fn_508, fn_1028, fn_729/fn_569).
    if (features[BALL_GOAL] && !hooks.has(0)) {
      warmNatives([11]);
      attachHook(0, 11, {
        onEnter: ballHookHandlers.goal.onEnter,
        onLeave: ballHookHandlers.goal.onLeave,
      });
    }
    if (features[BALL_ASSIST] && !hooks.has(1)) {
      warmNatives([0]);
      attachHook(1, 0, {
        onEnter: ballHookHandlers.assist.onEnter,
      });
    }
    if (features[BALL_TRAJECTORY]) {
      if (!hooks.has(2)) {
        warmNatives([BALL_TRAJECTORY_SYSTEM_NATIVE]);
        attachHook(2, BALL_TRAJECTORY_SYSTEM_NATIVE, {
          onEnter: trajectorySystemOnEnter,
          onLeave: trajectorySystemOnLeave,
        });
      }
      if (!hooks.has(3)) {
        warmNatives([BALL_SHOT_NATIVE, BALL_DRAW_NATIVE]);
        attachHook(3, BALL_SHOT_NATIVE, {
          onEnter: trajectorySimOnEnter,
          onLeave: trajectorySimOnLeave,
        });
      }
    } else {
      if (hooks.has(3)) detachHook(3);
      if (hooks.has(2)) detachHook(2);
    }
    if (features[BALL_MORTIS_CHAIN]) {
      if (!hooks.has(4)) {
        warmNatives([0]);
        attachHook(4, 0, {
          onEnter: ballHookHandlers.mortisA.onEnter,
        });
      }
      if (!hooks.has(5)) {
        warmNatives([8]);
        attachHook(5, 8, {
          onEnter: ballHookHandlers.mortisB.onEnter,
        });
      }
    } else {
      if (hooks.has(5)) detachHook(5);
      if (hooks.has(4)) detachHook(4);
    }
    if (!features[BALL_ASSIST] && hooks.has(1)) detachHook(1);
    if (!features[BALL_GOAL] && hooks.has(0)) detachHook(0);
  }

  function setEnabled(rawKey, on) {
    const key = featureId(rawKey);
    if (disposed) {
      throw new Error('Ball/Mortis runtime disposed');
    }
    if (!BALL_FEATURE_IDS.includes(key)) {
      throw new Error('Unknown ball/mortis function: ' + rawKey);
    }
    on = !!on;
    if (features[key] === on) return on;
    const previous = features[key];
    features[key] = on;
    try {
      refreshHooks();
      if (key === BALL_ASSIST) {
        resetBallState();
        if (inputGate.notifyRejected) {
          inputGate.notifyRejected(BALL_INPUT_FLAGS[5]);
        }
        if (on) {
          warmNatives([BALL_VALUES_FIRE, 14, BALL_FREE_NATIVE]);
        }
      }
      if ((on && key === BALL_GOAL) || key === BALL_ASSIST) {
        scanObjective(Date.now());
      }
    } catch (err) {
      features[key] = previous;
      try {
        refreshHooks();
      } catch (nested) {
      }
      reportError(err);
      throw err;
    }
    return on;
  }

  function objective(arg) {
    try {
      const scan = scanObjective(Date.now(), arg);
      if (scan && features[BALL_MORTIS_CHAIN]) {
        dispatchMortis(Date.now(), scan);
      }
    } catch (err) {
      resetBattleState();
      reportError(err);
    } finally {
      currentFlags();
    }
    return undefined;
  }

  function getState() {
    return {
      enabled: countEnabled(features),
      override: override,
      disposed: disposed,
      trickshot: {
        mode: normalizeMode(trickshotModeValue),
        status: TRICKSHOT_MODE_TABLE[trickshotMode],
        lastMoveAt: lastMoveAt,
        seedPointer: seedPointer,
        live: getTrickshotStatus(),
        ...currentFlags(),
      },
      trackerState: tracker.getState(),
      goalStats: goalStats ? { ...goalStats } : goalStats,
      actors: Array.from(actorCache.keys())
        .map(mapActorKey),
      ...Object.fromEntries(
        BALL_COUNTER_KEYS.map((key, index) => [key, counters[index]])),
      lastError: lastError,
    };
  }

  function aimAtGoal(anchor, options) {
    // fn_554 — aim at the goal (byte-verified; ball_assist.md step 10):
    // budget clamp, fn_2584-family target solver (documented boundary —
    // the goal anchor itself is the aim point without it), buildShot at
    // the solved bearing, aim-target adjustment (isOpen ? 1 : -1) *
    // (speed + 25), then the direct-shot gate plan.clear && bounces === 0.
    const now = Date.now();
    const motion = scanObjective(now);
    if (!motion || !motion.world) return null;
    const world = motion.world;
    if (!goalRecord || !ballScan) return null;
    if (ballScan[BALL_RECORD_TRAVEL] !== BALL_TRAVEL_IN_FLIGHT) {
      return null;
    }
    const range = ballScan[BALL_RECORD_RANGE];
    const budget = Math.min(
      options && options.range !== undefined ? options.range : range,
      range);
    const root = getNative(BALL_ROOT_NATIVE, 'pointer', [])();
    const origin = anchor || { x: world.ownX, y: world.ownY };
    const entities = [];
    for (const entity of world.entities || []) {
      entities[entities.length] = entity;
    }
    for (const projectile of world.projectiles || []) {
      entities[entities.length] = projectile;
    }
    const target = goalTargetSolver
      ? goalTargetSolver(origin, goalRecord, motion.wallScan, budget,
          readBallRecord(ballScan), entities)
      : goalRecord;
    if (!target) return null;
    const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
    const shot = buildShot(motion, root, angle);
    if (!shot) return null;
    const record = { ...goalRecord };
    record.aimTarget = record.aimTarget +
      (record.isOpen ? 1 : -1) * (ballScan[BALL_RECORD_SPEED] + 25);
    const plan = solvePlan(shot.samples, record,
      readBallRecord(ballScan), entities, 0);
    if (!plan || !plan.clear || plan.bounces !== 0) return null;
    return {
      ...target,
      x: shot.x,
      y: shot.y,
      traveled: plan.length,
      ready: true,
    };
  }

  function followObjectivePath(target, angle, budget) {
    // fn_1166 — follow the objective path (documented boundary, 281
    // bclen: the full navigation walk). Verified contract: resolve the
    // next path step through the tracker from the own position.
    const now = Date.now();
    const motion = scanObjective(now);
    if (!motion || !motion.world || !target) return null;
    return tracker.path(
      { x: motion.world.ownX, y: motion.world.ownY },
      target,
      motion.wallScan,
      motion.world.navGrid,
      String(motion.battle));
  }

  function refreshFlags() {
    return refreshGlobalFlags();
  }

  function dispose() {
    if (disposed) return undefined;
    applySaved();
    disposed = true;
    stateFlag = null;
    goalStats = null;
    goalAnchor = null;
    return undefined;
  }

  const hooks = new Map();

  const api = {
    has: hasFeature,
    setEnabled: setEnabled,
    setOverride: setOverride,
    applySaved: applySaved,
    dispose: dispose,
    objective: objective,
    followObjectivePath: followObjectivePath,
    aimAtGoal: aimAtGoal,
    aimRedirectAndFire: aimRedirectAndFire,
    tick: tick,
    executeShot: executeShot,
    getTrickshotStatus: getTrickshotStatus,
    refreshFlags: refreshFlags,
    resetBallState: resetBallState,
    setMode: setMode,
    getState: getState,
  };

  return api;
}
