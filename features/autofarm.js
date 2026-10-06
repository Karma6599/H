'use strict';

const STATUS = ['idle', 'running', 'paused', 'unavailable'];

const PHASES = [
  'idle',
  'retreat',
  'cover',
  'objective',
  'ball',
  'shot',
  'pass',
  'zone',
  'pickup',
  'move',
  'wait',
  'shoot',
  'engage',
  'search',
  'yield',
  'dodge',
  'evade',
  'critical-retreat',
  'ball-shot',
  'ball-release',
  'carry-ball',
  'defend-ball',
  'support-ball',
  'collect-ball',
  'defend-goal',
  'support',
  'hold',
  'kite',
  'approach',
  'spawn',
];

const REASONS = [
  'off',
  'error',
  'farming',
  'waiting-result',
  'waiting-home',
  'home-ready',
  'target-complete',
  'selection-required',
  'waiting-selection',
  'character-selected',
  'select-retry',
  'matchmaking',
  'start-retry',
  'ready',
  'waiting-spawn',
  'starting',
  'disposed',
];

const SESSION_KEYS = [
  'startedAt',
  'wins',
  'losses',
  'trophyDelta',
  'matches',
  'battleStartTrophies',
  'currentTrophies',
  'currentCharacter',
  'lastDelta',
];

const COUNTER_KEYS = [
  'ticks',
  'moves',
  'shots',
  'dodgeYields',
  'retreats',
  'coverMoves',
  'objectiveMoves',
  'ballShots',
  'passes',
];

const IDX_SESSION_STARTED_AT = 0;
const IDX_SESSION_WINS = 1;
const IDX_SESSION_LOSSES = 2;
const IDX_SESSION_TROPHY_DELTA = 3;
const IDX_SESSION_MATCHES = 4;
const IDX_SESSION_BATTLE_START_TROPHIES = 5;
const IDX_SESSION_CURRENT_TROPHIES = 6;
const IDX_SESSION_CURRENT_CHARACTER = 7;
const IDX_SESSION_LAST_DELTA = 8;

const IDX_FARM_PHASE_A = 0;
const IDX_FARM_PHASE_B = 1;
const IDX_FARM_TARGET = 2;
const IDX_FARM_REASON = 3;
const IDX_FARM_EXTRA = 4;
const IDX_FARM_COUNTERS = 5;

const IDX_OPTIONS_TARGET = 0;
const IDX_OPTIONS_SELECTED = 1;
const IDX_OPTIONS_AUTO_SWITCH = 2;
const IDX_OPTIONS_AUTO_START = 3;
const IDX_OPTIONS_AUTO_RESTART = 4;
const IDX_OPTIONS_ATTACK = 5;
const IDX_OPTIONS_FOLLOW = 6;
const IDX_OPTIONS_INTERVAL = 7;

const REC_SLOT_INFO = 4728;
const REC_SLOT_ID = 2425;
const REC_SLOT_IDX = 5732;
const REC_SLOT_NAME = 5017;
const REC_ENTITY_X = 1577;
const REC_ENTITY_Y = 1804;
const REC_ENTITY_ALIVE = 2724;
const REC_ENTITY_CLASS = 1292;
const REC_ENTITY_GONE = 4965;
const REC_ENTITY_FROZEN = 5281;
const REC_ENTITY_HP = 2387;
const REC_ENTITY_MAX_HP = 2398;
const REC_ENTITY_SPEED = 2395;
const REC_ENTITY_TARGET = 5434;
const REC_OWN_X = 2722;
const REC_OWN_Y = 3532;
const REC_ENEMY_CLASSES = [8, 10, 11, 12];

const GAME_PHASE_ACTIVE = 22;

const REASON_OFF = 0;
const REASON_ERROR = 1;
const REASON_FARMING = 2;
const REASON_WAITING_RESULT = 3;
const REASON_WAITING_HOME = 4;
const REASON_HOME_READY = 5;
const REASON_TARGET_COMPLETE = 6;
const REASON_SELECTION_REQUIRED = 7;
const REASON_WAITING_SELECTION = 8;
const REASON_CHARACTER_SELECTED = 9;
const REASON_SELECT_RETRY = 10;
const REASON_MATCHMAKING = 11;
const REASON_START_RETRY = 12;
const REASON_READY = 13;
const REASON_WAITING_SPAWN = 14;
const REASON_STARTING = 15;
const REASON_DISPOSED = 16;

const PHASE_WAIT = 10;
const PHASE_SPAWN = 29;

const MENU_SETTLE_MS = 350;
const REFRESH_BRAWLERS_MS = 5000;
const POLL_THROTTLE_MS = 750;
const RESULT_ANCHOR_MS = 2400;
const FOLLOW_DELAY_MS = 2000;
const TARGET_BLACKLIST_MS = 12000;
const RETRY_BACKOFF_BASE_MS = 15000;
const RETRY_BACKOFF_MAX_MS = 60000;
const RETRY_BACKOFF_MAX_EXP = 2;

function createAutoFarm(deps) {
  function runtimeTotal() {
    return lastStopRuntime + (startedAt === null ? 0 : Math.max(0, Date.now() - startedAt));
  }

  function stop() {
    lastStopRuntime = runtimeTotal();
    startedAt = null;
    return undefined;
  }

  function setReason(code) {
    if (reasonCode !== code) {
      reasonCode = code;
      revision++;
      if (code === REASON_TARGET_COMPLETE) {
        logEvent({ 0: 4, 1: options[IDX_OPTIONS_TARGET] });
      }
    }
    return undefined;
  }

  function reportError(e) {
    lastError = String(e && e.message || e).slice(0, 200);
    logEvent({ 0: 2, 1: lastError });
    setReason(REASON_ERROR);
    return undefined;
  }

  function getBrawlerViews() {
    return brawlers.map(toBrawlerView);
  }

  function toBrawlerView(entry) {
    var id = entry.id;
    var name = entry.name;
    var trophies = entry.trophies;
    var level = entry.level;
    var powerField = entry['_$785d5ef00166ecb2b43c23ed'];
    var unlockField = entry['_$245628981788bf6021e19fac'];
    var released = entry.released;
    return {
      id: id,
      name: name,
      trophies: trophies,
      level: level,
      _$785d5ef00166ecb2b43c23ed: powerField,
      _$245628981788bf6021e19fac: unlockField,
      released: released,
      selected: options[IDX_OPTIONS_SELECTED].includes(id),
    };
  }

  function refreshBrawlers(force) {
    var now = Date.now();
    if (!force && now - lastRefreshAt < REFRESH_BRAWLERS_MS) return brawlers;
    lastRefreshAt = now;
    var raw = engine['_$98706144ef6b6cdb9e9923df'](force);
    if (raw.length) {
      var snapshot = JSON.stringify(getBrawlerViews());
      brawlers = raw;
      var current = brawlers.find(findCurrentEntry);
      if (current) {
        session[IDX_SESSION_CURRENT_TROPHIES] = current['call_arg_940_32'];
        session[IDX_SESSION_CURRENT_CHARACTER] = current.name;
      }
      if (snapshot !== JSON.stringify(getBrawlerViews())) revision++;
    }
    return brawlers;
  }

  function readPosition(rec) {
    if (Number.isFinite(rec && rec['capture_2395']) && Number.isFinite(rec && rec[REC_ENTITY_MAX_HP])) {
      return [rec['capture_2395'], rec[REC_ENTITY_MAX_HP]];
    }
    try {
      var native = rec['array_904'];
      if (native && typeof native.add === 'function') {
        var x = native.add(GRID_OFFSET_X).readS32();
        var y = native.add(GRID_OFFSET_Y).readS32();
        if (x > 0 && y >= 0 && y <= x * 2) {
          return [x, y];
        }
      }
    } catch (e) {
      return [-1, -1];
    }
    return [-1, -1];
  }

  function isEntityUsable(a, b) {
    return !!a
      && Number.isFinite(a[REC_ENTITY_X])
      && Number.isFinite(a[REC_ENTITY_Y])
      && a[REC_ENTITY_GONE] !== false
      && Number.isFinite(a['capture_2395'])
      && a['capture_2395'] > 0
      && (a[REC_ENTITY_FROZEN] === true || !a[REC_ENTITY_CLASS] || REC_ENEMY_CLASSES.includes(a[REC_ENTITY_CLASS]))
      && !(b && b[REC_ENTITY_TARGET] && entityName(a) === entityName(b[REC_ENTITY_TARGET]))
      && !(Number.isInteger(a['object_check_52']) && Number.isInteger(b[2726]) && a['object_check_52'] === b[2726]);
  }

  function isEnemyEntity(a, b) {
    var usable = isEntityUsable(a, b);
    return usable
      && (a[REC_ENTITY_CLASS] === 8
        || a[REC_ENTITY_CLASS] === 10
        || a[REC_ENTITY_FROZEN] === true
        || !a[REC_ENTITY_CLASS]);
  }

  function entityName(e) {
    return String(e && (e['capture_2435'] !== null && e['capture_2435'] !== undefined
      ? e['capture_2435']
      : e[REC_SLOT_ID] !== null && e[REC_SLOT_ID] !== undefined
        ? e[REC_SLOT_ID]
        : e[REC_SLOT_NAME] !== null && e[REC_SLOT_NAME] !== undefined
          ? e[REC_SLOT_NAME]
          : ''));
  }

  function registerLabel(x) {
    var i = memoryLabels.indexOf(x);
    if (i < 0) {
      i = memoryLabels.length;
      memoryLabels.push(x);
    }
    return -1 - i;
  }

  function dispatch(mode, a, b) {
    switch (mode) {
      case 50848:
        return readPosition({ ptr: a['object_check_23'], hp: a[REC_ENTITY_HP], maxHp: a[REC_ENTITY_MAX_HP] });
      case 12599:
        return lastStopRuntime + (startedAt === null ? 0 : Math.max(0, Date.now() - startedAt));
      case 2020:
        return entityName(a);
      case 28068:
        return isEntityUsable(a, b);
      case 19399:
        return isEnemyEntity(a, b);
      case 14136:
        return a >= 0 ? 'sector:' + a : 'memory:' + memoryLabels[-1 - a];
      default:
        return undefined;
    }
  }

  function updateFarm(phaseA, phaseB, target, reason, extra) {
    var oldA = farm[IDX_FARM_PHASE_A];
    var oldB = farm[IDX_FARM_PHASE_B];
    var oldT = farm[IDX_FARM_TARGET];
    var oldR = farm[IDX_FARM_REASON];
    revision++;
    farm[IDX_FARM_PHASE_A] = phaseA === undefined ? oldA : phaseA;
    farm[IDX_FARM_PHASE_B] = phaseB === undefined ? oldB : phaseB;
    farm[IDX_FARM_TARGET] = target;
    farm[IDX_FARM_REASON] = reason;
    farm[IDX_FARM_EXTRA] = extra;
    return undefined;
  }

  function tryMove(battle, x, y, useMax) {
    try {
      var mover = battle[5505];
      if (mover && mover['_$9bd9ec1d23e38e503beb4bd7']() && mover['_$f7c30d51cf08aedbf4c036af']()) {
        return mover['_$735ecb99890a46f30c70f919'](
          x,
          y,
          Math.max(1, battle[REC_SLOT_INFO][2723] || 60),
          useMax || mover[5097]
        );
      }
    } catch (e) {
      return true;
    }
    return undefined;
  }

  function installBattleHook() {
    if (deps[6029] && typeof deps[6029]['call_arg_1571_5'] === 'function') {
      deps[6029]['_$514b2e44ae09fa0ecd67bd1d'](false);
    }
    hook = engine['install'](
      '_$b1c1fd9b08c939a58752485f',
      tick,
      '_$9ddd79a3d86c3ad16c7dd44b',
      deps['call_arg_118_14']['_$9ddd79a3d86c3ad16c7dd44b'],
      '_$2c8df886ef4dd948d6d253ae',
      options[IDX_OPTIONS_INTERVAL],
      '_$9eeae86f99566aed4d53508f'
    );
    return undefined;
  }

  function skipResults(battle, now) {
    if (!skipInFlight) return true;
    if (gate['call_arg_754_34'] || gate['_$65b3440634fedfa37cf93dc8']()) return false;
    if (gate['call_arg_118_21'] && !gate['_$2b1d9859a05368f4f18995bd'](3, 180)) return false;
    var slotInfo = battle[REC_SLOT_INFO];
    if (!engine['move'](battle, slotInfo[REC_OWN_X], slotInfo[REC_OWN_Y])) {
      if (gate['fn_2461']) gate['_$22320225cdd7c427d4b8d3cb'](3);
      return false;
    }
    skipInFlight = null;
    skipRequestedAt = now;
    if (gate['fn_2461']) gate['_$22320225cdd7c427d4b8d3cb'](3);
    return true;
  }

  function clearBattle() {
    firstSeenAt = 0;
    spawnAnchor = null;
    followAnchor = 0;
    zoneLabel = null;
    zoneKeys = null;
    seenEntities.clear();
    ctx.reset();
    followTarget = null;
    followTargetId = null;
    nearestEnemy = null;
    farthestReach = -Infinity;
    moveTarget = null;
    moveKeys = null;
    jitter = 0;
    reconnected = false;
    targetCounts.clear();
    memoryLabels.length = 0;
    throttle.reset();
    followCounters.clear();
    followKeys.clear();
    return undefined;
  }

  function joinBattle(battle) {
    var slotInfo = battle[REC_SLOT_INFO];
    if (Number.isInteger(slotInfo['call_arg_494_3']) && slotInfo['call_arg_494_3'] >= 0 && slotInfo['call_arg_494_3'] < 512) {
      selectBrawler(slotInfo['call_arg_494_3'], slotInfo[5256] ? brawlerNameById(slotInfo['call_arg_494_3'], slotInfo[5256]) : '');
      return undefined;
    }
    if (slotInfo['call_arg_494_3'] !== undefined) {
      selectBrawler(-1, slotInfo[5256] ? brawlerNameByRef(slotInfo[5256], -1) : '');
    }
    return undefined;
  }

  function selectBrawler(idx, name) {
    var ok = Number.isInteger(idx) && idx >= 0 && idx < 512;
    if (!ok) return undefined;
    var entry = brawlers.find(findById);
    if (!entry) return undefined;
    var charName = entry.name;
    var trophies = entry['call_arg_940_32'];
    if (selectedIdx !== idx || session[IDX_SESSION_CURRENT_CHARACTER] !== charName || session[IDX_SESSION_CURRENT_TROPHIES] !== trophies) {
      selectedIdx = idx;
      session[IDX_SESSION_CURRENT_CHARACTER] = charName;
      session[IDX_SESSION_CURRENT_TROPHIES] = trophies;
      revision++;
    }
    return undefined;
  }

  function beginFollowBattle(battle, now) {
    clearBattle();
    currentKey = String(battle[5467]);
    joinBattle(battle);
    prevBrawlerIdx = selectedIdx;
    var entry = brawlers.find(findByPrevIdx);
    session[IDX_SESSION_BATTLE_START_TROPHIES] = entry ? entry['call_arg_940_32'] : -1;
    reconnected = false;
    selectedIdx = -1;
    gadgetWindow = 0;
    setReason(REASON_FARMING);
    updateFarm(PHASE_WAIT, PHASE_SPAWN, null, 26, Date.now());
    battleSince = 0;
    return undefined;
  }

  function updateBattleTrophies() {
    var entry = brawlers.find(findByPrevIdx);
    var active = !!entry && session[IDX_SESSION_BATTLE_START_TROPHIES] >= 0;
    if (active) {
      var delta = entry['call_arg_940_32'] - session[IDX_SESSION_BATTLE_START_TROPHIES];
      session[IDX_SESSION_LAST_DELTA] = delta;
      session[IDX_SESSION_TROPHY_DELTA] = (session[IDX_SESSION_TROPHY_DELTA] === null || session[IDX_SESSION_TROPHY_DELTA] === undefined ? 0 : session[IDX_SESSION_TROPHY_DELTA]) + delta;
      if (delta > 0) session[IDX_SESSION_WINS] = session[IDX_SESSION_WINS] + 1;
      else if (delta < 0) session[IDX_SESSION_LOSSES] = session[IDX_SESSION_LOSSES] + 1;
    }
    session[IDX_SESSION_BATTLE_START_TROPHIES] = active ? entry['call_arg_940_32'] : -1;
    return active;
  }

  function start() {
    if (disposed) throw Error('Auto Farm disposed');
    started = true;
    return api;
  }

  function setEnabled(on) {
    if (disposed) throw Error('Auto Farm disposed');
    if (!started) api.start();
    var want = !!on;
    if (want === enabled) return enabled;
    enabled = want;
    revision++;
    if (enabled) {
      startedAt = Date.now();
      session[IDX_SESSION_STARTED_AT] = session[IDX_SESSION_STARTED_AT] || startedAt;
      lastError = null;
      try {
        setReason(REASON_STARTING);
      } catch (e) {
        stop();
        enabled = false;
        cleanup();
        reportError(e);
      }
    } else {
      stop();
      cleanup();
      setReason(REASON_OFF);
    }
    return enabled;
  }

  function setOptions(patch) {
    options = parseOptions(applySettings(serializeOptions(options), patch));
    revision++;
    if (selectedIdx >= 0 && options[IDX_OPTIONS_SELECTED].length && !options[IDX_OPTIONS_SELECTED].includes(selectedIdx)) {
      selectedIdx = -1;
    }
    return {
      ...serializeOptions(options),
      selectedCharacters: [...options[IDX_OPTIONS_SELECTED]],
      selectedBrawlers: [...options[IDX_OPTIONS_SELECTED]],
      attack: options[IDX_OPTIONS_ATTACK],
      follow: followLabel(options[IDX_OPTIONS_FOLLOW]),
      autoSwitch: options[IDX_OPTIONS_AUTO_SWITCH],
    };
  }

  function poll(force) {
    if (force === undefined) force = false;
    if (disposed) return [];
    try {
      if (force === true || Date.now() - lastRefreshAt >= POLL_THROTTLE_MS) {
        refreshBrawlers(true, force === true);
      }
    } catch (e) {
      reportError(e);
    }
    return getBrawlerViews();
  }

  function getTimings() {
    return {
      _$fc173d49c1cb34effb0d77f1: firstSeenAt ? Math.max(0, Date.now() - firstSeenAt) : 0,
      _$e60f0ad6faf3d9ba0a4ff5d1: followAnchor,
      _$cc0099f13af4944a3117abd1: gamePhase,
      _$192fb677c15ae506902345a0: retryOkCount,
      _$e8720c0b26835c8f5ce08de0: battle && battle[REC_SLOT_INFO] ? Math.max(0, Date.now() - battle[REC_SLOT_INFO][REC_OWN_Y]) : null,
    };
  }

  function mapCounterEntry(name, i) {
    return { 0: name, 1: farm[IDX_FARM_COUNTERS][i] };
  }

  function mapSessionEntry(name, i) {
    return { 0: name, 1: session[i] };
  }

  function getState() {
    var runtimeMs = runtimeTotal();
    var totalMatches = session[IDX_SESSION_WINS] + session[IDX_SESSION_LOSSES];
    var status;
    if (!enabled) {
      status = STATUS[0];
    } else if (reasonCode === 1) {
      status = 'unavailable';
    } else if (reasonCode === 13 || reasonCode === 6) {
      status = 'paused';
    } else {
      status = 'running';
    }
    var plan = {
      _$02ba24c1a53c7d4d51555801: PHASES[farm[IDX_FARM_PHASE_A]],
      phase: PHASES[farm[IDX_FARM_PHASE_B]],
      target: farm[IDX_FARM_TARGET],
      reason: farm[IDX_FARM_REASON] + 1,
      _$668024f76431ae04690f70bf: farm[IDX_FARM_EXTRA],
      _$9d77b14fac7a1211990eb2e1: Object.fromEntries(COUNTER_KEYS.map(mapCounterEntry)),
    };
    return {
      _$63be9aca05f57f6cf9d7e4df: started,
      enabled: enabled,
      disposed: disposed,
      revision: revision,
      status: status,
      _$6efc9ae1149d626e5ff2b31b: REASONS[reasonCode],
      lastError: lastError,
      options: {
        ...serializeOptions(options),
        selectedCharacters: [...options[IDX_OPTIONS_SELECTED]],
        selectedBrawlers: [...options[IDX_OPTIONS_SELECTED]],
        attack: options[IDX_OPTIONS_ATTACK],
        follow: followLabel(options[IDX_OPTIONS_FOLLOW]),
        autoSwitch: options[IDX_OPTIONS_AUTO_SWITCH],
      },
      _$45345448a194f2a58b520758: getBrawlerViews(),
      _$05ec49aa245383348d1cac58: typeof engine['call_arg_1532_6'] === 'function' ? engine['_$077067910d6da412e59a307d']() : undefined,
      _$42dff362b2a786e5a82f1f83: selectedIdx,
      stats: {
        ...Object.fromEntries(SESSION_KEYS.map(mapSessionEntry)),
        battles: session[IDX_SESSION_MATCHES],
        trophies: session[IDX_SESSION_TROPHY_DELTA],
        runtimeMs: runtimeMs,
        status: status,
        winRate: totalMatches ? Math.round(session[IDX_SESSION_WINS] * 100 / totalMatches) : 0,
      },
      plan: plan,
    };
  }

  function resetStats() {
    cycleCount = 0;
    if (enabled) {
      startedAt = Date.now();
      session[IDX_SESSION_STARTED_AT] = startedAt === null ? 0 : startedAt;
      session[IDX_SESSION_WINS] = 0;
      session[IDX_SESSION_LOSSES] = 0;
      session[IDX_SESSION_TROPHY_DELTA] = 0;
      session[IDX_SESSION_MATCHES] = 0;
      session[IDX_SESSION_LAST_DELTA] = 0;
      session[IDX_SESSION_BATTLE_START_TROPHIES] = -1;
      farm[IDX_FARM_COUNTERS].fill(0);
    }
    revision++;
    return api.getState();
  }

  function dispose() {
    if (disposed) return;
    stop();
    enabled = false;
    cleanup();
    disposed = true;
    started = false;
    setReason(REASON_DISPOSED);
    return undefined;
  }

  function tick() {
    if (!enabled || disposed || ticking) return;
    var now = Date.now();
    if (now - lastTickAt < options[IDX_OPTIONS_INTERVAL]) return;
    lastTickAt = now;
    ticking = true;
    try {
      if (typeof engine['call_arg_1571_10'] === 'function') {
        gamePhase = engine['_$d38631472831ee8c61ada5ce']();
      }
      if (gamePhase !== 0) {
        idleStart = 0;
        if (!inBattleSince) inBattleSince = now;
        if (battle || joining) {
          battle = null;
          joining = false;
          clearBattle();
          if (gate['fn_2461']) gate['_$22320225cdd7c427d4b8d3cb'](3);
          if (gate[5753]) gate['_$371edf41cefa490bf13678bf'](3);
        }
        followAnchor = 0;
        gadgetWindow = 0;
        setReason(REASON_WAITING_HOME);
        if (gamePhase === GAME_PHASE_ACTIVE
          && options[IDX_OPTIONS_AUTO_START]
          && options[IDX_OPTIONS_AUTO_RESTART]
          && now - inBattleSince >= 1500
          && now >= nextRetryAt
          && typeof engine[6028] === 'function') {
          nextRetryAt = now + Math.min(RETRY_BACKOFF_MAX_MS, RETRY_BACKOFF_BASE_MS * Math.pow(RETRY_BACKOFF_MAX_EXP, Math.min(RETRY_BACKOFF_MAX_EXP, ++retryCount)));
          if (engine['_$c9a9e1a7599900ccda418b62']()) {
            retryOkCount++;
            lastRetryOkAt = now;
          }
        }
        return;
      }
      inBattleSince = 0;
      if (!idleStart) idleStart = now;
      if (now - idleStart >= 60000) retryCount = 0;
      var freshBattle = typeof engine['call_arg_1571_9'] === 'function' ? engine['_$4de9456cc438a21076dea802']() : false;
      var anyBattle = freshBattle || engine['_$4cb26d224db7394fc9cd96ef']();
      if (freshBattle || anyBattle) {
        if (joining) {
          reconnected = true;
          joining = false;
          clearBattle();
        }
        battle = null;
        if (freshBattle) {
          followAnchor = 0;
          gadgetWindow = 0;
          lastGadgetAt = 0;
          setReason(REASON_WAITING_RESULT);
          if (options[IDX_OPTIONS_AUTO_START]
            && options[IDX_OPTIONS_AUTO_RESTART]
            && now - lastRetryOkAt >= 300) {
            lastRetryOkAt = now;
            engine['_$fe75ec1a10bd4566217717e6']();
          }
          return;
        }
        menuTick(now);
        return;
      }
      var hasResult = !!(battle && battle[REC_SLOT_INFO] && battle[REC_SLOT_INFO]['object_check_23']);
      var resultAt = Number(battle && battle[REC_SLOT_INFO] && battle[REC_SLOT_INFO][REC_OWN_Y]);
      if (hasResult
        && Number.isFinite(resultAt)
        && (resultAt <= 0 || now - resultAt > Math.max(500, options[IDX_OPTIONS_INTERVAL] * 5))) {
        hasResult = false;
      }
      var pendingResult = null;
      if (deps[6029]) {
        if (typeof deps[6029]['call_arg_1571_8'] !== 'function') {
          if (typeof deps[6029]['array_913'] === 'function') {
            var hookState = deps[6029].getState();
            if (hookState && typeof hookState[2581] === 'boolean') {
              pendingResult = hookState[2581];
            }
          }
        } else {
          pendingResult = deps[6029]['_$0cb1e6e12110cb6253361dd5']();
        }
      }
      if (pendingResult === true && !hasResult) {
        setReason(REASON_WAITING_SPAWN);
        return;
      }
      var doResult = hasResult && (pendingResult === null ? true : pendingResult);
      if (doResult) {
        if (!joining && currentKey !== String(battle[5467])) {
          beginFollowBattle(battle);
        }
        joining = true;
        joinBattle(battle);
        if (options[IDX_OPTIONS_AUTO_START]
          && options[IDX_OPTIONS_AUTO_RESTART]
          && typeof engine[6030] === 'function'
          && engine['_$bfb17577a7d7ce39f624c757']()) {
          if (!lastGadgetAt) lastGadgetAt = now;
          if (now - lastGadgetAt >= 400
            && now - lastSuperAt >= 1500
            && typeof engine['call_arg_1571_7'] === 'function') {
            lastSuperAt = now;
            engine['_$60894cda100942d3c8f19083']();
          }
          return;
        }
        lastGadgetAt = 0;
        var resultKey = currentKey + ':' + (Number.isFinite(resultAt) ? resultAt : lastPickAt);
        if (resultKey === lastResultKey) return;
        lastResultKey = resultKey;
        processBattleResult(battle, now);
        finalizeBattle(battle, now);
        return;
      }
      if (joining) {
        reconnected = true;
        setReason(REASON_WAITING_RESULT);
        joining = false;
        clearBattle();
      }
      if (!hasResult) battle = null;
      menuTick(now);
      return;
    } catch (e) {
      reportError(e);
    } finally {
      ticking = false;
    }
  }

  function menuTick(now) {
    if (!engine['_$4cb26d224db7394fc9cd96ef']()) {
      battleSince = 0;
      setReason(reconnected ? REASON_WAITING_RESULT : REASON_WAITING_HOME);
      return;
    }
    if (!battleSince) {
      battleSince = now;
      setReason(REASON_HOME_READY);
      return;
    }
    if (now - battleSince < MENU_SETTLE_MS) return;
    refreshBrawlers(reconnected || now - lastRefreshAt >= POLL_THROTTLE_MS, reconnected);
    if (reconnected) {
      updateBattleTrophies();
      reconnected = false;
    }
    var canSelectSlot = typeof engine['call_arg_1571_12'] === 'function';
    if (canSelectSlot) {
      selectBrawler(engine['_$3da9401690a091035152af16']());
    }
    var current = brawlers.find(findCurrentEntry);
    var pick = pickBrawler(brawlers, options, selectedIdx);
    if (!pick) {
      setReason(REASON_TARGET_COMPLETE);
      return;
    }
    if (!options[IDX_OPTIONS_AUTO_SWITCH]) {
      if ((!current || !current['call_arg_940_33'])
        && current[REC_SLOT_IDX] === false
        && current['call_arg_940_32'] >= options[IDX_OPTIONS_TARGET]
        && options[IDX_OPTIONS_SELECTED].length
        && !options[IDX_OPTIONS_SELECTED].includes(current[REC_SLOT_ID])) {
        setReason(REASON_SELECTION_REQUIRED);
        return;
      }
      selectedIdx = -1;
      var keep = brawlers.find(findPickEntry);
      if (!keep) return;
      if (options[IDX_OPTIONS_AUTO_START]
        && options[IDX_OPTIONS_AUTO_RESTART]
        && session[IDX_SESSION_MATCHES] === 0) {
        if (now < gadgetWindow || now - lastSuperAt < 700) return;
        if (engine['_$6975f2a66b3886417ebe1eb1']()) {
          lastSuperAt = now;
          gadgetWindow = now + 10000;
          setReason(REASON_MATCHMAKING);
          return;
        }
        lastSuperAt = now;
        setReason(REASON_START_RETRY);
        return;
      }
      setReason(REASON_READY);
      return;
    }
    if (!current || current[REC_SLOT_ID] !== pick[REC_SLOT_ID]) {
      var tooSoon = now - lastSuperAt < 500 || (selectedIdx === pick[REC_SLOT_ID] && now - lastSuperAt < 1500);
      if (tooSoon) {
        setReason(REASON_WAITING_SELECTION);
        return;
      }
      lastSuperAt = now;
      if (!engine['_$0a4631483a85e4a76340aef1'](pick[REC_SLOT_ID])) {
        setReason(REASON_SELECT_RETRY);
        return;
      }
      selectedIdx = pick[REC_SLOT_ID];
      if (canSelectSlot) {
        selectBrawler(pick[REC_SLOT_ID]);
      }
      setReason(REASON_CHARACTER_SELECTED);
      return;
    }
    selectedIdx = -1;
    var next = brawlers.find(findPickEntry);
    if (!next) return;
    if (options[IDX_OPTIONS_AUTO_START]
      && options[IDX_OPTIONS_AUTO_RESTART]
      && session[IDX_SESSION_MATCHES] === 0) {
      if (now < gadgetWindow || now - lastSuperAt < 700) return;
      if (engine['_$6975f2a66b3886417ebe1eb1']()) {
        lastSuperAt = now;
        gadgetWindow = now + 10000;
        setReason(REASON_MATCHMAKING);
        return;
      }
      lastSuperAt = now;
      setReason(REASON_START_RETRY);
      return;
    }
    setReason(REASON_READY);
    return;
  }

  function finalizeBattle(battle, now) {
    var slotInfo = battle[REC_SLOT_INFO];
    if (!slotInfo || slotInfo['fn_1841'] === false || slotInfo[REC_ENTITY_HP] <= 0) return;
    if (!firstSeenAt) firstSeenAt = now;
    if (!spawnAnchor || Math.hypot(slotInfo[REC_OWN_X] - spawnAnchor[0], slotInfo[REC_OWN_Y] - spawnAnchor[1]) >= 40) {
      spawnAnchor = [slotInfo[REC_OWN_X], slotInfo[REC_OWN_Y], now];
    }
    if ((skipInFlight && now - spawnAnchor[2] > RESULT_ANCHOR_MS) || now - followAnchor > FOLLOW_DELAY_MS) {
      if (gate['call_arg_754_34'] || gate['_$65b3440634fedfa37cf93dc8']()) return;
      skipResults(battle, now);
      followTarget = null;
      followTargetId = null;
      nearestEnemy = null;
      throttle.reset();
      followAnchor = now;
      followCount = followCount + 1;
      if (moveTarget) {
        targetCounts.set(moveTarget, REC_OWN_Y, now + TARGET_BLACKLIST_MS);
      }
      moveTarget = null;
      spawnAnchor = [slotInfo[REC_OWN_X], slotInfo[REC_OWN_Y], now];
    }
    if ((now - firstSeenAt < 5000)
      || (now - followAnchor < 1000)
      || options[IDX_OPTIONS_FOLLOW] === 0
      || slotInfo['call_arg_271_4']) {
      return;
    }
    if (gate['call_arg_754_34'] || gate['_$65b3440634fedfa37cf93dc8']()) return;
    if ((slotInfo['capture_2389'] || []).some(isEnemyAlive) || (slotInfo[2791] || []).length) return;
    if ((slotInfo[2730] || []).some(isEnemyInSlot)) return;
    followAnchor = now;
    beginFollowBattle(battle, now);
    if (now - firstSeenAt < 1000) followCount++;
    return;
  }

  function isEnemyAlive(e) {
    return !e[REC_ENTITY_ALIVE];
  }

  function isEnemyInSlot(e) {
    return isEnemyEntity(e, isEnemyInSlot.slotInfo);
  }

  function processBattleResult(battle, now) {
    var slotInfo = battle[REC_SLOT_INFO];
    if (!slotInfo || slotInfo['fn_1841'] === false || slotInfo[REC_ENTITY_HP] <= 0) return undefined;
    if (gate['call_arg_754_34'] && typeof gate['_$65b3440634fedfa37cf93dc8'] === 'function' && gate['_$65b3440634fedfa37cf93dc8']()) return undefined;
    var view = typeof engine['_$4c25a9d3665c3d44671a6b7b'] === 'function' ? engine['_$4c25a9d3665c3d44671a6b7b'](3) : undefined;
    if (!view) return undefined;
    runBattlePlan(battle, view, now);
    return undefined;
  }

  function runBattlePlan(battle, view, now) {
    executeBattlePlan(battle, view, now);
  }

  function findCurrentEntry(e) {
    return e[REC_SLOT_ID] === selectedIdx;
  }

  function findPickEntry(e) {
    return e[REC_SLOT_ID] === selectedIdx;
  }

  function findByPrevIdx(e) {
    return e[REC_SLOT_ID] === prevBrawlerIdx;
  }

  function findById(e) {
    return e[REC_SLOT_ID] === findById.id;
  }

  function cleanup() {
    if (inBattleSince && battle && Date.now() - battle[REC_SLOT_INFO][REC_OWN_Y] < 500
      && !engine['_$4cb26d224db7394fc9cd96ef']()
      && !(engine['call_arg_1571_9'] && engine['_$4de9456cc438a21076dea802']())) {
      skipResults(battle, Date.now());
    }
    if (hook) {
      hook();
      hook = null;
    }
    engine['_$f9114d7e00ca74bd99fe3676']();
    if (deps[6029] && typeof deps[6029]['call_arg_1571_5'] === 'function') {
      deps[6029]['_$514b2e44ae09fa0ecd67bd1d'](false);
    }
    if (deps['call_arg_118_14']['fn_2461']) {
      deps['call_arg_118_14']['_$22320225cdd7c427d4b8d3cb'](3);
    }
    if (deps['call_arg_118_14'][5753]) {
      deps['call_arg_118_14']['_$371edf41cefa490bf13678bf'](3);
    }
    battle = null;
    inBattleSince = false;
    selectedIdx = -1;
    battleSince = 0;
    gadgetWindow = 0;
    clearBattle();
    updateFarm(0, 0, null, 0, Date.now());
    return undefined;
  }

  var api = {
    start: start,
    setEnabled: setEnabled,
    setOptions: setOptions,
    refresh: poll,
    tick: tick,
    getTimings: getTimings,
    getState: getState,
    resetStats: resetStats,
    dispose: dispose,
  };

  if (typeof deps === 'number') {
    var seed = deps & 65535;
  }

  var started = false;
  var enabled = false;
  var disposed = false;
  var revision = 0;
  var startedAt = null;
  var lastError = null;
  var reasonCode = 0;
  var ticking = false;
  var gamePhase = 0;
  var idleStart = 0;
  var inBattleSince = false;
  var joining = false;
  var reconnected = false;
  var battleSince = 0;
  var lastTickAt = 0;
  var lastRefreshAt = 0;
  var lastSuperAt = 0;
  var lastGadgetAt = 0;
  var gadgetWindow = 0;
  var followAnchor = 0;
  var lastResultKey = '';
  var lastPickAt = 0;
  var lastRetryOkAt = 0;
  var nextRetryAt = -Infinity;
  var retryCount = 0;
  var retryOkCount = 0;
  var cycleCount = 0;
  var followCount = 0;
  var currentKey = '';
  var prevBrawlerIdx = -1;
  var selectedIdx = -1;
  var skipInFlight = null;
  var skipRequestedAt = 0;
  var spawnAnchor = null;
  var moveTarget = null;
  var moveKeys = null;
  var followTarget = null;
  var followTargetId = null;
  var nearestEnemy = null;
  var farthestReach = -Infinity;
  var zoneLabel = null;
  var zoneKeys = null;
  var hook = null;
  var battle = null;
  var jitter = 0;
  var brawlers = [];
  var memoryLabels = [];

  if (!deps || !deps['call_arg_118_14']) {
    throw Error('Auto Farm requires base and dodge engine');
  }
  var base = typeof deps[2330] === 'function' ? deps[2330] : function () { return undefined; };
  var engine = deps['capture_1594'] || resolveEngine(resolveBase(global, deps[1420].toString()), base);
  var gate = deps['call_arg_118_14'];
  var ctx = createEngineContext({
    native: base,
    _$82d621c353e8b511991868b6: gate,
    _$d59c5e089e027c280678dbe9: getOptionsSnapshot,
  });
  var throttle = createRateTracker({ _$959ddfbde0867dbe30d9b573: 2, _$18bf150356dd129b8567a861: 1000 });
  var session = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: -1, 6: -1, 7: '', 8: 0, length: 9 };
  var farm = { 0: 0, 1: 0, 2: null, 3: 0, 4: 0, 5: [0, 0, 0, 0, 0, 0, 0, 0, 0], length: 6 };
  var options = normalizeOptionsFrom(deps[6037]);
  var seenEntities = new Map();
  var targetCounts = new Map();
  var followCounters = new Map();
  var followKeys = new Map();

  function getOptionsSnapshot() {
    return serializeOptions(options);
  }

  function executeBattlePlan(battle, view, now) {
    return undefined;
  }

  return api;
}
