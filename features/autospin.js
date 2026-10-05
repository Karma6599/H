'use strict';

function resolveNativeOffset(deps, offset, label) {
  if (!Number.isSafeInteger(offset) || offset < 0 || (offset & 3) !== 0) {
    throw new Error('Invalid native offset: ' + label);
  }
  const address = deps.add(offset);
  const range = Process.findRangeByAddress(address);
  if (range && range.protection.indexOf('r') === -1) {
    throw new Error('Unmapped native offset: ' + label + ' +0x' + offset.toString(16));
  }
  return address;
}

function clampSpeed(value) {
  return Math.max(1, Math.min(100, Math.round(Number(value) || 1)));
}

function createAutoSpin(deps, logger) {
  if (typeof logger === 'function') {
    logger = { log: logger };
  }
  const log = logger.log;
  const inputGate = logger.inputGate;
  const scheduler = logger.scheduler;

  deps = normalizeDeps(deps);

  for (const [name, offset] of Object.entries(offsets)) {
    resolveNativeOffset(deps, offset, 'Auto Spin ' + name);
  }

  const makeNative = (offset, retType, argTypes) =>
    new NativeFunction(deps.add(offset), retType, argTypes);

  const nativeAlloc = new NativeFunction(
    deps.add(offsets.alloc), 'pointer', ['ulong']);
  const nativeFree = new NativeFunction(
    deps.add(offsets.free), 'void', ['pointer']);

  const getBattleNative = makeNative(offsets.battle, 'pointer', []);
  const getScreenNative = makeNative(offsets.screen, 'pointer', []);
  const getOwnEntity    = makeNative(offsets.own,    'pointer', ['pointer']);
  const isAliveNative   = makeNative(offsets.alive,   'bool',    ['pointer']);
  const readXNative     = makeNative(offsets.x,       'int32',   ['pointer']);
  const readYNative     = makeNative(offsets.y,       'int32',   ['pointer']);
  const moveNative      = makeNative(offsets.move,    'pointer',
                                     ['pointer', 'int', 'int', 'int']);
  const inputNative     = makeNative(offsets.input,   'pointer', ['pointer', 'int']);
  const submitNative    = makeNative(offsets.submit,
                                     'void', ['pointer', 'pointer']);

  const STRUCT_BATTLE_ACTOR = STRUCT_ROOT_TO_ACTOR;
  const STRUCT_GRID         = STRUCT_PATH_TO_GRID;
  const STRUCT_REQ_X        = STRUCT_REQ_OFFSET_X;
  const STRUCT_REQ_Y        = STRUCT_REQ_OFFSET_Y;
  const STRUCT_FLAG_BYTE    = STRUCT_SCREEN_FLAG;
  const STRUCT_AFTER_FLOAT1 = STRUCT_A_FLOAT1;
  const STRUCT_AFTER_U8     = STRUCT_A_U8;
  const STRUCT_AFTER_FLOAT2 = STRUCT_A_FLOAT2;
  const STRUCT_AFTER_X      = STRUCT_A_X;
  const STRUCT_AFTER_Y      = STRUCT_A_Y;

  const PATH_CTX = 0;
  const ACTOR    = 1;
  const OWN      = 2;

  const QUEUE_REV  = 0;
  const QUEUE_DONE = 1;

  const MODE_ACTIVE    = 0;
  const MODE_NO_BATTLE  = 1;
  const MODE_NO_SCREEN  = 2;
  const MODE_NOT_ALIVE  = 3;
  const MODE_BUSY       = 4;
  const MODE_PAUSED     = 5;
  const MODE_REJECTED   = 6;
  const MODE_ON         = 7;
  const MODE_OFF        = 8;
  const MODES = [MODE_ACTIVE, MODE_NO_BATTLE, MODE_NO_SCREEN, MODE_NOT_ALIVE,
                 MODE_BUSY, MODE_PAUSED, MODE_REJECTED, MODE_ON, MODE_OFF];

  let enabled    = false;
  let disposed   = false;
  let revision   = 0;
  let speed      = 55;
  let angle      = 0;
  let mode       = MODE_ACTIVE;
  let lastKey    = '';
  let holdKey    = '';
  let lastMoveAt = 0;
  let anchorX    = null;
  let anchorY    = null;
  let pending    = null;
  let interval   = null;
  let ticks      = 0;
  let moves      = 0;
  let errors     = 0;
  let lastError  = '';

  function getBattle() {
    try {
      const root = getBattleNative();
      if (!root || root.isNull()) return null;

      const actor = root.add(STRUCT_BATTLE_ACTOR).readPointer();
      if (!actor || actor.isNull()) return null;

      const own = getOwnEntity(actor);
      if (!own || own.isNull()) return null;

      return [root, actor, own];
    } catch (e) {
      return null;
    }
  }

  function canMove(pathCtx, targetX, targetY) {
    const grid = pathCtx.add(STRUCT_GRID).readPointer();
    if (!grid || grid.isNull()) return false;

    let scratch = null;
    let committed = false;
    try {
      scratch = nativeAlloc(72);
      if (!scratch || scratch.isNull()) return false;

      scratch.writeByteArray(new Uint8Array(72));
      inputNative(scratch, 2);
      scratch.add(STRUCT_REQ_X).writeS32(targetX);
      scratch.add(STRUCT_REQ_Y).writeS32(targetY);

      committed = true;
      submitNative(grid, scratch);
      moves++;
      return true;
    } finally {
      if (scratch && !committed) {
        nativeFree(scratch);
      }
    }
  }

  function isInputLocked() {
    if (inputGate && inputGate.isLocked) {
      return !!inputGate.isLocked(sharedFlags[sharedKey]);
    }
    if (inputGate && inputGate.angle) {
      return !!inputGate.angle();
    }
    return false;
  }

  function onMoveRejected() {
    if (inputGate && inputGate.notifyRejected) {
      inputGate.notifyRejected(sharedFlags[sharedKey]);
    }
  }

  function afterMove(screen, targetX, targetY) {
    if (!screen || screen.isNull()) return;
    screen.add(STRUCT_AFTER_FLOAT1).writeFloat(0.05);
    screen.add(STRUCT_AFTER_U8).writeU8(1);
    screen.add(STRUCT_AFTER_FLOAT2).writeFloat(0);
    screen.add(STRUCT_AFTER_X).writeS32(targetX);
    screen.add(STRUCT_AFTER_Y).writeS32(targetY);
  }

  function resetAnchors() {
    lastKey = '';
    holdKey = '';
    anchorY = null;
    anchorX = null;
    lastMoveAt = 0;
    onMoveRejected();
  }

  function spinStep() {
    if (!enabled || disposed) return;

    try {
      const battle = getBattle();
      const screen = battle ? getScreenNative() : battle;

      if (!battle) {
        mode = MODE_NO_BATTLE;
        resetAnchors();
        return;
      }
      if (!screen || screen.isNull()) { mode = MODE_NO_SCREEN; return; }
      if (!isAliveNative(battle[OWN])) { mode = MODE_NOT_ALIVE; return; }
      if (screen.add(STRUCT_FLAG_BYTE).readU8() !== 0) { mode = MODE_BUSY; return; }
      if (isInputLocked()) { mode = MODE_PAUSED; return; }
      mode = MODE_ACTIVE;

      const x = readXNative(battle[OWN]) | 0;
      const y = readYNative(battle[OWN]) | 0;

      const posKey = String(battle[PATH_CTX]) + ':' + String(battle[OWN]);
      if (posKey !== lastKey || anchorX === null ||
          Math.hypot(x - anchorX, y - anchorY) > 4) {
        lastKey = posKey;
        anchorX = x;
        anchorY = y;
        holdKey = '';
        lastMoveAt = 0;
      }

      if (inputGate && inputGate.checkPathBudget &&
          !inputGate.checkPathBudget(sharedFlags[sharedKey], 70)) {
        mode = MODE_PAUSED;
        return;
      }

      const now = Date.now();
      const dt = lastMoveAt ? Math.max(0, Math.min(58, now - lastMoveAt)) : 29;
      lastMoveAt = now;
      angle = (angle + dt * clampSpeed(speed) / 29) % (Math.PI * 2);

      const targetX = (anchorX + Math.round(Math.cos(angle))) | 0;
      const targetY = (anchorY + Math.round(Math.sin(angle))) | 0;
      const targetKey = targetX + ':' + targetY;

      if (targetKey === holdKey) return;

      if (!canMove(battle[PATH_CTX], targetX, targetY)) {
        onMoveRejected();
        mode = MODE_REJECTED;
        return;
      }

      holdKey = targetKey;
      moveNative(battle[ACTOR], targetX, targetY, 1);
      afterMove(screen, targetX, targetY);
      ticks++;
      lastError = '';
    } catch (e) {
      errors++;
      lastError = String(e && e.message ? e.message : e).slice(0, 200);
      if (errors % 8 === 0) {
        resetAnchors();
      }
    }
  }

  function schedule(workFn) {
    if (pending !== null || disposed) return;

    const queue = [revision, false];
    pending = queue;

    const gameThreadWorker = function () {
      if (queue[QUEUE_DONE]) return;
      queue[QUEUE_DONE] = true;
      if (pending === queue) pending = null;
      if (!disposed && queue[QUEUE_REV] === revision) {
        workFn();
      }
    };
    const onScheduledDone = function () {
      if (queue[QUEUE_DONE]) return;
      queue[QUEUE_DONE] = true;
      if (pending === queue) pending = null;
      if (!disposed && queue[QUEUE_REV] === revision) {
        workFn();
      }
    };

    try {
      scheduler(gameThreadWorker, onScheduledDone);
    } catch (e) {
      queue[QUEUE_DONE] = true;
      if (pending === queue) pending = null;
      errors++;
      lastError = String(e && e.message ? e.message : e);
      if (errors % 8 === 0) resetAnchors();
    }
  }

  function intervalTick() {
    if (enabled && !disposed) {
      schedule(spinStep);
    }
  }

  function finalFlush() {
    try {
      if (isInputLocked()) return;

      const battle = getBattle();
      const screen = battle ? getScreenNative() : battle;

      if (battle &&
          String(battle[PATH_CTX]) + ':' + String(battle[OWN]) === lastKey &&
          isAliveNative(battle[OWN]) &&
          screen && !screen.isNull() &&
          screen.add(STRUCT_FLAG_BYTE).readU8() === 0) {

        const x = readXNative(battle[OWN]);
        const y = readYNative(battle[OWN]);
        if (canMove(battle[PATH_CTX], x, y)) {
          moveNative(battle[ACTOR], x, y, 1);
          afterMove(screen, x, y);
        }
      }
    } catch (e) { }
  }

  function start() {
    if (interval === null) {
      interval = setInterval(intervalTick, 29);
    }
  }

  function stop() {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function setEnabled(value) {
    if (disposed) {
      throw new Error('Auto Spin disposed');
    }

    value = !!value;
    if (value === enabled) return enabled;

    if (value && typeof scheduler !== 'function') {
      throw new Error('Auto Spin requires a game-thread scheduler');
    }

    const hadKey = lastKey;
    enabled = value;
    revision++;

    pending = null;
    if (value) {
      mode = MODE_ON;
      start();
      return enabled;
    }

    stop();
    resetAnchors();
    angle = 0;
    mode = MODE_OFF;
    if (hadKey) {
      schedule(finalFlush);
    }
    return enabled;
  }

  function setSpeed(value) {
    speed = clampSpeed(value);
    return speed;
  }

  function dispose() {
    if (disposed) return;
    enabled = false;
    disposed = true;
    revision++;
    pending = null;
    stop();
    resetAnchors();
  }

  function getState() {
    const state = {
      enabled,
      disposed,
      speed,
      ticks,
      moves,
      errors,
      lastError,
      mode: MODES[mode],
      pending: pending !== null,
      angle,
      anchor: anchorX === null ? null : { x: anchorX, y: anchorY },
      holdKey,
    };
    return state;
  }

  return {
    setEnabled,
    setSpeed,
    dispose,
    getState,
  };
}
