'use strict';

const FEATURE_ID = 12;

const BALL_TRAJECTORY = 12;

const MENU_LABEL_EN = 'BALL_TRAJECTORY';
const SETTINGS_KEY = 'ball_trajectory';

const TRAJECTORY_HOLD_MS = 500;

const MAX_SPAN = 12288;
const MAX_COORD = 100000;

const SAMPLE_STRIDE = 4;
const SAMPLE_Z = 8;
const SIM_STRIDE = 12;
const SIM_MIN = 24;
const SIM_MAX = 1536;

const CTX_FLAG = 8;
const CTX_FLAG_ON = 1;
const CTX_FLAG_OFF = 0;

const DRAW_MAX_SEGMENTS = 16;
const DRAW_MAX_POINTS = 32;
const DRAW_HEADER_SIZE = 24;

const MAX_POINTS = 2;

const COUNTER_KEYS = [
  'ticks',
  'trajectoryDraws',
  'samplesRead',
  'rejectedSamples',
  'errors',
];

function label() {
  return MENU_LABEL_EN;
}

function sampleSpanValid(span) {
  return span >= SIM_MIN && span <= MAX_SPAN && (span % SIM_STRIDE) === 0;
}

function pointValid(x, y, z) {
  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) &&
    Math.abs(x) <= MAX_COORD && Math.abs(y) <= MAX_COORD;
}

function createBallTrajectory(deps) {
  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const runtime = deps.ballRuntime;
  const Memory = deps.Memory;

  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    notBefore: 0,
    threadId: null,
    points: null,
    seedPointer: null,
    lastDrawAt: 0,
  };

  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));

  let pointsBuffer = null;
  let headerBuffer = null;

  function runtimeCall(method, fallback) {
    if (runtime && typeof runtime[method] === 'function') {
      return runtime[method];
    }
    return fallback;
  }

  function isRuntimeActive() {
    if (!state.enabled || state.disposed) return false;
    if (typeof deps.isVisualRuntimeEnabled === 'function') {
      return deps.isVisualRuntimeEnabled();
    }
    return true;
  }

  function readSamples(outBuffer) {
    const buffer = outBuffer.readPointer();
    const end = outBuffer.add(SAMPLE_Z).readPointer();
    if (buffer.isNull() || end.isNull()) return null;
    const span = end.sub(buffer).toInt32();
    if (!sampleSpanValid(span)) return null;
    const points = [];
    const count = span / SIM_STRIDE;
    for (let i = 0; i < count; i++) {
      const sample = buffer.add(i * SIM_STRIDE);
      const x = sample.readFloat();
      const y = sample.add(SAMPLE_STRIDE).readFloat();
      const z = sample.add(SAMPLE_Z).readFloat();
      if (!pointValid(x, y, z)) return null;
      points.push({ x: x, y: y, z: z });
    }
    if (points.length < MAX_POINTS) return null;
    return points;
  }

  function clearContextFlags(seed) {
    for (const index of deps.contextIndexes) {
      const context = seed.add(deps.offsetValues[index]).readPointer();
      if (context && !context.isNull()) {
        context.add(CTX_FLAG).writeU8(CTX_FLAG_OFF);
      }
    }
  }

  function writeTrajectoryPoint(points, index, x, y) {
    const vertex = points.add(index * SIM_STRIDE);
    vertex.writeFloat(x);
    vertex.add(SAMPLE_STRIDE).writeFloat(y);
    vertex.add(SAMPLE_Z).writeFloat(0);
  }

  function drawTrajectory(seed, segments) {
    if (!segments.length || segments.length > DRAW_MAX_SEGMENTS ||
        seed.isNull()) {
      return false;
    }
    const context = seed.add(
      deps.offsetValues[deps.contextIndexes[0]]).readPointer();
    if (context.isNull()) return false;
    if (!pointsBuffer && Memory) {
      pointsBuffer = Memory.alloc(DRAW_MAX_POINTS * SIM_STRIDE);
      headerBuffer = Memory.alloc(DRAW_HEADER_SIZE);
    }
    if (!pointsBuffer) return false;
    writeTrajectoryPoint(pointsBuffer, 0, segments[0].fromX, segments[0].fromY);
    for (let i = 0; i < segments.length; i++) {
      writeTrajectoryPoint(
        pointsBuffer, i + 1, segments[i].toX, segments[i].toY);
    }
    const end = pointsBuffer.add((segments.length + 1) * SIM_STRIDE);
    headerBuffer.writePointer(pointsBuffer);
    headerBuffer.add(SAMPLE_Z).writePointer(end);
    headerBuffer.add(SAMPLE_Z + SAMPLE_STRIDE).writePointer(end);
    deps.drawNative(context, headerBuffer);
    context.add(CTX_FLAG).writeU8(CTX_FLAG_ON);
    counters.trajectoryDraws += 1;
    state.lastDrawAt = Date.now();
    return true;
  }

  function onSystemEnter(args) {
    if (!isRuntimeActive()) return;
    state.seedPointer = args[0];
    if (deps.isAssistActive()) {
      state.notBefore = Date.now() + TRAJECTORY_HOLD_MS;
    }
    state.threadId = deps.getCurrentThreadId();
    state.points = null;
    clearContextFlags(args[0]);
  }

  function onSimLeave(outBuffer) {
    if (!isRuntimeActive()) return;
    if (outBuffer.isNull()) return;
    try {
      const points = readSamples(outBuffer);
      if (points) {
        counters.samplesRead += points.length;
        state.points = points;
      } else {
        counters.rejectedSamples += 1;
      }
    } catch (err) {
      counters.errors += 1;
      state.lastError = err && err.message ? err.message : String(err);
      log(state.lastError);
    }
  }

  function onSystemLeave() {
    if (!isRuntimeActive()) return;
    if (deps.isAssistActive()) return;
    const points = state.points;
    state.points = null;
    const threadId = state.threadId;
    state.threadId = null;
    if (!points) return;
    try {
      const segments = runtimeCall('projectTrajectory', () => null)(
        points, state.seedPointer);
      if (segments) {
        drawTrajectory(state.seedPointer, segments);
      }
    } catch (err) {
      counters.errors += 1;
      state.lastError = err && err.message ? err.message : String(err);
      log(state.lastError);
    }
  }

  function tick(now) {
    if (!isRuntimeActive()) return undefined;
    const at = now === undefined ? Date.now() : now;
    counters.ticks += 1;
    if (at < state.notBefore) return undefined;
    return undefined;
  }

  function setEnabled(on) {
    if (state.disposed) {
      throw new Error('Ball/Mortis runtime disposed');
    }
    on = on === true;
    if (state.enabled === on) return on;
    runtimeCall('setEnabled', () => undefined)(BALL_TRAJECTORY, on);
    state.enabled = on;
    if (!on) {
      state.points = null;
      state.notBefore = 0;
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved[SETTINGS_KEY] === true : false;
    if (state.enabled) {
      runtimeCall('setEnabled', () => undefined)(BALL_TRAJECTORY, true);
    }
  }

  function getState() {
    const runtimeState = runtime ? runtime.getState() : null;
    return {
      enabled: state.enabled,
      holdUntil: state.notBefore,
      heldForAssist: deps.isAssistActive(),
      hasPoints: state.points !== null,
      pointCount: state.points ? state.points.length : 0,
      trajectoryDraws: counters.trajectoryDraws,
      runtimeDraws: runtimeState ? runtimeState.trajectoryDraws : 0,
      samplesRead: counters.samplesRead,
      rejectedSamples: counters.rejectedSamples,
      ticks: counters.ticks,
      errors: counters.errors,
      disposed: state.disposed,
      lastError: state.lastError ||
        (runtimeState ? runtimeState.lastError : ''),
      featureId: BALL_TRAJECTORY,
      settingsKey: SETTINGS_KEY,
      label: label(),
    };
  }

  function dispose() {
    if (state.disposed) return undefined;
    try {
      setEnabled(false);
    } catch (err) {
      state.lastError = err && err.message ? err.message : String(err);
    }
    state.disposed = true;
    pointsBuffer = null;
    headerBuffer = null;
    return undefined;
  }

  const api = {
    setEnabled: setEnabled,
    applySaved: applySaved,
    onSystemEnter: onSystemEnter,
    onSimLeave: onSimLeave,
    onSystemLeave: onSystemLeave,
    drawTrajectory: drawTrajectory,
    readSamples: readSamples,
    tick: tick,
    getState: getState,
    dispose: dispose,
  };

  return api;
}

module.exports = {
  FEATURE_ID,
  BALL_TRAJECTORY,
  TRAJECTORY_HOLD_MS,
  DRAW_MAX_SEGMENTS,
  DRAW_MAX_POINTS,
  COUNTER_KEYS,
  label,
  sampleSpanValid,
  pointValid,
  createBallTrajectory,
};
