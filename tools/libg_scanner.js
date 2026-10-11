'use strict';

const PROFILE_PATH = '../ui/offset_profile.js';
const HAS_REQUIRE = typeof require === 'function';
const PROFILE = HAS_REQUIRE ? require(PROFILE_PATH) : null;

const IS_FRIDA = typeof Process !== 'undefined' &&
  typeof Memory !== 'undefined' && typeof Module !== 'undefined';

const FRAME_TABLE_COUNT = 5;
const FRAME_TABLE_STRIDE = 8;
const FRAME_TABLE_SPAN = FRAME_TABLE_COUNT * FRAME_TABLE_STRIDE;
const CANONICAL_RATES = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240, 360];
const RATE_MIN = 1;
const RATE_MAX = 10000;
const READY_WINDOW = 4096;
const READY_MAX_CANDIDATES = 24;
const SECOND_SCAN_STRIDE = 8;
const SECOND_SCAN_SPAN = 256;
const MIGRATE_RADIUS = 128;
const MIGRATE_STEP = 4;
const FRIDA_CHUNK = 1048576;

const INDEX_SEMANTICS = {
  252: 'vsync.frameWaitOwnerPointer',
  324: 'vsync.frameWaitHook2',
  332: 'vsync.frameSecondCap',
  503: 'vsync.frameWaitHook1',
  617: 'vsync.frameStruct',
  618: 'vsync.frameReady',
  619: 'vsync.frameSetter',
};

const AUTO_INDEXES = [617, 618, 332];
const MANUAL_INDEXES = [324, 503, 619];
const RUNTIME_INDEXES = [252];

function view(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function isIntegerRate(v) {
  return Number.isFinite(v) && Math.floor(v) === v &&
    v >= RATE_MIN && v <= RATE_MAX;
}

function canonicalCount(rates) {
  let n = 0;
  for (let i = 0; i < rates.length; i++) {
    if (CANONICAL_RATES.indexOf(rates[i]) >= 0) n += 1;
  }
  return n;
}

function readRates(dv, off) {
  const out = [];
  for (let i = 0; i < FRAME_TABLE_COUNT; i++) {
    out.push(dv.getFloat64(off + i * FRAME_TABLE_STRIDE, true));
  }
  return out;
}

function scoreFrameTable(rates) {
  for (let i = 0; i < rates.length; i++) {
    if (!isIntegerRate(rates[i])) return -1;
  }
  const unique = new Set(rates);
  if (unique.size < 3) return -1;
  const canon = canonicalCount(rates);
  if (canon < 3) return -1;
  let score = canon * 10;
  if (unique.has(60)) score += 5;
  if (unique.has(30)) score += 3;
  if (unique.has(120)) score += 3;
  return score;
}

function scanFrameTables(region) {
  const dv = view(region.bytes);
  const hits = [];
  const limit = region.bytes.length - FRAME_TABLE_SPAN;
  for (let off = 0; off <= limit; off += FRAME_TABLE_STRIDE) {
    const rates = readRates(dv, off);
    const score = scoreFrameTable(rates);
    if (score >= 30) {
      hits.push({
        region: region.name,
        moduleOffset: (region.moduleOffset || 0) + off,
        offset: off,
        rates: rates,
        score: score,
      });
    }
  }
  hits.sort(function (a, b) { return b.score - a.score; });
  return hits;
}

function scanReadyFlag(region, anchor, windowSize, maxCandidates) {
  const bytes = region.bytes;
  const lo = Math.max(0, anchor - windowSize);
  const hi = Math.min(bytes.length, anchor + windowSize);
  const skipLo = anchor - 8;
  const skipHi = anchor + FRAME_TABLE_SPAN;
  const out = [];
  for (let off = lo; off < hi; off++) {
    if (off >= skipLo && off < skipHi) continue;
    const b = bytes[off];
    if (b === 0 || b === 1) {
      out.push({
        region: region.name,
        moduleOffset: (region.moduleOffset || 0) + off,
        offset: off,
        distance: Math.abs(off - anchor),
        value: b,
      });
    }
    if (out.length >= 2000) break;
  }
  out.sort(function (a, b) { return a.distance - b.distance; });
  return out.slice(0, maxCandidates || READY_MAX_CANDIDATES);
}

function scanSecondCap(region, anchor) {
  const dv = view(region.bytes);
  const out = [];
  const limit = Math.min(region.bytes.length - 8, anchor + SECOND_SCAN_SPAN);
  for (let off = anchor + FRAME_TABLE_SPAN; off <= limit; off += SECOND_SCAN_STRIDE) {
    const v = dv.getFloat64(off, true);
    if (isIntegerRate(v)) {
      out.push({
        region: region.name,
        moduleOffset: (region.moduleOffset || 0) + off,
        offset: off,
        delta: off - anchor,
        value: v,
      });
    }
  }
  return out;
}

function windowBytes(region, off, radius) {
  const lo = Math.max(0, off - radius);
  const hi = Math.min(region.bytes.length, off + radius);
  return region.bytes.subarray(lo, hi);
}

function byteMatchScore(a, b) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let same = 0;
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) same += 1;
  }
  return same / n;
}

function migrate(oldRegion, newRegion, oldOffset, radius, step, searchSpan) {
  const probe = windowBytes(oldRegion, oldOffset, radius);
  const stride = step || MIGRATE_STEP;
  const span = searchSpan || radius * 8;
  const best = { offset: -1, score: -1 };
  const lo = Math.max(0, oldOffset - span);
  const hi = Math.min(newRegion.bytes.length, oldOffset + span);
  for (let off = lo; off <= hi; off += stride) {
    const candidate = windowBytes(newRegion, off, radius);
    const score = byteMatchScore(probe, candidate);
    if (score > best.score) {
      best.offset = off;
      best.score = score;
    }
  }
  if (best.offset >= 0) {
    best.moduleOffset = (newRegion.moduleOffset || 0) + best.offset;
    best.shift = best.offset - oldOffset;
  }
  return best;
}

function classifyIndexes() {
  const manual = [];
  const runtime = [];
  for (let i = 0; i < MANUAL_INDEXES.length; i++) {
    manual.push({ index: MANUAL_INDEXES[i], semantics: INDEX_SEMANTICS[MANUAL_INDEXES[i]] });
  }
  for (let i = 0; i < RUNTIME_INDEXES.length; i++) {
    runtime.push({ index: RUNTIME_INDEXES[i], semantics: INDEX_SEMANTICS[RUNTIME_INDEXES[i]] });
  }
  return { manual: manual, runtime: runtime };
}

function buildProfileEntries(findings) {
  const entries = {};
  for (let i = 0; i < AUTO_INDEXES.length; i++) {
    const idx = AUTO_INDEXES[i];
    const semantics = INDEX_SEMANTICS[idx];
    if (findings[semantics] !== undefined) {
      entries[idx] = findings[semantics];
    }
  }
  return entries;
}

function runScan(regions) {
  const tables = [];
  for (let i = 0; i < regions.length; i++) {
    const hits = scanFrameTables(regions[i]).slice(0, 8);
    for (let j = 0; j < hits.length; j++) tables.push(hits[j]);
  }
  tables.sort(function (a, b) { return b.score - a.score; });
  const result = {
    frameTables: tables.slice(0, 8),
    readyCandidates: [],
    secondCandidates: [],
    suggested: {},
    classified: classifyIndexes(),
  };
  if (tables.length === 0) return result;
  const best = tables[0];
  for (let i = 0; i < regions.length; i++) {
    if (regions[i].name !== best.region) continue;
    result.readyCandidates = scanReadyFlag(regions[i], best.offset, READY_WINDOW);
    result.secondCandidates = scanSecondCap(regions[i], best.offset);
    break;
  }
  const findings = {};
  findings['vsync.frameStruct'] = best.moduleOffset;
  if (result.readyCandidates.length) {
    findings['vsync.frameReady'] = result.readyCandidates[0].moduleOffset;
  }
  if (result.secondCandidates.length) {
    findings['vsync.frameSecondCap'] = result.secondCandidates[0].delta;
  }
  result.suggested = buildProfileEntries(findings);
  result.findings = findings;
  return result;
}

function concatChunks(chunks, total) {
  const out = new Uint8Array(total);
  let pos = 0;
  for (let i = 0; i < chunks.length; i++) {
    out.set(chunks[i], pos);
    pos += chunks[i].length;
  }
  return out;
}

function fridaRegions(moduleName) {
  const mod = Process.findModuleByName(moduleName);
  if (!mod) return [];
  const ranges = mod.enumerateRanges('r--');
  const out = [];
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const chunks = [];
    let total = 0;
    for (let off = 0; off < range.size; off += FRIDA_CHUNK) {
      const n = Math.min(FRIDA_CHUNK, range.size - off);
      let chunk = null;
      try {
        chunk = new Uint8Array(range.base.add(off).readByteArray(n));
      } catch (e) {
        chunk = new Uint8Array(n);
      }
      chunks.push(chunk);
      total += n;
    }
    const bytes = concatChunks(chunks, total);
    const moduleOffset = range.base.sub(mod.base).toInt32();
    const label = 'range_' + i + '_' + range.protection +
      '_off_' + moduleOffset.toString(16);
    out.push({ name: label, moduleOffset: moduleOffset, bytes: bytes });
  }
  return out;
}

function fridaMain(moduleName) {
  const regions = fridaRegions(moduleName || 'libg.so');
  if (!regions.length) {
    console.log(JSON.stringify({ error: 'module not found or unreadable' }));
    return null;
  }
  const result = runScan(regions);
  const payload = {
    module: moduleName || 'libg.so',
    result: result,
    profileContract: PROFILE ? { size: PROFILE.PROFILE_SIZE } : null,
  };
  send({ type: 'libg_scan', payload: payload });
  console.log(JSON.stringify(payload, null, 2));
  return result;
}

const api = {
  FRAME_TABLE_COUNT: FRAME_TABLE_COUNT,
  CANONICAL_RATES: CANONICAL_RATES,
  INDEX_SEMANTICS: INDEX_SEMANTICS,
  isIntegerRate: isIntegerRate,
  scoreFrameTable: scoreFrameTable,
  scanFrameTables: scanFrameTables,
  scanReadyFlag: scanReadyFlag,
  scanSecondCap: scanSecondCap,
  migrate: migrate,
  runScan: runScan,
  fridaRegions: fridaRegions,
  fridaMain: fridaMain,
};

if (IS_FRIDA) {
  fridaMain('libg.so');
} else if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
} else {
  globalThis.libgScanner = api;
}
