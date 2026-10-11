'use strict';

const FEATURE_ID = 7;

const EMOTES = 7;

const MENU_LABEL_EN = 'EMOTES';
const MENU_LABEL_RU = 'ЭМОЦИИ';
const EMOTE_HUD_LABEL_EN = 'Emote button at the screen edge';
const EMOTE_HUD_LABEL_RU = 'Кнопка эмоций у края экрана';

const EMOTE_EVENTS = [
  'emotes:open',
  'emotes:close',
  'emotes:stop',
  'emotes:previous',
  'emotes:next',
];

const EMOTE_TRANSPORT_PATH = '/emotes';
const EMOTE_TRANSPORT_METHOD = 'POST';
const EMOTE_TRANSPORT_CLOSED = 'Emote transport closed';
const EMOTE_SESSION_UNAVAILABLE = 'Presence session unavailable';

const OPTION_KEYS = [
  'emoteHud',
  'emoteRepeat',
  'emoteSpeed',
];
const IDX_EMOTE_HUD = 0;
const IDX_EMOTE_REPEAT = 1;
const IDX_EMOTE_SPEED = 2;

const DEFAULT_EMOTE_SPEED = 1;
const MIN_EMOTE_SPEED = 0;
const MAX_EMOTE_SPEED = 5;

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function emoteHudLabel(language) {
  return language === 'ru' ? EMOTE_HUD_LABEL_RU : EMOTE_HUD_LABEL_EN;
}

function createEmotes(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    hudOpen: false,
    slot: 0,
    repeat: false,
    speed: DEFAULT_EMOTE_SPEED,
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const sendEvent = deps.sendEvent;
  const postEmote = deps.postEmote;

  function buildOptions(saved) {
    const opts = saved || {};
    state.repeat = opts[OPTION_KEYS[IDX_EMOTE_REPEAT]] === true;
    const rawSpeed = Number(opts[OPTION_KEYS[IDX_EMOTE_SPEED]]);
    state.speed = Number.isFinite(rawSpeed)
      ? Math.max(MIN_EMOTE_SPEED, Math.min(MAX_EMOTE_SPEED, rawSpeed))
      : DEFAULT_EMOTE_SPEED;
    return opts;
  }

  function send(event) {
    if (!sendEvent) return false;
    sendEvent(event, { slot: state.slot, repeat: state.repeat });
    return true;
  }

  function open() {
    if (!state.enabled || state.hudOpen) return false;
    state.hudOpen = true;
    send(EMOTE_EVENTS[0]);
    return true;
  }

  function close() {
    if (!state.hudOpen) return false;
    state.hudOpen = false;
    send(EMOTE_EVENTS[1]);
    return true;
  }

  function stop() {
    state.repeat = false;
    send(EMOTE_EVENTS[2]);
    return true;
  }

  function previous() {
    if (!state.hudOpen) return false;
    state.slot -= 1;
    send(EMOTE_EVENTS[3]);
    return true;
  }

  function next() {
    if (!state.hudOpen) return false;
    state.slot += 1;
    send(EMOTE_EVENTS[4]);
    return true;
  }

  function emit(emoteId) {
    if (!state.enabled) return false;
    if (!postEmote) return false;
    try {
      return postEmote(EMOTE_TRANSPORT_PATH, EMOTE_TRANSPORT_METHOD, {
        slot: state.slot,
        emoteId,
        repeat: state.repeat,
        speed: state.speed,
      });
    } catch (e) {
      state.lastError = String(e && e.message ? e.message : e);
      log(state.lastError);
      return false;
    }
  }

  function setEnabled(value) {
    state.enabled = value === true;
    if (!state.enabled) {
      close();
      state.repeat = false;
    }
    return state.enabled;
  }

  function applySaved(saved) {
    buildOptions(saved);
    state.enabled = saved ? saved.enabled === true : false;
  }

  function tick() {
    if (state.enabled && state.repeat && state.hudOpen) {
      emit(state.slot);
    }
  }

  function getState() {
    return {
      enabled: state.enabled,
      hudOpen: state.hudOpen,
      slot: state.slot,
      repeat: state.repeat,
      speed: state.speed,
      disposed: state.disposed,
      lastError: state.lastError,
    };
  }

  function dispose() {
    close();
    state.disposed = true;
  }

  return {
    FEATURE_ID,
    setEnabled,
    applySaved,
    open,
    close,
    stop,
    previous,
    next,
    emit,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  EMOTE_EVENTS,
  OPTION_KEYS,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  emoteHudLabel,
  createEmotes,
};
