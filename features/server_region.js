'use strict';

const FEATURE_ID = 16;

const SERVER_REGION = 16;

const FEATURE_KEYS = [
  '',
  'aim_bot',
  'auto_dodge',
  'auto_farm',
  'killaura',
  'hold_to_shoot',
  'auto_spin',
  'emotes',
  'follow',
  'xray',
  'goal',
  'ball_assist',
  'ball_trajectory',
  null,
  'anti_afk',
  'mortis_chain',
  'server_region',
  'leon_clone',
  'enemy_ammo',
  'disable_shake',
  'teammate_hp',
  'ally_respawn',
  'dps_counter',
  'camera',
  'chromatic_name',
  'fps_counter',
  'vsync_bypass',
  'server_ip',
];

const MENU_LABEL_EN = 'SERVER REGION';
const MENU_LABEL_RU = 'РЕГИОН';

const CONFIG_KEY = 'serverRegion';
const SERVER_EVENT_PREFIX = 'server:region:';

const PINNED_SERVERS = [
  '212.22.82.57',
  '213.136.70.93',
];

const PINNED_ALIASES = [
  '212.22.82.57.sslip.io',
  '213.136.70.93.sslip.io',
];

const AUTO_REGION = 'auto';

const CMD_REGION_LIST = 43567;
const CMD_CLONE = 13764;
const CMD_CONNECT = 39918;
const CMD_APPLY = 35066;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function regionEvent(region) {
  return SERVER_EVENT_PREFIX + String(region);
}

function isPinned(host) {
  if (PINNED_SERVERS.indexOf(host) !== -1) return true;
  if (PINNED_ALIASES.indexOf(host) !== -1) return true;
  return host === AUTO_REGION;
}

function createServerRegion(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readProfiles = deps.readProfiles;
  const applyRegion = deps.applyRegion;
  const connect = deps.connect;

  let region = AUTO_REGION;
  let profiles = [];
  let connected = null;

  function loadProfiles() {
    if (!readProfiles) return profiles;
    const raw = readProfiles();
    if (!raw || typeof raw !== 'object') return profiles;
    profiles = Array.isArray(raw) ? raw.slice() : [];
    return profiles;
  }

  function regionView() {
    return {
      serverRegion: region,
      profiles: profiles.slice(),
    };
  }

  function cloneProfiles(payload) {
    return JSON.parse(JSON.stringify(payload || profiles));
  }

  function connectView(payload) {
    return {
      base: AUTO_REGION,
      server: payload ? payload.server : payload,
    };
  }

  function dispatch(command, payload) {
    if (command === CMD_REGION_LIST) {
      loadProfiles();
      return regionView();
    }
    if (command === CMD_CLONE) {
      profiles = cloneProfiles(payload);
      return profiles;
    }
    if (command === CMD_CONNECT) {
      connected = connectView(payload);
      return connected;
    }
    if (command === CMD_APPLY) {
      if (applyRegion) {
        return applyRegion(region, payload);
      }
      return region;
    }
    return undefined;
  }

  function setRegion(next) {
    if (next !== AUTO_REGION && !isPinned(next)) {
      state.lastError = 'Unsupported region: ' + String(next);
      return region;
    }
    region = next;
    if (connect) {
      connected = connectView({ server: region });
    }
    return region;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      loadProfiles();
    } else {
      connected = null;
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
    if (saved && typeof saved.region === 'string') {
      region = saved.region;
    }
  }

  function tick() {
    if (!state.enabled) return;
    loadProfiles();
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      region: region,
      profiles: profiles.length,
      connected: connected ? connected.server : null,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    profiles = [];
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    SERVER_REGION,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    CONFIG_KEY,
    FEATURE_KEYS,
    PINNED_SERVERS,
    PINNED_ALIASES,
    label,
    regionEvent,
    isPinned,
    loadProfiles,
    regionView,
    cloneProfiles,
    connectView,
    dispatch,
    setRegion,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SERVER_REGION,
  CONFIG_KEY,
  PINNED_SERVERS,
  PINNED_ALIASES,
  AUTO_REGION,
  label,
  regionEvent,
  isPinned,
  createServerRegion,
};
