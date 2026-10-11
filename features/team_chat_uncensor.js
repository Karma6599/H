'use strict';

const FEATURE_ID = 38;

const TEAM_CHAT_UNCENSOR = 38;

const MENU_LABEL_EN = 'Team chat uncensor';
const MENU_LABEL_RU = 'Aнтицензура команды';

const CHAR_CODE_KEY = [
  116, 101, 97, 109, 95, 99, 104, 97, 116, 95, 117, 110, 99, 101, 110, 115,
  111, 114,
];

const CENSOR_MARK = '*';

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function buildKey() {
  return String.fromCharCode.apply(String, CHAR_CODE_KEY);
}

function isCensored(text) {
  if (typeof text !== 'string' || text.length < 2) return false;
  for (let i = 0; i < text.length; i++) {
    if (text.charAt(i) !== CENSOR_MARK) return false;
  }
  return true;
}

function createTeamChatUncensor(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const readOriginalMessage = deps.readOriginalMessage;
  const writeMessage = deps.writeMessage;

  let restored = 0;

  function restore(message) {
    if (!state.enabled) return message;
    if (!isCensored(message && message.censored)) return message;
    try {
      const original = readOriginalMessage
        ? readOriginalMessage(message)
        : null;
      if (typeof original === 'string' && original.length > 0) {
        restored++;
        if (writeMessage) {
          writeMessage(message, original);
        }
        return Object.assign({}, message, { censored: original });
      }
    } catch (err) {
      state.lastError = String(err);
    }
    return message;
  }

  function setEnabled(value) {
    state.enabled = value === true;
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
      restored: restored,
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
    TEAM_CHAT_UNCENSOR,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    FEATURE_KEY: buildKey(),
    label,
    buildKey,
    isCensored,
    restore,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  TEAM_CHAT_UNCENSOR,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  label,
  buildKey,
  isCensored,
  createTeamChatUncensor,
};
