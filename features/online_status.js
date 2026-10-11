'use strict';

const FEATURE_ID = 37;

const ONLINE_STATUS = 37;

const MENU_LABEL_EN = 'Online status';
const MENU_LABEL_RU = 'Статус в сети';

const CHAR_CODE_KEY = [111, 110, 108, 105, 110, 101, 95, 115, 116, 97, 116, 117, 115];

const REFRESH_INTERVAL_MS = 20000;

const STATUS_ONLINE = 'online';
const STATUS_OFFLINE = 'offline';

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function createOnlineStatus(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readPresenceRows = deps.readPresenceRows;
  const render = deps.render;

  const statuses = new Map();
  let lastRefreshAt = 0;

  function refresh(now) {
    const rows = readPresenceRows ? readPresenceRows() : [];
    for (const row of rows || []) {
      if (!row || row.tag === undefined) continue;
      statuses.set(row.tag, row.online ? STATUS_ONLINE : STATUS_OFFLINE);
    }
    lastRefreshAt = now;
  }

  function statusOf(tag) {
    return statuses.get(tag) || STATUS_OFFLINE;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      refresh(Date.now());
    } else {
      statuses.clear();
      if (render) render('');
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    if (now - lastRefreshAt >= REFRESH_INTERVAL_MS) {
      refresh(now);
    }
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      tracked: statuses.size,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    statuses.clear();
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    ONLINE_STATUS,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    FEATURE_KEY: buildKey(),
    STATUS_ONLINE,
    STATUS_OFFLINE,
    REFRESH_INTERVAL_MS,
    label,
    buildKey,
    refresh,
    statusOf,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  ONLINE_STATUS,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  STATUS_ONLINE,
  STATUS_OFFLINE,
  REFRESH_INTERVAL_MS,
  label,
  buildKey,
  createOnlineStatus,
};
