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

function ballClamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function ballTestSegment(goal, x0, y0, x1, y1, traveled) {
  return undefined;
}

function ballComputeTrajectory(from, angle, budget, world, goal, maxBounces) {
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
      let dist = world['_$db1aebbcc3781e90ec4d0374'](
        x, y, cos, sin, remaining, world.BLOCKS_PROJECTILES);
      dist = ballClamp(dist, 0, budget);
      const hitWall = dist < budget - 1;
      const nx = x + cos * dist;
      const ny = y + sin * dist;
      goalHit = ballTestSegment(goal, x, y, nx, ny, traveled);
      segments.push({
        '_$ad725bbc38340cfb658c63d7': x,
        '_$787b254d2864fa8d7364ab20': y,
        '_$4e7d619ede596809fcfe0943': nx,
        '_$2232fa0c6e6ae79fefce1293': ny,
        '_$0ff0e85e9f6fdf1ad94dbc96': hitWall,
        '_$689dcf5e83dcbcc745bdd7c8': bounce,
        length: dist,
      });
      if (goalHit) break;
      traveled += dist;
      remaining -= dist;
      if (!hitWall || remaining < 2) break;

      let blockedX = false;
      let blockedY = false;
      if (typeof world['_$f431d070cad79e4a094070ae'] === 'function') {
        blockedX = !!world['_$f431d070cad79e4a094070ae'](
          nx + cos * BALL_BOUNCE_PROBE, ny, world.BLOCKS_PROJECTILES);
        blockedY = !!world['_$f431d070cad79e4a094070ae'](
          nx, ny + sin * BALL_BOUNCE_PROBE, world.BLOCKS_PROJECTILES);
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
    '_$714df0306c0a460933d1027e': segments,
    goal: goalHit,
    '_$1516bfd127113e7a34d79575': angle,
    '_$e128c5e51c82801490c558f6': Math.max(0, segments.length - 1),
    '_$29994d6e8def9703d4199cf8': traveled,
  };
}

function createBallRuntime(deps) {
  const basePointer = ptr(deps.base);
  const inputGate = deps['_$0f5ca3bf508eb8602288884d'];
  const baseAccessor = deps.log || dispatchMortis;
  const values = Object.values(ballOffsets).concat([screen]);

  if (!inputGate ||
      typeof inputGate['_$8909080e7460c4c9d13103f4'] !== 'function') {
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
  const counters = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const tracker = createTracker();

  function reportError(err) {
    lastError = String(err);
    counters[8]++;
  }

  function releaseGate() {
    if (inputGate['_$371edf41cefa490bf13678bf']) {
      inputGate['_$371edf41cefa490bf13678bf'](BALL_INPUT_FLAGS[5]);
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

  function ballDispatch(mode, arg) {
    if (mode === 60920) {
      if (!arg) return null;
      return {
        range: arg[BALL_RECORD_RANGE],
        radius: arg[BALL_RECORD_RADIUS],
        '_$f56f9b43ac8287ccc401c21f': arg[BALL_RECORD_PTR],
        '_$734363e3b20d0a80337163c3': arg[BALL_RECORD_SUPER],
        speed: arg[BALL_RECORD_SPEED],
        travelType: arg[BALL_RECORD_TRAVEL],
      };
    }
    if (mode === 54397) {
      return {
        mode: BALL_STATUS_LABELS[statusIndex],
        '_$318e774f577f9afc8b95ce22':
          ballScan ? ballScan[BALL_RECORD_RANGE] : 0,
        '_$b38091f1ff88ae1c3f5fbe69':
          ballScan ? ballScan[BALL_RECORD_RADIUS] : 0,
        '_$e05048a72a2f6429d78842e1':
          ballScan ? ballScan[BALL_RECORD_SPEED] : 0,
        ball: ballRecord ? { ...ballRecord } : ballRecord,
        goal: goalRecord ? { ...goalRecord } : goalRecord,
        '_$facb0b9161800618215c7b9b': paused,
        '_$6702b356ca251f62e1f6cff5': mark ? { ...mark } : mark,
        battle: battleKey,
      };
    }
    if (mode === 53669) {
      return !!(override ||
        inputGate['_$9b5fe44f7c935bfb890bcb65']() ||
        (inputGate['_$6c469dfb2ddb1688dfd11754'] &&
          inputGate['_$6c469dfb2ddb1688dfd11754'](BALL_INPUT_FLAGS[5])) ||
        (deps['_$d556cf8b61f8821e61fa2a87'] &&
          deps['_$d556cf8b61f8821e61fa2a87']()));
    }
    return undefined;
  }

  function readBallRecord(scan) {
    return ballDispatch(60920, scan);
  }

  function scanObjective(now, provided) {
    if (disposed) return null;
    const motion = provided === undefined
      ? inputGate['_$8909080e7460c4c9d13103f4'](100)
      : provided;
    if (!motion || !motion['_$f846c8d5ebac9d78eb10094e'] ||
        !motion['_$f846c8d5ebac9d78eb10094e']
          ['_$528d9b3e2016a372636f303c']) {
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
    const world = motion['_$f846c8d5ebac9d78eb10094e'];
    if (world['_$528d9b3e2016a372636f303c'] === counterA) return undefined;
    counterA = world['_$528d9b3e2016a372636f303c'];
    counters[1]++;

    const rawBall = world.ball;
    const ball = rawBall && Number.isFinite(rawBall.x) &&
      Number.isFinite(rawBall.y) ? rawBall : null;
    paused = (world['_$318627662c00525b8396ba45'] === true);

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
        radius: ball.radius || 60,
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
          motion['_$f846c8d5ebac9d78eb10094e'].ownCharacter)) {
      return false;
    }
    const world = motion['_$f846c8d5ebac9d78eb10094e'];
    const stateByte =
      world.ownCharacter.add(values[BALL_VALUES_STATE]).readU8();
    if (stateByte !== 1) return false;
    if (!!getNative(19, 'bool', ['pointer'])(world.ownCharacter) !==
      !!ballScan[BALL_RECORD_SUPER]) {
      return false;
    }
    if (world['_$5cdf233d1f0533b803925e62'] === false) return false;
    if (!world['_$9d4347156302d81acf9ba18e']) return false;
    if (Date.now() - world['_$528d9b3e2016a372636f303c'] >
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
    const world = motion['_$f846c8d5ebac9d78eb10094e'];
    const scan = ballScan;
    if (!scan || !isUsablePointer(scan[BALL_RECORD_PTR]) ||
        !isUsablePointer(seedPtr) ||
        !isUsablePointer(world.ownCharacter) ||
        !world['_$318627662c00525b8396ba45']) {
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
        '_$8aac275e9efd9df08bf4e497': samples,
        x: shotX,
        y: shotY,
        '_$7c3ed73d9ad0cba36b5f85d5': { x: ownX, y: ownY },
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
    const world = motion['_$f846c8d5ebac9d78eb10094e'];
    const entities = [];
    for (const entity of world['_$af0b510be1001a7fe0745937'] || []) {
      entities[entities.length] = entity;
    }
    for (const projectile of world['_$97f3931e41a39623e7fd15f6'] || []) {
      entities[entities.length] = projectile;
    }
    const plan = solvePlan(
      shot['_$8aac275e9efd9df08bf4e497'], goalRecord,
      readBallRecord(ballScan), entities);
    if (!plan) return null;
    return Object.assign(plan, {
      x: shot.x,
      y: shot.y,
      '_$7c3ed73d9ad0cba36b5f85d5': shot['_$7c3ed73d9ad0cba36b5f85d5'],
      '_$1516bfd127113e7a34d79575': angle,
      at: now,
      '_$a5fa94f845791b9de23e2996': String(seedPtr),
      battle: String(motion.battle),
      '_$c62c7d7675dd2c6e78448d06': String(world.ball && world.ball.gid),
      super: ballScan[BALL_RECORD_SUPER],
    });
  }

  function refreshPlan(motion, seedPtr, now) {
    if (!isShotReady(motion) || !activePlan ||
        activePlan['_$a5fa94f845791b9de23e2996'] !== String(seedPtr) ||
        activePlan.battle !== String(motion.battle) ||
        activePlan['_$c62c7d7675dd2c6e78448d06'] !==
          String(motion['_$f846c8d5ebac9d78eb10094e'].ball &&
            motion['_$f846c8d5ebac9d78eb10094e'].ball.gid) ||
        activePlan.super !== ballScan[BALL_RECORD_SUPER] ||
        now - activePlan.at > BALL_PLAN_MS) {
      activePlan = null;
      return null;
    }
    const next = buildPlan(
      motion, seedPtr, activePlan['_$1516bfd127113e7a34d79575'], now);
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
      const world = motion['_$f846c8d5ebac9d78eb10094e'];

      const key = [
        battleKey,
        world.ball.gid,
        ballScan[BALL_RECORD_SUPER],
        goalRecord['_$b332efb2c410f54ac71eb519'],
        goalRecord['_$4e18173a38b4a39e59b422bb'],
        goalRecord['_$58430fd8e1966f9f86da588d'],
        goalRecord['_$ce0e7d6f91bd18cc76b02fdc'],
        goalRecord['_$68e51a48152985c305e10cb0'],
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
          x: world['_$9b2f2ebaccfa50d0600446ce'],
          y: world['_$ac68381d82cf0eedd9c6a20a'],
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

      const slot = inputGate['_$77f59e9cd494da780b769563']();
      if (slot && validateSlot(slot) !== 5) return undefined;
      if (!inputGate['_$a0e27a7cb561024288852db2'](
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
        at - motion['_$f846c8d5ebac9d78eb10094e']
          ['_$528d9b3e2016a372636f303c'] > BALL_WORLD_MS) {
      return false;
    }
    const world = motion['_$f846c8d5ebac9d78eb10094e'];
    const ownCharacter = world.ownCharacter;
    if (!isUsablePointer(ownCharacter) ||
        ownCharacter.add(values[BALL_VALUES_STATE]).readU8() !== 1 ||
        world['_$5cdf233d1f0533b803925e62'] === false) {
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
          const path = tracker['_$4db7ddfaa51628503ec7c4a9'](
            {
              x: motion['_$f846c8d5ebac9d78eb10094e']
                ['_$9b2f2ebaccfa50d0600446ce'],
              y: motion['_$f846c8d5ebac9d78eb10094e']
                ['_$ac68381d82cf0eedd9c6a20a'],
            },
            mark,
            motion['_$b11b5e14c741fc4cdea61960'],
            motion['_$f846c8d5ebac9d78eb10094e']
              ['_$26b6329ef32390aec0c3ddb2'],
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
        x: snapshot ? snapshot['_$f846c8d5ebac9d78eb10094e']
          ['_$9b2f2ebaccfa50d0600446ce'] : undefined,
        y: snapshot ? snapshot['_$f846c8d5ebac9d78eb10094e']
          ['_$ac68381d82cf0eedd9c6a20a'] : undefined,
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
    if (override && inputGate['_$22320225cdd7c427d4b8d3cb']) {
      inputGate['_$22320225cdd7c427d4b8d3cb'](BALL_INPUT_FLAGS[5]);
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
        warmNatives([13]);
        attachHook(2, 13, {
          onEnter: ballHookHandlers.trajectoryA.onEnter,
          onLeave: ballHookHandlers.trajectoryA.onLeave,
        });
      }
      if (!hooks.has(3)) {
        warmNatives([14, 15]);
        attachHook(3, 14, {
          onEnter: ballHookHandlers.trajectoryB.onEnter,
          onLeave: ballHookHandlers.trajectoryB.onLeave,
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
        if (inputGate['_$22320225cdd7c427d4b8d3cb']) {
          inputGate['_$22320225cdd7c427d4b8d3cb'](BALL_INPUT_FLAGS[5]);
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
      '_$0e3ac2d8132c986cec708e5b': override,
      disposed: disposed,
      trickshot: {
        mode: normalizeMode(trickshotModeValue),
        status: TRICKSHOT_MODE_TABLE[trickshotMode],
        '_$a98a2cd19b0bb14864033c19': lastMoveAt,
        '_$184d4b7cb933ff924596e975': seedPointer,
        '_$9aaf7807f2beb73bf5bac405': getTrickshotStatus(),
        ...currentFlags(),
      },
      '_$9aaf7807f2beb73bf5bac405': tracker.getState(),
      '_$00048fca42ad884e02edbca3': goalStats ? { ...goalStats } : goalStats,
      '_$c4ded82d77ca3ddba3c08633': Array.from(actorCache.keys())
        .map(mapActorKey),
      ...Object.fromEntries(
        BALL_COUNTER_KEYS.map((key, index) => [key, counters[index]])),
      lastError: lastError,
    };
  }

  function aimAtGoal(seedPtr, target, budget) {
    return aimAtGoalSolver(seedPtr, target, budget, {
      scanObjective: scanObjective,
      goalRecord: goalRecord,
      paused: paused,
      ballScan: ballScan,
    });
  }

  function followObjectivePath(target, angle, budget) {
    return followObjectivePathSolver(target, angle, budget, {
      scanObjective: scanObjective,
      tracker: tracker,
    });
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
    '_$1458b5e5e1ba5d16cc261b4d': setEnabled,
    '_$514b2e44ae09fa0ecd67bd1d': setOverride,
    '_$c6ca8052007e2c68b9ae8264': applySaved,
    dispose: dispose,
    objective: objective,
    '_$bc76004c92d2d0c6739cb535': followObjectivePath,
    '_$47f9b36ab3340267421e67eb': aimAtGoal,
    '_$b8a7ccdbc227265b239e0ecd': aimRedirectAndFire,
    tick: tick,
    '_$e694ae8516d24dc416980e75': executeShot,
    '_$b0d4194ac6ed30fa2e422965': getTrickshotStatus,
    '_$6d69041b3aa94b9618079139': refreshFlags,
    '_$da4ce6f628bcda383190531b': resetBallState,
    '_$e1e1c61271274185cae840f6': setMode,
    '_$814748ecc47856e7b144daa6': getState,
  };

  return api;
}
