'use strict';

const FEATURE_ID = 27;

const SERVER_IP = 27;

const MENU_LABEL_EN = 'IP HUD';
const MENU_LABEL_RU = 'IP HUD';

const WIDGET_LABEL_EN = 'FPS / IP';

const REFRESH_INTERVAL_MS = 1000;

function createServerIp(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readServerAddress = deps.readServerAddress;
  const measureLatency = deps.measureLatency;
  const render = deps.render;

  let address = '';
  let latencyMs = null;
  let lastRefreshAt = 0;

  function formatLine(fps) {
    const ip = address || '...';
    const latency = latencyMs === null ? '' :
      ' \u00b7 ' + Math.round(latencyMs) + ' ms';
    return WIDGET_LABEL_EN + ' ' + ip + latency +
      (fps !== undefined ? ' \u00b7 ' + fps : '');
  }

  function refresh(now) {
    if (readServerAddress) {
      const next = readServerAddress();
      if (typeof next === 'string') address = next;
    }
    if (measureLatency) {
      const measured = measureLatency();
      if (typeof measured === 'number' && isFinite(measured)) {
        latencyMs = measured;
      }
    }
    lastRefreshAt = now;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      refresh(Date.now());
      if (render) render(formatLine());
    } else if (render) {
      render('');
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick(now, fps) {
    if (!state.enabled) return;
    if (typeof now !== 'number') now = Date.now();
    if (now - lastRefreshAt >= REFRESH_INTERVAL_MS) {
      refresh(now);
    }
    if (render) {
      render(formatLine(fps));
    }
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      address: address,
      latencyMs: latencyMs,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    address = '';
    latencyMs = null;
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    SERVER_IP,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    WIDGET_LABEL_EN,
    REFRESH_INTERVAL_MS,
    formatLine,
    refresh,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  SERVER_IP,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  WIDGET_LABEL_EN,
  REFRESH_INTERVAL_MS,
  createServerIp,
};
