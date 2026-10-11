'use strict';

const PRESENCE_PATH = '/presence';
const PRESENCE_START_PATH = '/presence/start';

const SESSION_TIMEOUT_MS = 20000;

const EVENTS = {
  close: 'presence:close',
  previous: 'presence:prev',
  next: 'presence:next',
  body: 'presence:body',
  row: 'presence:row:',
};

const PANEL_KEY = 'presence';

const INVALID_RESPONSE = 'Invalid presence response';

function createPresence(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const transport = deps.transport;
  const readTag = deps.readTag;
  const readAccount = deps.readAccount;

  let session = null;
  let page = 0;
  let rows = [];
  let closing = false;

  function start() {
    if (session) return session;
    const tag = readTag ? readTag() : null;
    if (!transport || !transport.post || !tag) return null;
    try {
      const response = transport.post(PRESENCE_START_PATH, { tag: tag });
      if (!response || !Number.isInteger(response.ok) ||
          !Number.isInteger(response.token)) {
        throw new Error(INVALID_RESPONSE);
      }
      session = {
        tag: tag,
        token: response.token,
        account: readAccount ? readAccount() : null,
        grant: response.grant !== undefined ? response.grant : null,
      };
    } catch (err) {
      state.lastError = String(err);
      session = null;
    }
    return session;
  }

  function leave() {
    if (!session || closing) return;
    closing = true;
    try {
      if (transport && transport.post) {
        transport.post(PRESENCE_PATH, { leave: session.token });
      }
    } catch (err) {
      state.lastError = String(err);
    } finally {
      session = null;
      closing = false;
      page = 0;
      rows = [];
    }
  }

  function refresh() {
    if (!session || !transport || !transport.post) return rows;
    try {
      const response = transport.post(PRESENCE_PATH, {
        tag: session.tag,
        account: session.account,
        grant: session.grant,
      });
      if (!response || !Array.isArray(response.rows)) {
        throw new Error(INVALID_RESPONSE);
      }
      rows = response.rows.slice();
    } catch (err) {
      state.lastError = String(err);
    }
    return rows;
  }

  function dispatch(event, payload) {
    if (event === EVENTS.close) {
      leave();
      return true;
    }
    if (event === EVENTS.previous) {
      page = Math.max(0, page - 1);
      return page;
    }
    if (event === EVENTS.next) {
      page = page + 1;
      return page;
    }
    if (event === EVENTS.body) {
      return rows;
    }
    if (typeof event === 'string' && event.indexOf(EVENTS.row) === 0) {
      const index = Number(event.slice(EVENTS.row.length)) | 0;
      return rows[index] !== undefined ? rows[index] : null;
    }
    return undefined;
  }

  function setEnabled(value) {
    const on = value === true;
    if (on === state.enabled) return state.enabled;
    state.enabled = on;
    if (on) {
      start();
      refresh();
    } else {
      leave();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick() {
    if (!state.enabled) return;
    if (!session) start();
    if (session) refresh();
  }

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      session: session ? { tag: session.tag } : null,
      page: page,
      rows: rows.length,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    setEnabled(false);
    state.disposed = true;
  }

  return {
    PRESENCE_PATH,
    PRESENCE_START_PATH,
    SESSION_TIMEOUT_MS,
    EVENTS,
    PANEL_KEY,
    start,
    leave,
    refresh,
    dispatch,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  PRESENCE_PATH,
  PRESENCE_START_PATH,
  SESSION_TIMEOUT_MS,
  EVENTS,
  PANEL_KEY,
  INVALID_RESPONSE,
  createPresence,
};
