'use strict';

const SECTIONS = ['battle', 'visual'];

const TYPE_NAV = 'nav';
const TYPE_TOGGLE = 'toggle';
const TYPE_ACTION = 'action';

const SECTION_MENU = 'menu';
const SECTION_SETTINGS = 'settings';
const SECTION_PROFILE = 'profile';
const SECTION_COLORS = 'colors';

const CATALOG = [
  { id: 'toggle', type: TYPE_NAV, section: SECTION_MENU },
  { id: 'close', type: TYPE_NAV, section: SECTION_MENU },
  { id: 'tab:battle', type: TYPE_NAV, section: SECTION_MENU },
  { id: 'tab:visual', type: TYPE_NAV, section: SECTION_MENU },
  { id: 'tab:profile', type: TYPE_NAV, section: SECTION_MENU },
  { id: 'tab:about', type: TYPE_NAV, section: SECTION_MENU },
  { id: 'popup:open', type: TYPE_NAV, section: SECTION_SETTINGS },
  { id: 'menu:colors', type: TYPE_NAV, section: SECTION_SETTINGS },
  { id: 'menu:language', type: TYPE_NAV, section: SECTION_SETTINGS },
  { id: 'menu:motion', type: TYPE_TOGGLE, section: SECTION_SETTINGS },
  { id: 'menu:compact', type: TYPE_TOGGLE, section: SECTION_SETTINGS },
  { id: 'telegram:connect', type: TYPE_ACTION, section: SECTION_PROFILE },
  { id: 'telegram:import', type: TYPE_ACTION, section: SECTION_PROFILE },
  { id: 'telegram:refresh', type: TYPE_ACTION, section: SECTION_PROFILE },
  { id: 'title', type: TYPE_ACTION, section: SECTION_MENU },
  { id: 'mode:spectrum', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'mode:solid', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'preset:ice', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'preset:violet', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'preset:sunset', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'preset:mint', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'reset', type: TYPE_ACTION, section: SECTION_COLORS },
  { id: 'language:en', type: TYPE_ACTION, section: SECTION_SETTINGS },
  { id: 'language:ru', type: TYPE_ACTION, section: SECTION_SETTINGS },
];

const ROOT_COMMANDS = ['body', 'toggle', 'close', 'title', 'reset'];

const FIXED_COMMANDS = [
  'feature:server_region',
  'feature:emotes',
  'toggle',
  'close',
  'tab:battle',
  'tab:visual',
  'tab:profile',
  'tab:about',
  'popup:open',
  'menu:colors',
  'menu:language',
  'menu:motion',
  'menu:compact',
  'telegram:connect',
  'telegram:import',
  'telegram:refresh',
  'title',
  'mode:spectrum',
  'mode:solid',
  'preset:ice',
  'preset:violet',
  'preset:sunset',
  'preset:mint',
  'reset',
  'language:en',
  'language:ru',
];

const BATTLE_QUICK_ROW = [
  'feature:auto_dodge',
  'feature:aim_bot',
  'feature:enemy_ammo',
  'feature:leon_clone',
  null,
  null,
];

const WIDGET_DEFAULTS = {
  menu: { x: 0.5, y: 0.5, scale: 1 },
  handle: { x: 0.5, y: 1, scale: 1 },
  telemetry: { x: 0, y: 0, scale: 1 },
  floaters: { x: 0.5, y: 0, scale: 1 },
  monitor: { x: 0, y: 0.3, scale: 1 },
};

const FAMILY_FEATURE = 0x02;
const FAMILY_TAB = 0x03;
const FAMILY_MENU = 0x05;
const FAMILY_QUICK = 0x06;
const FAMILY_TOOLS = 0x08;
const FAMILY_POPUP = 0x10;
const FAMILY_LANGUAGE = 0x12;
const FAMILY_TELEGRAM = 0x13;
const FAMILY_SLOT = 0x15;
const FAMILY_PRESET = 0x16;
const FAMILY_COLOR_MODE = 0x17;

const FEATURE_EVENT_BASE = FAMILY_FEATURE * 0x1000000 + 0x10000;

const EVENT_CODES = {
  'tab:battle': 0x03010000,
  'tab:visual': 0x03010001,
  'tab:profile': 0x03010002,
  'tab:about': 0x03010003,
  'popup:open': 0x10010000,
  'menu:colors': 0x05010000,
  'menu:language': 0x05020000,
  'menu:motion': 0x05030000,
  'menu:compact': 0x05040000,
  'telegram:connect': 0x13010000,
  'telegram:import': 0x13020000,
  'telegram:refresh': 0x13030000,
  'mode:spectrum': 0x17010000,
  'mode:solid': 0x17020000,
  'preset:ice': 0x16010000,
  'preset:violet': 0x16010001,
  'preset:sunset': 0x16010002,
  'preset:mint': 0x16010003,
  'language:en': 0x12000000,
  'language:ru': 0x12000001,
  'quick:body': 0x06000000,
  'quick:main': 0x06010000,
  'quick:pin': 0x06020000,
  'quick:edit': 0x06030000,
  'quick:close': 0x06040000,
  'quick:toggle': 0x06050000,
  'quick:pick:cancel': 0x06060000,
  'quick:remove': 0x06070000,
  'tools:row': 0x08200000,
  'slot': 0x15000000,
};

const FEATURE_COMMAND_PREFIX = 'feature:';

const DATA_DIR_SUFFIX = '/files/jirgear';
const DATA_DIR_ENV = 'JIRGEAR_DATA_DIR';

const SC5_NAME_PATTERN = '^[a-z_]+_[a-f0-9]{16}\\.sc$';
const SHA256_PATTERN = '^[a-f0-9]{64}$';
const SC5_NAME_HASH_LENGTH = 16;
const SC5_MIN_BYTES = 6;
const SC5_MAX_BYTES = 8 * 1024 * 1024;
const SC5_MAGIC = [83, 67, 5, 0];
const SC5_WRITE_MODE = 384;
const SC5_TMP_RADIX = 36;
const SC5_TMP_SLICE_START = 2;

const SC_ASSETS_DIR = 'sc_assets';

const SC5_ASSETS = [
  {
    slot: 0,
    name: 'jirgear_menu_0302a8c28386cbf9.sc',
    sha256:
      '0302a8c28386cbf94059ab3649cbda2db0df0361d9d01c60304c7887677659d9',
    bytes: 1220195,
    source: 'jirgear_menu.sc',
  },
  {
    slot: 1,
    name: 'player_avatar_frame_badd47a69942c3c6.sc',
    sha256:
      'badd47a69942c3c6bb5247f5f8a974e1418ae061604030323dad1d5ffeb976b3',
    bytes: 9621,
    source: 'player_avatar_frame.sc',
  },
  {
    slot: 2,
    name: 'easter_face_7cc14027cdafa5f6.sc',
    sha256:
      '7cc14027cdafa5f64dd77c00cc16c5308cc13d5daa10013efdbf58527167abe2',
    bytes: 77406,
    source: 'easter_face.sc',
  },
  {
    slot: 3,
    name: 'autofarm_emblem_f48c42ce7099ed6c.sc',
    sha256:
      'f48c42ce7099ed6cda02bfed54a636257782a1d486720540349b6fb730acacec',
    bytes: 111051,
    source: 'autofarm_emblem.sc',
  },
  {
    slot: 4,
    name: 'menu_hint_66cc0d8deee3e578.sc',
    sha256:
      '66cc0d8deee3e578fdf94cd994c78f66761e64034af58f165885bcd172492432',
    bytes: 1250,
    source: 'menu_hint.sc',
  },
  {
    slot: 5,
    name: 'jgutils_fff1fb8343baad24.sc',
    sha256:
      'fff1fb8343baad2441218c15e385adda8c8442d9800ac67040c1fb27f76cc728',
    bytes: 27506,
    source: 'jgutils.sc',
  },
];

function buildCommandCatalog(featureKeys) {
  const featureCommands = [];
  for (let i = 0; i < featureKeys.length; i++) {
    const key = featureKeys[i];
    if (typeof key === 'string' && key.length > 0) {
      featureCommands.push(FEATURE_COMMAND_PREFIX + key);
    }
  }
  return featureCommands.concat(FIXED_COMMANDS);
}

function featureEventCode(featureId) {
  if (!Number.isInteger(featureId) || featureId < 0 || featureId > 255) {
    return undefined;
  }
  return FEATURE_EVENT_BASE + featureId;
}

function eventCode(command) {
  if (typeof command !== 'string') return undefined;
  if (Object.prototype.hasOwnProperty.call(EVENT_CODES, command)) {
    return EVENT_CODES[command];
  }
  return undefined;
}

function isValidAsset(asset) {
  if (!asset || typeof asset !== 'object') return false;
  if (typeof asset.name !== 'string') return false;
  if (typeof asset.sha256 !== 'string') return false;
  if (!Number.isInteger(asset.bytes)) return false;
  if (asset.bytes < SC5_MIN_BYTES || asset.bytes > SC5_MAX_BYTES) return false;
  if (!new RegExp(SHA256_PATTERN).test(asset.sha256)) return false;
  if (!new RegExp(SC5_NAME_PATTERN).test(asset.name)) return false;
  if (!asset.name.endsWith(
    '_' + asset.sha256.slice(0, SC5_NAME_HASH_LENGTH) + '.sc')) {
    return false;
  }
  return true;
}

function hasSc5Magic(data) {
  if (!Array.isArray(data) && !(data && typeof data.length === 'number')) {
    return false;
  }
  if (data.length < SC5_MAGIC.length) return false;
  for (let i = 0; i < SC5_MAGIC.length; i++) {
    if (data[i] !== SC5_MAGIC[i]) return false;
  }
  return true;
}

function createMenuStructure(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const resolveDataDir = deps.resolveDataDir;
  const decodeAsset = deps.decodeAsset;
  const io = deps.io;
  const digestOf = deps.digestOf;
  const onToggleFeature = deps.onToggleFeature;
  const onCommandEvent = deps.onCommandEvent;

  const seen = new Set();
  const installed = [];
  let section = SECTIONS[0];
  let active = false;
  let motion = true;
  let compact = false;
  let language = 'en';

  function catalogRecords() {
    return CATALOG.map((record) => ({
      id: record.id,
      type: record.type,
      section: record.section,
    }));
  }

  function registerCommand(commandId) {
    if (typeof commandId !== 'string' || commandId.length === 0) return false;
    if (seen.has(commandId)) return false;
    seen.add(commandId);
    return true;
  }

  function tmpPathFor(name) {
    return '.' +
      Date.now().toString(SC5_TMP_RADIX) + '.' +
      Math.random().toString(SC5_TMP_RADIX)
        .slice(SC5_TMP_SLICE_START) + '.tmp';
  }

  function verifyInstalled(asset, targetPath) {
    if (!io || typeof io.read !== 'function') return false;
    if (typeof digestOf !== 'function') return false;
    const current = io.read(targetPath, asset.bytes);
    if (!current || current.length !== asset.bytes) return false;
    return digestOf(current) === asset.sha256;
  }

  function installAsset(asset, dataDir) {
    if (!isValidAsset(asset)) {
      throw new Error('Invalid embedded SC5 manifest');
    }
    const targetPath = dataDir + '/' + asset.name;
    if (verifyInstalled(asset, targetPath)) {
      return { name: asset.name, path: targetPath, installed: true, skipped: true };
    }
    if (!io || typeof io.write !== 'function' ||
        typeof io.rename !== 'function') {
      throw new Error('Asset IO unavailable');
    }
    const data = typeof decodeAsset === 'function'
      ? decodeAsset(asset)
      : undefined;
    if (!data || data.length !== asset.bytes) {
      throw new Error('Embedded SC5 checksum mismatch: ' + asset.name);
    }
    if (!hasSc5Magic(data)) {
      throw new Error('Embedded SC5 checksum mismatch: ' + asset.name);
    }
    if (typeof digestOf === 'function' && digestOf(data) !== asset.sha256) {
      throw new Error('Embedded SC5 checksum mismatch: ' + asset.name);
    }
    const tmpPath = dataDir + '/' + tmpPathFor(asset.name);
    io.write(tmpPath, data, SC5_WRITE_MODE);
    const written = io.read(tmpPath);
    if (!written || written.length !== data.length ||
        (typeof digestOf === 'function' &&
         digestOf(written) !== asset.sha256)) {
      log('SC5 write verification failed: ' + asset.name);
      if (typeof io.remove === 'function') {
        io.remove(tmpPath);
      }
      throw new Error('SC5 write verification failed: ' + asset.name);
    }
    io.rename(tmpPath, targetPath);
    return { name: asset.name, path: targetPath, installed: true };
  }

  function installAssets() {
    if (typeof resolveDataDir !== 'function') {
      throw new Error('Current app private directory is not writable');
    }
    const dataDir = resolveDataDir();
    installed.length = 0;
    for (let i = 0; i < SC5_ASSETS.length; i++) {
      const asset = SC5_ASSETS[i];
      const record = installAsset(asset, dataDir);
      installed.push({
        global: asset.source,
        path: record.path,
        sha256: asset.sha256,
        installed: record.installed,
      });
    }
    return installed.slice();
  }

  function setSection(value) {
    if (SECTIONS.indexOf(value) === -1) return section;
    section = value;
    return section;
  }

  function getSection() {
    return section;
  }

  function dispatch(command, payload) {
    if (typeof command !== 'string') return undefined;
    if (command === 'toggle') {
      active = !active;
      return active;
    }
    if (command === 'close') {
      active = false;
      return true;
    }
    if (command === 'tab:battle' || command === 'tab:visual' ||
        command === 'tab:profile' || command === 'tab:about') {
      return setSection(command.slice('tab:'.length));
    }
    if (command === 'menu:motion') {
      motion = payload !== false;
      return motion;
    }
    if (command === 'menu:compact') {
      compact = payload !== false;
      return compact;
    }
    if (command === 'language:en' || command === 'language:ru') {
      language = command.slice('language:'.length);
      return language;
    }
    if (command.indexOf(FEATURE_COMMAND_PREFIX) === 0) {
      const featureKey = command.slice(FEATURE_COMMAND_PREFIX.length);
      if (typeof onToggleFeature === 'function') {
        return onToggleFeature(featureKey, payload);
      }
      return featureKey;
    }
    if (typeof onCommandEvent === 'function') {
      return onCommandEvent(command, payload);
    }
    return undefined;
  }

  function setEnabled(value) {
    state.enabled = value === true;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
    section = SECTIONS[0];
    active = false;
    motion = true;
    compact = false;
    language = 'en';
    if (!saved || typeof saved !== 'object') return;
    if (saved.motion === false) motion = false;
    if (saved.compact === true) compact = true;
    if (saved.language === 'ru') language = 'ru';
    if (SECTIONS.indexOf(saved.section) !== -1) section = saved.section;
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      lastError: state.lastError,
      section: section,
      active: active,
      motion: motion,
      compact: compact,
      language: language,
      catalogSize: CATALOG.length,
      commandCatalogSize: buildCommandCatalog(
        BATTLE_QUICK_ROW.filter((key) => key !== null)
      ).length + 22,
      registered: seen.size,
      installedAssets: installed.length,
    };
  }

  function dispose() {
    state.disposed = true;
  }

  return {
    catalogRecords,
    registerCommand,
    buildCommandCatalog,
    eventCode,
    installAssets,
    setSection,
    getSection,
    dispatch,
    applySaved,
    setEnabled,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  SECTIONS,
  TYPE_NAV,
  TYPE_TOGGLE,
  TYPE_ACTION,
  SECTION_MENU,
  SECTION_SETTINGS,
  SECTION_PROFILE,
  SECTION_COLORS,
  CATALOG,
  ROOT_COMMANDS,
  FIXED_COMMANDS,
  BATTLE_QUICK_ROW,
  WIDGET_DEFAULTS,
  FAMILY_FEATURE,
  FAMILY_TAB,
  FAMILY_MENU,
  FAMILY_QUICK,
  FAMILY_TOOLS,
  FAMILY_POPUP,
  FAMILY_LANGUAGE,
  FAMILY_TELEGRAM,
  FAMILY_SLOT,
  FAMILY_PRESET,
  FAMILY_COLOR_MODE,
  FEATURE_EVENT_BASE,
  EVENT_CODES,
  FEATURE_COMMAND_PREFIX,
  DATA_DIR_SUFFIX,
  DATA_DIR_ENV,
  SC5_NAME_PATTERN,
  SHA256_PATTERN,
  SC5_MIN_BYTES,
  SC5_MAX_BYTES,
  SC5_MAGIC,
  SC5_WRITE_MODE,
  SC_ASSETS_DIR,
  SC5_ASSETS,
  buildCommandCatalog,
  featureEventCode,
  eventCode,
  isValidAsset,
  hasSc5Magic,
  createMenuStructure,
};
