'use strict';

/*
 * ============================================================================
 *  JirGear — features/autospin.js
 * ============================================================================
 *
 *  FAITHFUL RECONSTRUCTION from the compiled QuickJS bytecode (jirgear_main.qbc).
 *
 *  Original module path (per the module list embedded in the loader):
 *      features/autospin.js
 *
 *  Bytecode → source mapping (function IDs as named by our parser):
 *      fn_2070  createAutoSpin(deps, logger)        — the factory (owns all state)
 *      fn_40    makeNative(offset, ret, args)       — NativeFunction helper
 *      fn_2501  getBattle()                         — battle pointer triplet
 *      fn_1520  canMove(pathCtx, targetX, targetY)   — path request builder/submitter
 *      fn_281   isInputLocked()                     — input gate (2 methods + fallback)
 *      fn_1037  onMoveRejected()                    — input-gate notify on failure
 *      fn_2208  resetAnchors()                      — anchor/state reset
 *      fn_628   spinStep()                          — THE tick (game thread)
 *      fn_2522  schedule(workFn)                    — game-thread scheduler wrapper
 *      fn_570   gameThreadWorker()                  — queue dedup + run gate
 *      fn_2791  onScheduledDone()                   — queue cleanup callback
 *      fn_1299  intervalTick()                     — setInterval body
 *      fn_2740  start() / fn_2353 stop()            — interval lifecycle
 *      fn_334   setEnabled(v)   (API '_$1458b5e5e1ba5d16cc261b4d')
 *      fn_1473  setSpeed(v)     (API '_$da85984e278313ae052275c0')
 *      fn_2806  dispose()       (API 'dispose')
 *      fn_2280  getState()      (API '_$814748ecc47856e7b144daa6')
 *      fn_1162  finalFlush()                       — one last "move to self" on disable
 *
 *  Module-scope helpers living in the bundle root (fn_488 scope):
 *      fn_1447  clampSpeed(v)      → Math.max(1, Math.min(100, Math.round(Number(v)||1)))
 *      fn_2060  resolveNativeOffset(deps, offset, label)
 *      imports[316] sharedFlags / imports[270] sharedKey   — a shared flag lookup
 *      several unnamed structural offsets (see STRUCT_* below)
 *
 *  Anti-analysis reverted:
 *      - each function starts with an opaque predicate over
 *        ((x & 65535) * ((x & 65535) + 1) & 1) !== 0 — always false, dead code.
 *      - API / deps property names are 26-hex hashes (_$…) — kept verbatim,
 *        they are the runtime contract with the loader and the menu.
 * ============================================================================
 */

/* ----------------------------------------------------------------------------
 * Shared module-scope helpers (bundle root).
 * -------------------------------------------------------------------------- */

// fn_2060 — validates one raw offset from the remote profile against the
// process map. `label` is e.g. 'Auto Spin battle' and appears in the error.
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

// fn_1447 (→ fn_2246 branch 55138) — clamp a user speed to [1, 100].
function clampSpeed(value) {
  return Math.max(1, Math.min(100, Math.round(Number(value) || 1)));
}

/* ----------------------------------------------------------------------------
 * createAutoSpin — fn_2070
 * -------------------------------------------------------------------------- */
function createAutoSpin(deps, logger) {

  // ---- dependency resolution ------------------------------------------------
  // `logger` is either a function or an object exposing `.log`.
  if (typeof logger === 'function') {
    logger = { log: logger };
  }
  const log = logger.log;                                    // fn_2070 local 23
  const inputGate = logger['_$0f5ca3bf508eb8602288884d'];   // local 3  — input controller
  const scheduler = logger['_$316a295be826abbc8b0c29da'];   // local 16 — game-thread scheduler

  deps = normalizeDeps(deps);                                // native_import_5(deps)

  // ---- validate every profile offset this module depends on -------------------
  // for-of over Object.entries(offsets); a bad offset aborts creation with
  // 'Invalid native offset: Auto Spin <name>'.
  for (const [name, offset] of Object.entries(offsets)) {
    resolveNativeOffset(deps, offset, 'Auto Spin ' + name);
  }

  // ---- native bindings ---------------------------------------------------------
  // fn_40: (offset, retType, argTypes) => new NativeFunction(deps.add(offset), …)
  const makeNative = (offset, retType, argTypes) =>
    new NativeFunction(deps.add(offset), retType, argTypes);

  const nativeAlloc = new NativeFunction(                     // '_$6ff76fd71ed8749d4b126f55'
    deps.add(offsets['_$6ff76fd71ed8749d4b126f55']), 'pointer', ['ulong']);
  const nativeFree = new NativeFunction(                      // '_$a0ecdfeb91f25b0091d3e509'
    deps.add(offsets['_$a0ecdfeb91f25b0091d3e509']), 'void', ['pointer']);

  const getBattleNative = makeNative(offsets.battle, 'pointer', []);             // local 51
  const getScreenNative = makeNative(offsets.screen, 'pointer', []);             // local 46
  const getOwnEntity    = makeNative(offsets.own,    'pointer', ['pointer']);    // local 17
  const isAliveNative   = makeNative(offsets.alive,   'bool',    ['pointer']);    // local 11
  const readXNative     = makeNative(offsets.x,       'int32',   ['pointer']);   // local 58
  const readYNative     = makeNative(offsets.y,       'int32',   ['pointer']);   // local 60
  const moveNative      = makeNative(offsets.move,    'pointer',
                                     ['pointer', 'int', 'int', 'int']);          // local 7
  const inputNative     = makeNative(offsets.input,   'pointer', ['pointer', 'int']); // local 48
  const submitNative    = makeNative(offsets['_$c4a008b45f098e9c9a99c679'],
                                     'void', ['pointer', 'pointer']);           // local 61

  // ---- structural offsets (bundle-root constants, imports of fn_488) -----------
  const STRUCT_BATTLE_ACTOR = STRUCT_ROOT_TO_ACTOR;   // root + off → actor    (fn_488 local 2197)
  const STRUCT_GRID         = STRUCT_PATH_TO_GRID;    // pathCtx + off → grid  (fn_488 local 1821)
  const STRUCT_REQ_X        = STRUCT_REQ_OFFSET_X;    // scratch + off → x32   (fn_488 local 882)
  const STRUCT_REQ_Y        = STRUCT_REQ_OFFSET_Y;    // scratch + off → y32   (fn_488 local 2030)
  const STRUCT_FLAG_BYTE    = STRUCT_SCREEN_FLAG;     // screen + off → u8     (fn_488 local 1303)
  const STRUCT_AFTER_FLOAT1 = STRUCT_A_FLOAT1;       // fn_488 local 779  (writeFloat 0.05)
  const STRUCT_AFTER_U8     = STRUCT_A_U8;           // fn_488 local 1045 (writeU8 1)
  const STRUCT_AFTER_FLOAT2 = STRUCT_A_FLOAT2;       // fn_488 local 1831 (writeFloat 0)
  const STRUCT_AFTER_X      = STRUCT_A_X;            // fn_488 local 664  (writeS32 tx)
  const STRUCT_AFTER_Y      = STRUCT_A_Y;            // fn_488 local 940  (writeS32 ty)

  // ---- battle wrapper indices (fn_2070 locals 9 / 57 / 37) ---------------------
  const PATH_CTX = 0;   // battle[0] — raw battle root   (pathfinding context)
  const ACTOR    = 1;   // battle[1] — dereferenced actor (moved by moveNative)
  const OWN      = 2;   // battle[2] — own entity         (position / alive reads)

  // ---- queue slots (fn_2070 locals 5 / 24) --------------------------------------
  const QUEUE_REV  = 0; // queue[0] — revision captured at schedule() time
  const QUEUE_DONE = 1; // queue[1] — "already ran" flag

  // ---- mode registry (locals 14/47/59/35/25/4/33/45/32 = 0..8, array local 54) --
  const MODE_ACTIVE    = 0;  // spinning
  const MODE_NO_BATTLE  = 1;  // getBattle() returned null
  const MODE_NO_SCREEN  = 2;  // screen pointer null
  const MODE_NOT_ALIVE  = 3;  // own entity dead
  const MODE_BUSY       = 4;  // screen flag byte non-zero
  const MODE_PAUSED     = 5;  // input locked / path gate rejected
  const MODE_REJECTED   = 6;  // canMove() refused the step
  const MODE_ON         = 7;  // set on enable()
  const MODE_OFF        = 8;  // set on disable()
  const MODES = [MODE_ACTIVE, MODE_NO_BATTLE, MODE_NO_SCREEN, MODE_NOT_ALIVE,
                 MODE_BUSY, MODE_PAUSED, MODE_REJECTED, MODE_ON, MODE_OFF];

  // ---- state (fn_2070 locals — every read/write site verified) --------------------
  let enabled    = false;       // local 34
  let disposed   = false;       // local 31
  let revision   = 0;           // local 6  — bumped on every state transition
  let speed      = 55;         // local 10 — radians per 29 ms tick, clamped [1, 100]
  let angle      = 0;          // local 30 — current spin angle, kept mod 2π
  let mode       = MODE_ACTIVE; // local 53
  let lastKey    = '';         // local 15 — "<rootPtr>:<ownPtr>" anchor identity
  let holdKey    = '';         // local 55 — last accepted "x:y" step
  let lastMoveAt = 0;          // local 52 — Date.now() of the last accepted step
  let anchorX    = null;       // local 43
  let anchorY    = null;       // local 29
  let pending    = null;       // local 22 — the schedule() queue
  let interval   = null;       // local 41 — setInterval handle
  let ticks      = 0;          // local 38 — accepted steps
  let moves      = 0;          // local 26 — submitted move requests
  let errors     = 0;          // local 2
  let lastError  = '';         // local 62

  /* ---------------------------------------------------------------------------
   * getBattle — fn_2501 (local 44)
   * Returns [root, actor, own] or null; every hop is null-checked.
   * ------------------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------------------
   * canMove — fn_1520 (local 50)
   * Builds a 72-byte move request on the native heap, writes the target
   * coordinates and submits it to the pathfinding grid.
   * Returns true when accepted, false otherwise (buffer freed on failure).
   * ------------------------------------------------------------------------- */
  function canMove(pathCtx, targetX, targetY) {
    const grid = pathCtx.add(STRUCT_GRID).readPointer();
    if (!grid || grid.isNull()) return false;

    let scratch = null;
    let committed = false;
    try {
      scratch = nativeAlloc(72);                       // request buffer
      if (!scratch || scratch.isNull()) return false;

      scratch.writeByteArray(new Uint8Array(72));      // zero-fill
      inputNative(scratch, 2);                          // request kind = 2 (move)
      scratch.add(STRUCT_REQ_X).writeS32(targetX);
      scratch.add(STRUCT_REQ_Y).writeS32(targetY);

      committed = true;
      submitNative(grid, scratch);                     // accepted → move queued
      moves++;
      return true;
    } finally {
      if (scratch && !committed) {
        nativeFree(scratch);                           // reclaim on failure
      }
    }
  }

  /* ---------------------------------------------------------------------------
   * isInputLocked — fn_281 (local 18)
   * Input gate with two probe methods and a fallback.
   * ------------------------------------------------------------------------- */
  function isInputLocked() {
    if (inputGate && inputGate['_$6c469dfb2ddb1688dfd11754']) {
      return !!inputGate['_$6c469dfb2ddb1688dfd11754'](sharedFlags[sharedKey]);
    }
    if (inputGate && inputGate['_$9b5fe44f7c935bfb890bcb65']) {
      return !!inputGate['_$9b5fe44f7c935bfb890bcb65']();
    }
    return false;
  }

  /* ---------------------------------------------------------------------------
   * onMoveRejected — fn_1037 (local 13)
   * ------------------------------------------------------------------------- */
  function onMoveRejected() {
    if (inputGate && inputGate['_$22320225cdd7c427d4b8d3cb']) {
      inputGate['_$22320225cdd7c427d4b8d3cb'](sharedFlags[sharedKey]);
    }
  }

  /* ---------------------------------------------------------------------------
   * afterMove — fn_266 (local 56)
   * Post-step writes into the screen/viewport struct.
   * ------------------------------------------------------------------------- */
  function afterMove(screen, targetX, targetY) {
    if (!screen || screen.isNull()) return;
    screen.add(STRUCT_AFTER_FLOAT1).writeFloat(0.05);
    screen.add(STRUCT_AFTER_U8).writeU8(1);
    screen.add(STRUCT_AFTER_FLOAT2).writeFloat(0);
    screen.add(STRUCT_AFTER_X).writeS32(targetX);
    screen.add(STRUCT_AFTER_Y).writeS32(targetY);
  }

  /* ---------------------------------------------------------------------------
   * resetAnchors — fn_2208 (local 19)
   * ------------------------------------------------------------------------- */
  function resetAnchors() {
    lastKey = '';
    holdKey = '';
    anchorY = null;
    anchorX = null;
    lastMoveAt = 0;
    onMoveRejected();                                  // fn_1037 notify
  }

  /* ---------------------------------------------------------------------------
   * spinStep — fn_628 (local 8) — THE TICK
   *
   * Scheduled on the game thread every ~29 ms while enabled.
   *
   * Gate chain (sets `mode`, bails on failure, mode 0 = running):
   *     no battle      → MODE_NO_BATTLE + resetAnchors + return
   *     no screen      → MODE_NO_SCREEN
   *     own not alive  → MODE_NOT_ALIVE
   *     screen flag≠0  → MODE_BUSY
   *     input locked   → MODE_PAUSED
   *     path gate      → MODE_PAUSED   (inputGate.pathCheck(flags, 70) refused)
   *
   * Then:
   *   - re-anchor when the scene/entity identity changed or we drifted
   *     more than 4 units from the anchor (the spin follows the player);
   *   - angle = (angle + dt * clampSpeed(speed) / 29) % 2π   (dt capped at 58);
   *   - step to anchor + round(cos/sin(angle))  → ±1 unit around the anchor,
   *     which makes the brawler walk in tiny circles = "spin";
   *   - canMove() + moveNative() + afterMove() per accepted step.
   * ------------------------------------------------------------------------- */
  function spinStep() {
    if (!enabled || disposed) return;

    try {
      const battle = getBattle();
      const screen = battle ? getScreenNative() : battle;

      // ---- gates -------------------------------------------------------------
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

      // ---- re-anchor on scene change or drift > 4 units ------------------------
      const posKey = String(battle[PATH_CTX]) + ':' + String(battle[OWN]);
      if (posKey !== lastKey || anchorX === null ||
          Math.hypot(x - anchorX, y - anchorY) > 4) {
        lastKey = posKey;
        anchorX = x;
        anchorY = y;
        holdKey = '';
        lastMoveAt = 0;
      }

      // ---- per-tick path gate (limit 70) ---------------------------------------
      if (inputGate && inputGate['_$2b1d9859a05368f4f18995bd'] &&
          !inputGate['_$2b1d9859a05368f4f18995bd'](sharedFlags[sharedKey], 70)) {
        mode = MODE_PAUSED;
        return;
      }

      // ---- advance the angle -----------------------------------------------------
      const now = Date.now();
      const dt = lastMoveAt ? Math.max(0, Math.min(58, now - lastMoveAt)) : 29;
      lastMoveAt = now;
      angle = (angle + dt * clampSpeed(speed) / 29) % (Math.PI * 2);

      // ---- one ±1-unit step around the anchor ------------------------------------
      const targetX = (anchorX + Math.round(Math.cos(angle))) | 0;
      const targetY = (anchorY + Math.round(Math.sin(angle))) | 0;
      const targetKey = targetX + ':' + targetY;

      if (targetKey === holdKey) return;               // step already in flight

      if (!canMove(battle[PATH_CTX], targetX, targetY)) {
        onMoveRejected();                              // fn_1037
        mode = MODE_REJECTED;
        return;
      }

      holdKey = targetKey;
      moveNative(battle[ACTOR], targetX, targetY, 1);
      afterMove(screen, targetX, targetY);             // fn_266
      ticks++;
      lastError = '';
    } catch (e) {
      errors++;
      lastError = String(e && e.message ? e.message : e).slice(0, 200);
      // original: `if (errors < 4 && log) log(...)` — the call was stripped by the
      // obfuscator, the guard survives with an empty then-branch (dead code).
      if (errors % 8 === 0) {
        resetAnchors();                                // periodic self-healing
      }
    }
  }

  /* ---------------------------------------------------------------------------
   * schedule — fn_2522 (local 28)
   * Serialises game-thread work: at most one queued step at a time; a stale
   * queue (revision mismatch) is dropped by the worker.
   * ------------------------------------------------------------------------- */
  function schedule(workFn) {
    if (pending !== null || disposed) return;

    const queue = [revision, false];                    // [captured rev, done]
    pending = queue;

    const gameThreadWorker = function () {             // fn_570
      if (queue[QUEUE_DONE]) return;
      queue[QUEUE_DONE] = true;
      if (pending === queue) pending = null;
      if (!disposed && queue[QUEUE_REV] === revision) {
        workFn();                                       // run on the game thread
      }
    };
    const onScheduledDone = function () {              // fn_2791
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
      queue[QUEUE_DONE] = true;                         // release the slot
      if (pending === queue) pending = null;
      errors++;
      lastError = String(e && e.message ? e.message : e);
      // `if (log && errors < 4)` — same stripped log call, dead guard.
      if (errors % 8 === 0) resetAnchors();
    }
  }

  /* ---------------------------------------------------------------------------
   * intervalTick — fn_1299 (child of fn_2740)
   * ------------------------------------------------------------------------- */
  function intervalTick() {
    if (enabled && !disposed) {
      schedule(spinStep);
    }
  }

  /* ---------------------------------------------------------------------------
   * finalFlush — fn_1162 (child of fn_334)
   * Scheduled on disable while anchored in a valid battle: submits one last
   * move to the CURRENT position — stops the drift cleanly.
   * ------------------------------------------------------------------------- */
  function finalFlush() {
    try {
      if (isInputLocked()) return;                     // fn_281 gate

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
          moveNative(battle[ACTOR], x, y, 1);          // move to self → stop
          afterMove(screen, x, y);
        }
      }
    } catch (e) { /* swallowed */ }
  }

  /* ---------------------------------------------------------------------------
   * start / stop — fn_2740 (local 42) / fn_2353 (local 40)
   * 29 ms cadence — matches the game thread.
   * ------------------------------------------------------------------------- */
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

  /* ---------------------------------------------------------------------------
   * setEnabled — fn_334 (local 12) — API '_$1458b5e5e1ba5d16cc261b4d'
   * ------------------------------------------------------------------------- */
  function setEnabled(value) {
    if (disposed) {
      throw new Error('Auto Spin disposed');
    }

    value = !!value;
    if (value === enabled) return enabled;

    if (value && typeof scheduler !== 'function') {
      throw new Error('Auto Spin requires a game-thread scheduler');
    }

    const hadKey = lastKey;                            // local 15 at switch time
    enabled = value;
    revision++;

    pending = null;
    if (value) {
      mode = MODE_ON;                                 // local 45 = 7
      start();
      return enabled;
    }

    stop();
    resetAnchors();
    angle = 0;                                        // local 30 reset
    mode = MODE_OFF;                                  // local 32 = 8
    if (hadKey) {
      schedule(finalFlush);                           // stop the drift
    }
    return enabled;
  }

  /* ---------------------------------------------------------------------------
   * setSpeed — fn_1473 (local 27) — API '_$da85984e278313ae052275c0'
   * ------------------------------------------------------------------------- */
  function setSpeed(value) {
    speed = clampSpeed(value);
    return speed;
  }

  /* ---------------------------------------------------------------------------
   * dispose — fn_2806 (local 49)
   * ------------------------------------------------------------------------- */
  function dispose() {
    if (disposed) return;
    enabled = false;
    disposed = true;
    revision++;
    pending = null;
    stop();
    resetAnchors();
  }

  /* ---------------------------------------------------------------------------
   * getState — fn_2280 — API '_$814748ecc47856e7b144daa6'
   * (the menu reads this before rendering: 'Auto Spin module is unavailable')
   * ------------------------------------------------------------------------- */
  function getState() {
    const state = {
      enabled: enabled,
      disposed: disposed,
      speed: speed,
      ticks: ticks,
      moves: moves,                                   // '_$913480583cd4866078c0c6be'
      errors: errors,
      lastError: lastError,
      mode: MODES[mode],                              // '_$847df37188c9e0f15414daee'
      pending: pending !== null ? pending : null,
      anchor: null,                                  // '_$344ee9b150e5f1198fdd7ceb'
    };
    if (anchorX !== null && anchorY !== null) {       // conditional in the bytecode
      state.anchor = { x: anchorX, y: anchorY };
    }
    return state;
  }

  // ---- public API (hash keys are the runtime contract — keep verbatim) --------
  return {
    '_$1458b5e5e1ba5d16cc261b4d': setEnabled,
    '_$da85984e278313ae052275c0': setSpeed,
    'dispose': dispose,
    '_$814748ecc47856e7b144daa6': getState,
  };
}

/* ----------------------------------------------------------------------------
 * Menu integration — reconstructed from fn_2150 (command dispatcher).
 *
 *   toggle ('Auto Spin ' + on/off command):
 *     - module missing           → toast 'Auto Spin module is unavailable'
 *                                  (ru: 'Модуль Auto Spin недоступен')
 *     - menu validation failed   → throw 'Auto Spin settings rejected'
 *     - otherwise                → autoSpin['_$1458b5e5e1ba5d16cc261b4d'](cmd)
 *     - failure while enabling   → toast 'Could not start Auto Spin'
 *                                  (ru: 'Не удалось включить Auto Spin')
 *
 *   The bootstrap creates the instance once:
 *     var autoSpin = createAutoSpin(deps, logger);
 *   (created via the registry entry '_$0985d0d99af463e5f8c92e1c', exported by
 *    the bundle root alongside clampSpeed and the offsets object; the instance
 *    reaches the menu through the bundle import array, element 534.)
 *
 *   Menu keys: AUTO SPIN (toggle, registry index 6) + SPIN SPEED slider
 *   (config path: spin.speed, 1–100 cycles/sec, default 55).
 * -------------------------------------------------------------------------- */
