'use strict';

const SETTINGS_VERSION = 1;
const MAX_BRAWLER_ENTRIES = 1024;
const BRAWLER_ID_PATTERN = /^(0|[1-9]\d{0,5})$/;

const SETTINGS_CODEC_GROUP_GLOBAL = 23;
const SETTINGS_CODEC_GROUP_ENTRY = 2;

const IDENTITY_ERROR = 'Brawler identity function unavailable';
const IDENTITY_PREFIX = 'Brawler identity ';
const IDENTITY_NATIVE_OFFSET = 47701;
const IDENTITY_RANGE_PROBE = 'r';

const GRID_LAYOUT = [330, 14, 10];
const GRID_SPRITES = ['panel_background', 'border_top'];
const LOADING_LABELS = ['LOADING BRAWLERS…', 'ЗАГРУЗКА БОЙЦОВ…'];
const LANGUAGE_RU = 1795;

const CATALOG_TITLE = 'BRAWLERS';
const CATALOG_ANY = 'ANY ELIGIBLE BRAWLER';
const CATALOG_LOCKED = 'LOCKED';
const CATALOG_NOT_RELEASED = 'NOT RELEASED';
const PICKER_HINT = 'Scroll and choose one or more brawlers';
const GLOBAL_SWITCH_LABELS = ['USE GLOBAL SETTINGS', 'ОБЩИЕ НАСТРОЙКИ'];
const EMPTY_STATE_LABEL = 'Waiting for brawler';
const EMPTY_STATE_LABEL_PICKER = 'Waiting for brawler…';
const LOBBY_HINTS = [
  'Brawler details refresh in the lobby',
  'Данные бойцов обновятся в лобби',
];
const HUD_GLOBAL_LABEL = 'GLOBAL';
const BAN_LIST_TITLE = 'AUTO DODGE — BAN LIST';

const AUTO_FARM_UI_ERROR = 'Auto Farm UI helper missing';

const DODGE_OPTION_BAN_LIST = 5;
const DODGE_OPTION_AGGRESSIVENESS = 6;

const FARM_OPTION_ENABLED = 0;
const FARM_OPTION_SELECTED_BRAWLERS = 1;
const FARM_OPTION_ATTACK = 3;
const FARM_OPTION_FOLLOW = 4;
const FARM_OPTION_AUTO_SWITCH = 5;
const FARM_OPTION_AUTO_START = 6;
const FARM_OPTION_USE_SUPER = 7;
const FARM_OPTION_USE_HYPER = 8;
const FARM_OPTION_USE_GADGETS = 9;
const FARM_OPTION_USE_PINS = 10;

function getBrawlerIdentity(deps) {
  const probe = deps.identityProbe;
  if (typeof probe !== 'function') {
    throw new Error(IDENTITY_ERROR);
  }
  const range = Module.findRangeByAddress(deps.identityAddress);
  range.indexOf(IDENTITY_RANGE_PROBE);
  const readIdentity = new NativeFunction(
    ptr(deps.base).add(IDENTITY_NATIVE_OFFSET),
    'pointer',
    ['pointer']);
  const identity = readIdentity(range);
  if (deps.log) {
    deps.log(IDENTITY_PREFIX + deps.identityAddress);
  }
  return identity;
}

function createBrawlerIdentityModule(deps) {
  const manager = () => getBrawlerIdentity(deps);
  const homeMode = () => deps.homeMode;
  const avatar = () => deps.avatar;

  return {
    manager: manager,
    homeMode: homeMode,
    avatar: avatar,
    getBrawlerIdentity: () => getBrawlerIdentity(deps),
  };
}

function mapBrawlerEntry(entry, encode) {
  return [String(entry[0]), {
    name: entry[1],
    settings: encode(SETTINGS_CODEC_GROUP_ENTRY, entry[2]),
  }];
}

function serializeBrawlerSettings(state, encode) {
  if (!state) return null;
  return {
    version: state[0],
    autoSwitch: state[1],
    global: encode(SETTINGS_CODEC_GROUP_GLOBAL, state[2]),
    byBrawler: Object.fromEntries(
      (state[3] || []).map((entry) => mapBrawlerEntry(entry, encode))),
  };
}

function validateBrawlerSettings(value, normalize) {
  if (!value || typeof value !== 'object') return null;
  let globalBlock = value.global;
  if (Array.isArray(globalBlock) || typeof globalBlock !== 'object') {
    globalBlock = normalize(globalBlock);
  }
  const autoSwitch = value.autoSwitch === true;
  const byBrawler = {};
  if (value.byBrawler && typeof value.byBrawler === 'object') {
    const keys = Object.keys(value.byBrawler);
    const cap = Math.min(keys.length, MAX_BRAWLER_ENTRIES);
    for (let i = 0; i < cap; i++) {
      const key = keys[i];
      const entry = value.byBrawler[key];
      if (!BRAWLER_ID_PATTERN.test(key)) continue;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        continue;
      }
      if (typeof entry.name !== 'string') continue;
      if (!Array.isArray(entry.settings)) continue;
      byBrawler[key] = {
        name: entry.name,
        settings: entry.settings,
      };
    }
  }
  return {
    version: SETTINGS_VERSION,
    autoSwitch: autoSwitch,
    global: globalBlock,
    byBrawler: byBrawler,
  };
}

function createBrawlerStore(deps) {
  const encode = deps.encodeSettings;
  const decode = deps.decodeSettings;
  const normalize = deps.normalizeGlobal || ((value) => value || {});
  const state = [SETTINGS_VERSION, true, deps.defaultSettings(), []];

  function serialize() {
    return serializeBrawlerSettings(state, encode);
  }

  function apply(value) {
    const saved = validateBrawlerSettings(value, normalize);
    if (!saved) return false;
    state[0] = saved.version;
    state[1] = saved.autoSwitch;
    state[2] = decode(SETTINGS_CODEC_GROUP_GLOBAL, saved.global);
    const entries = [];
    for (const key of Object.keys(saved.byBrawler)) {
      const entry = saved.byBrawler[key];
      entries.push([
        Number(key),
        entry.name,
        decode(SETTINGS_CODEC_GROUP_ENTRY, entry.settings),
      ]);
    }
    state[3] = entries;
    return true;
  }

  function getSettings(brawlerId, brawlerName) {
    if (state[1]) return state[2];
    const entry = state[3].find(
      (candidate) => String(candidate[0]) === String(brawlerId));
    if (!entry) return state[2];
    return entry[2];
  }

  function setSettings(brawlerId, brawlerName, settings) {
    const entry = state[3].find(
      (candidate) => String(candidate[0]) === String(brawlerId));
    if (entry) {
      entry[1] = brawlerName;
      entry[2] = settings;
      return true;
    }
    if (state[3].length >= MAX_BRAWLER_ENTRIES) return false;
    state[3].push([brawlerId, brawlerName, settings]);
    return true;
  }

  function setAutoSwitch(on) {
    state[1] = on === true;
    return state[1];
  }

  function getState() {
    return {
      version: state[0],
      autoSwitch: state[1],
      global: state[2],
      byBrawler: state[3].map(
        (entry) => mapBrawlerEntry(entry, encode)),
    };
  }

  return {
    serialize: serialize,
    apply: apply,
    getSettings: getSettings,
    setSettings: setSettings,
    setAutoSwitch: setAutoSwitch,
    getState: getState,
  };
}

function createBrawlersPage(deps) {
  const store = deps.store;
  const language = deps.language;
  const views = deps.views || {};

  function overrideSwitchLabel() {
    return language === LANGUAGE_RU
      ? GLOBAL_SWITCH_LABELS[1]
      : GLOBAL_SWITCH_LABELS[0];
  }

  function renderOverrideSwitch() {
    return {
      label: overrideSwitchLabel(),
      checked: store.getState().autoSwitch,
      toggle: (on) => store.setAutoSwitch(on),
    };
  }

  function renderEmptyState() {
    return {
      label: EMPTY_STATE_LABEL,
      hint: language === LANGUAGE_RU ? LOBBY_HINTS[1] : LOBBY_HINTS[0],
    };
  }

  function render() {
    if (!views.brawlers || views.brawlers.length === 0) {
      return renderEmptyState();
    }
    return {
      label: CATALOG_TITLE,
      autoSwitch: renderOverrideSwitch(),
      rows: views.brawlers,
    };
  }

  return {
    render: render,
    renderOverrideSwitch: renderOverrideSwitch,
    renderEmptyState: renderEmptyState,
  };
}

function createBrawlerGrid(deps) {
  const autoFarmUi = deps.autoFarmUiHelper;
  const language = deps.language;
  const sprites = deps.sprites || {};
  const listFields = deps.listFields || [];

  if (!autoFarmUi) {
    throw new Error(AUTO_FARM_UI_ERROR + ': ' + String(deps.uiKey));
  }

  function loadingLabel() {
    return language === LANGUAGE_RU
      ? LOADING_LABELS[1]
      : LOADING_LABELS[0];
  }

  function render(catalog) {
    if (!catalog || catalog.length === 0) {
      return {
        label: loadingLabel(),
        layout: GRID_LAYOUT,
        sprites: [sprites.panel_background, sprites.border_top],
      };
    }
    const rows = [];
    for (const entry of catalog) {
      const state = entry.released === false
        ? CATALOG_NOT_RELEASED
        : entry.unlocked === false
          ? CATALOG_LOCKED
          : CATALOG_ANY;
      rows.push({
        id: entry.id,
        name: deps.brawlerName(entry.id),
        state: state,
        anyEligible: state === CATALOG_ANY,
      });
    }
    return {
      label: CATALOG_TITLE,
      layout: GRID_LAYOUT,
      sprites: [sprites.panel_background, sprites.border_top],
      rows: rows,
      membership: listFields,
    };
  }

  return {
    render: render,
    loadingLabel: loadingLabel,
  };
}

function createBanListPicker(deps) {
  const store = deps.store;
  const options = deps.dodgeOptions;

  function render() {
    return {
      title: BAN_LIST_TITLE,
      hint: PICKER_HINT,
      ignored: options[DODGE_OPTION_BAN_LIST] || [],
    };
  }

  function toggle(brawlerId, brawlerName) {
    const ignored = options[DODGE_OPTION_BAN_LIST] || [];
    const index = ignored.indexOf(brawlerId);
    if (index >= 0) {
      ignored.splice(index, 1);
    } else {
      ignored.push(brawlerId);
    }
    options[DODGE_OPTION_BAN_LIST] = ignored;
    return ignored;
  }

  return {
    render: render,
    toggle: toggle,
  };
}

function renderHudStatus(views, language) {
  const current = views.currentBrawler;
  const label = current
    ? 'BRAWLER ' + current.name
    : views.waiting
      ? EMPTY_STATE_LABEL
      : HUD_GLOBAL_LABEL;
  return {
    label: label,
    hint: language === LANGUAGE_RU ? LOBBY_HINTS[1] : LOBBY_HINTS[0],
  };
}

function createBrawlersFeature(deps) {
  const store = createBrawlerStore(deps);
  const identity = createBrawlerIdentityModule(deps);
  const page = createBrawlersPage(
    Object.assign({}, deps, {store: store}));
  const grid = deps.autoFarmUiHelper
    ? createBrawlerGrid(deps)
    : null;
  const banListPicker = createBanListPicker(deps);

  function getEffectiveSettings(brawlerId, brawlerName) {
    return store.getSettings(brawlerId, brawlerName);
  }

  function getState() {
    return {
      store: store.getState(),
      hud: renderHudStatus(deps.views || {}, deps.language),
      catalog: {
        title: CATALOG_TITLE,
        any: CATALOG_ANY,
        locked: CATALOG_LOCKED,
        notReleased: CATALOG_NOT_RELEASED,
      },
    };
  }

  return {
    identity: identity,
    store: store,
    page: page,
    grid: grid,
    banListPicker: banListPicker,
    getEffectiveSettings: getEffectiveSettings,
    renderHudStatus: renderHudStatus,
    getState: getState,
  };
}

module.exports = {
  getBrawlerIdentity,
  createBrawlerIdentityModule,
  serializeBrawlerSettings,
  validateBrawlerSettings,
  createBrawlerStore,
  createBrawlersPage,
  createBrawlerGrid,
  createBanListPicker,
  createBrawlersFeature,
};
