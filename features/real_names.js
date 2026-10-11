'use strict';

const FEATURE_ID = 31;

const REAL_NAMES = 31;

const MENU_LABEL_EN = 'Real names';
const MENU_LABEL_RU = 'Настоящие ники';

const MENU_KEY_EN = 'REAL_NAMES';

const CHAR_CODE_KEY = [114, 101, 97, 108, 95, 110, 97, 109, 101, 115];

const NAME_LENGTH_MIN = 1;
const NAME_LENGTH_MAX = 384;
const SHORT_NAME_LIMIT = 8;
const NAME_SLICE = 96;

const CACHE_LIMIT = 2048;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function sanitizeName(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .slice(0, NAME_SLICE);
}

function createRealNames(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readPointer = deps.readPointer;
  const readU32 = deps.readU32;
  const readUtf8String = deps.readUtf8String;
  const isNull = deps.isNull;

  const cache = new Map();
  let nameReads = 0;
  let nameCacheHits = 0;

  function readName(entity, offsets) {
    if (!readU32 || !readUtf8String) return '';
    try {
      const length = readU32(entity.add(offsets.nameLength));
      if (length < NAME_LENGTH_MIN || length > NAME_LENGTH_MAX) {
        return '';
      }
      let source = entity.add(offsets.nameInline);
      if (length >= SHORT_NAME_LIMIT) {
        if (!readPointer) return '';
        source = readPointer(source);
        if (isNull && isNull(source)) return '';
      }
      return sanitizeName(readUtf8String(source, length));
    } catch (err) {
      state.lastError = String(err);
      return '';
    }
  }

  function resolve(entity, offsets) {
    const key = String(entity);
    if (cache.has(key)) {
      nameCacheHits++;
      return cache.get(key);
    }
    nameReads++;
    const name = readName(entity, offsets);
    if (name && cache.size < CACHE_LIMIT) {
      cache.set(key, name);
    }
    return name;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (!on) {
      cache.clear();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      cached: cache.size,
      nameReads: nameReads,
      nameCacheHits: nameCacheHits,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    REAL_NAMES,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    MENU_KEY_EN,
    FEATURE_KEY: buildKey(),
    label,
    buildKey,
    sanitizeName,
    readName,
    resolve,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  REAL_NAMES,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  MENU_KEY_EN,
  NAME_LENGTH_MIN,
  NAME_LENGTH_MAX,
  SHORT_NAME_LIMIT,
  NAME_SLICE,
  CACHE_LIMIT,
  label,
  buildKey,
  sanitizeName,
  createRealNames,
};
