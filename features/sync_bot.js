'use strict';

const FEATURE_ID = 29;

const SYNC_BOT = 29;

const MENU_LABEL_EN = 'Bot sync';
const MENU_LABEL_RU = 'Связь с ботом';

const CHAR_CODE_KEY = [115, 121, 110, 99, 95, 98, 111, 116];

const DESCRIPTION_EN =
  'Reports the farm to the Telegram bot and lets you ' +
  'control it from there';

const VIEW_KEYS = ['settings', 'stats', 'runtime'];

const STATUS_ON = 'on';
const STATUS_OFF = 'off';

const ROW_WIDTH = 152;
const ROW_HEIGHT = 1;

const FARM_TAG = 'autofarm:';

const COMMANDS = ['open', 'close', 'action'];

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function formatStatusRow(name, value) {
  return FARM_TAG + name + '=' + String(value);
}

function createSyncBot(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const transport = deps.transport;
  const readFarmStatus = deps.readFarmStatus;
  const readFarmStats = deps.readFarmStats;
  const readFarmRuntime = deps.readFarmRuntime;
  const onCommand = deps.onCommand;

  const views = {
    settings: null,
    stats: null,
    runtime: null,
  };
  const rows = [];
  const sentAt = new Map();

  let mounted = false;
  let lastReportAt = 0;

  function snapshot() {
    return {
      settings: views.settings,
      stats: views.stats,
      runtime: views.runtime,
    };
  }

  function refreshViews() {
    views.settings = readFarmSettings();
    views.stats = readFarmStats ? readFarmStats() : null;
    views.runtime = readFarmRuntime ? readFarmRuntime() : null;
  }

  function readFarmSettings() {
    if (!readFarmStatus) return null;
    const raw = readFarmStatus();
    if (!raw) return null;
    rows.length = 0;
    rows.push(formatStatusRow(STATUS_ON, raw.on ? 1 : 0));
    if (raw.mode !== undefined) {
      rows.push(formatStatusRow('mode', raw.mode));
    }
    if (raw.targetTrophies !== undefined) {
      rows.push(formatStatusRow('target', raw.targetTrophies));
    }
    return { rows: rows.slice() };
  }

  function report(now) {
    if (!transport || !transport.post) return false;
    try {
      const body = {
        views: VIEW_KEYS.reduce((acc, key) => {
          acc[key] = views[key];
          return acc;
        }, {}),
        status: rows.slice(),
        at: now,
      };
      const sent = transport.post('/sync', body);
      lastReportAt = now;
      return sent !== false;
    } catch (err) {
      state.lastError = String(err);
      return false;
    }
  }

  function dispatch(command, payload) {
    if (COMMANDS.indexOf(command) === -1) return undefined;
    if (command === 'open') {
      mounted = true;
      refreshViews();
      return snapshot();
    }
    if (command === 'close') {
      mounted = false;
      return true;
    }
    if (onCommand) {
      return onCommand(payload);
    }
    return undefined;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      refreshViews();
    } else {
      mounted = false;
      rows.length = 0;
      sentAt.clear();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    refreshViews();
    if (transport && transport.reportIntervalMs &&
        lastReportAt !== 0 &&
        now - lastReportAt < transport.reportIntervalMs) {
      return;
    }
    report(now);
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      mounted: mounted,
      views: VIEW_KEYS.filter((key) => views[key] !== null),
      lastReportAt: lastReportAt,
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
    SYNC_BOT,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    DESCRIPTION_EN,
    FEATURE_KEY: buildKey(),
    VIEW_KEYS,
    label,
    buildKey,
    formatStatusRow,
    snapshot,
    refreshViews,
    report,
    dispatch,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SYNC_BOT,
  VIEW_KEYS,
  label,
  buildKey,
  formatStatusRow,
  createSyncBot,
};
