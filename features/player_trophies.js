'use strict';

const FEATURE_ID = 32;

const PLAYER_TROPHIES = 32;

const MENU_LABEL_EN = 'Player trophies';
const MENU_LABEL_RU = 'Кубки игроков';

const CHAR_CODE_KEY = [112, 108, 97, 121, 101, 114, 95, 116, 114, 111, 112, 104, 105, 101, 115];

const TROPHIES_MODULE_SOURCE =
  '\n typedef unsigned long long o5f875436fee7b660;\n' +
  ' int o75e24b8a(void *o66ffa41b43501b22){\n' +
  '  if(!o66ffa41b43501b22)return -1;' +
  'void *o591423cb5e551e1d=' +
  '*(void **)((char *)o66ffa41b43501b22+360);' +
  'if(!o591423cb5e551e1d)return -1;\n' +
  '  o5f875436fee7b660 o72e3a53126a1e6bd=' +
  '*(o5f875436fee7b660 *)((char *)o591423cb5e551e1d+24);' +
  'if(o72e3a53126a1e6bd>512)return -1;\n' +
  '  void *odb30a8c54a062579=' +
  '*(void **)((char *)o591423cb5e551e1d+16);' +
  'o5f875436fee7b660 oef67fd0cc63bdbb3=0;' +
  'int o6c5ea3cbf7fe9165=0;\n' +
  '  while(odb30a8c54a062579&&oef67fd0cc63bdbb3<o72e3a53126a1e6bd){' +
  'int *o2cf702278a9baf4b=' +
  '*(int **)((char *)odb30a8c54a062579+24);' +
  'if(o2cf702278a9baf4b){' +
  'if(*o2cf702278a9baf4b<0||*o2cf702278a9baf4b>1000000)return -1;' +
  'o6c5ea3cbf7fe9165+=*o2cf702278a9baf4b;' +
  'if(o6c5ea3cbf7fe9165>10000000)return -1;}' +
  'odb30a8c54a062579=*(void **)odb30a8c54a062579;' +
  'oef67fd0cc63bdbb3++;}\n' +
  '  return odb30a8c54a062579||' +
  'oef67fd0cc63bdbb3!=o72e3a53126a1e6bd?-1:o6c5ea3cbf7fe9165;\n' +
  ' }\n ';

const SUMMER_EXPORT = 'o75e24b8a';
const SLOT_EXPORT = 'trophies_slot';

const PLAYER_MANAGER_OFFSET = 360;
const BRAWLER_LIST_OFFSET = 16;
const BRAWLER_COUNT_OFFSET = 24;
const BRAWLER_VALUE_OFFSET = 24;
const MAX_BRAWLERS = 512;
const MAX_BRAWLER_TROPHIES = 1000000;
const MAX_TOTAL_TROPHIES = 10000000;

const NAME_LENGTH_MIN = 1;
const NAME_LENGTH_MAX = 384;
const SHORT_NAME_LIMIT = 8;
const NAME_SLICE = 96;

const TAG_PATTERN = /^#[0289PYLQGRJCUV]{1,15}$/;

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

function createPlayerTrophies(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const offsets = deps.offsets || {};
  const readPointer = deps.readPointer;
  const readU32 = deps.readU32;
  const readUtf8String = deps.readUtf8String;
  const isNull = deps.isNull;
  const equals = deps.equals;
  const readTag = deps.readTag;

  let summer = null;
  let records = [];

  function buildSummer() {
    if (summer) return summer;
    const CModuleCtor = deps.CModule;
    const NativeFunction = deps.NativeFunction;
    if (!CModuleCtor || !NativeFunction) return null;
    try {
      const module = new CModuleCtor(TROPHIES_MODULE_SOURCE, deps.symbolMap);
      summer = new NativeFunction(module[SUMMER_EXPORT], 'int', ['pointer']);
    } catch (err) {
      state.lastError = String(err);
      summer = null;
    }
    return summer;
  }

  function readName(list) {
    if (!readU32 || !readUtf8String) return '';
    const length = readU32(list.add(offsets.nameLength));
    if (length < NAME_LENGTH_MIN || length > NAME_LENGTH_MAX) {
      return '';
    }
    let source = list.add(offsets.nameInline);
    if (length >= SHORT_NAME_LIMIT) {
      if (!readPointer) return '';
      source = readPointer(source);
      if (isNull && isNull(source)) return '';
    }
    return sanitizeName(readUtf8String(source, length));
  }

  function readPlayer(base) {
    if (!readPointer || !isNull || !equals) return null;
    try {
      const manager = readPointer(base.add(offsets.self));
      if (isNull(manager)) return null;
      const list = readPointer(manager.add(offsets.list));
      if (isNull(list) ||
          !equals(readPointer(list), readPointer(base.add(offsets.root)))) {
        return null;
      }
      const tag = readTag ? readTag(base) : null;
      if (!tag) return null;
      const name = readName(list);
      const total = summer ? summer(list) : -1;
      if (!equals(readPointer(base.add(offsets.self)), manager) ||
          !equals(readPointer(manager.add(offsets.list)), list) ||
          (readTag ? readTag(base) : null) !== tag) {
        return null;
      }
      return {
        tag: tag,
        name: name,
        trophies: total >= 0 ? total : null,
      };
    } catch (err) {
      state.lastError = String(err);
      return null;
    }
  }

  function scan(bases) {
    if (!state.enabled) return records;
    buildSummer();
    records = [];
    for (const base of bases || []) {
      const record = readPlayer(base);
      if (record && TAG_PATTERN.test(record.tag)) {
        records.push(record);
      }
    }
    return records;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      buildSummer();
    } else {
      records = [];
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick() {
    if (!state.enabled) return;
    scan(deps.bases ? deps.bases() : []);
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      players: records.length,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    summer = null;
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    PLAYER_TROPHIES,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    FEATURE_KEY: buildKey(),
    label,
    buildKey,
    buildSummer,
    readPlayer,
    readName,
    sanitizeName,
    scan,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  PLAYER_TROPHIES,
  TROPHIES_MODULE_SOURCE,
  SUMMER_EXPORT,
  SLOT_EXPORT,
  PLAYER_MANAGER_OFFSET,
  BRAWLER_LIST_OFFSET,
  BRAWLER_COUNT_OFFSET,
  BRAWLER_VALUE_OFFSET,
  MAX_BRAWLERS,
  MAX_BRAWLER_TROPHIES,
  MAX_TOTAL_TROPHIES,
  TAG_PATTERN,
  label,
  buildKey,
  sanitizeName,
  createPlayerTrophies,
};
