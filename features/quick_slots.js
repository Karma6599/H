'use strict';

const CONFIG_SLOTS_KEY = 'quickSlots';
const CONFIG_POSITION_KEY = 'quickPosition';
const CONFIG_PINS_KEY = 'usePins';

const LOG_TAG = 'quick:';

const EVENTS = {
  body: 'quick:body',
  main: 'quick:main',
  pin: 'quick:pin',
  edit: 'quick:edit',
  close: 'quick:close',
  toggle: 'quick:toggle',
  pickCancel: 'quick:pick:cancel',
  remove: 'quick:remove',
  slot: 'quick:slot:',
  choose: 'quick:choose:',
  category: 'quick:category:',
};

const MENU_LABEL_EN = 'QUICK ACCESS';
const MENU_LABEL_RU = 'БЫСТРЫЙ ДОСТУП';

const CHOOSE_BUTTON_LABEL_EN = 'CHOOSE A BUTTON';
const PINNED_LABEL_EN = 'PINNED';

const DEFAULT_SLOT_COUNT = 4;

const POSITION_X = 0.5;
const POSITION_Y = 0.5;

function createQuickSlots(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const onToggleFeature = deps.onToggleFeature;
  const listFeatures = deps.listFeatures;

  let slotCount = DEFAULT_SLOT_COUNT;
  let position = { x: POSITION_X, y: POSITION_Y };
  let usePins = true;
  let slots = [];
  let editing = false;
  let pickingSlot = -1;
  let pickingCategory = '';

  function defaultSlots() {
    return new Array(slotCount).fill(null);
  }

  function slotEvent(index) {
    return EVENTS.slot + String(index);
  }

  function chooseEvent(featureKey) {
    return EVENTS.choose + String(featureKey);
  }

  function categoryEvent(category) {
    return EVENTS.category + String(category);
  }

  function beginEdit() {
    editing = true;
    pickingSlot = -1;
    pickingCategory = '';
    return { editing: editing, slots: slots.slice() };
  }

  function beginPick(slot, category) {
    if (!editing) return false;
    pickingSlot = slot;
    pickingCategory = String(category || '');
    return true;
  }

  function cancelPick() {
    pickingSlot = -1;
    pickingCategory = '';
  }

  function assignSlot(slot, featureKey) {
    if (slot < 0 || slot >= slotCount) return false;
    if (featureKey !== null &&
        listFeatures && listFeatures().indexOf(featureKey) === -1) {
      return false;
    }
    slots[slot] = featureKey || null;
    return true;
  }

  function removeSlot(slot) {
    if (slot < 0 || slot >= slotCount) return false;
    const had = slots[slot] !== null;
    slots[slot] = null;
    return had;
  }

  function activateSlot(slot) {
    if (slot < 0 || slot >= slotCount) return undefined;
    const featureKey = slots[slot];
    if (!featureKey) return undefined;
    if (onToggleFeature) {
      return onToggleFeature(featureKey);
    }
    return featureKey;
  }

  function dispatch(event, payload) {
    if (event === EVENTS.body) {
      return { slots: slots.slice(), position: position, usePins: usePins };
    }
    if (event === EVENTS.main) {
      return slots.map((key) => key === null ? null : {
        key: key,
        pinned: usePins,
      });
    }
    if (event === EVENTS.edit) {
      return beginEdit();
    }
    if (event === EVENTS.close) {
      editing = false;
      cancelPick();
      return true;
    }
    if (event === EVENTS.pin) {
      usePins = payload !== false;
      return usePins;
    }
    if (event === EVENTS.toggle) {
      return activateSlot(Number(payload) | 0);
    }
    if (event === EVENTS.pickCancel) {
      cancelPick();
      return true;
    }
    if (event === EVENTS.remove) {
      return removeSlot(Number(payload) | 0);
    }
    if (typeof event === 'string' && event.indexOf(EVENTS.slot) === 0) {
      return beginPick(
        Number(event.slice(EVENTS.slot.length)) | 0,
        pickingCategory
      );
    }
    if (typeof event === 'string' && event.indexOf(EVENTS.choose) === 0) {
      const featureKey = event.slice(EVENTS.choose.length);
      if (pickingSlot < 0) return false;
      const ok = assignSlot(pickingSlot, featureKey);
      cancelPick();
      return ok;
    }
    if (typeof event === 'string' && event.indexOf(EVENTS.category) === 0) {
      pickingCategory = event.slice(EVENTS.category.length);
      return listFeatures
        ? listFeatures().filter((key) => key.indexOf(pickingCategory) === 0)
        : [];
    }
    return undefined;
  }

  function applySaved(saved) {
    slotCount = DEFAULT_SLOT_COUNT;
    position = { x: POSITION_X, y: POSITION_Y };
    usePins = true;
    slots = defaultSlots();
    if (!saved || typeof saved !== 'object') return;
    if (Number.isInteger(saved[CONFIG_SLOTS_KEY])) {
      slotCount = saved[CONFIG_SLOTS_KEY];
    }
    if (saved[CONFIG_POSITION_KEY] &&
        typeof saved[CONFIG_POSITION_KEY].x === 'number' &&
        typeof saved[CONFIG_POSITION_KEY].y === 'number') {
      position = {
        x: saved[CONFIG_POSITION_KEY].x,
        y: saved[CONFIG_POSITION_KEY].y,
      };
    }
    if (saved[CONFIG_PINS_KEY] === false) {
      usePins = false;
    }
    if (Array.isArray(saved.slots)) {
      slots = saved.slots.slice(0, slotCount);
      while (slots.length < slotCount) slots.push(null);
    }
  }

  function setEnabled(value) {
    state.enabled = value === true;
    if (state.enabled && slots.length === 0) {
      slots = defaultSlots();
    }
    return state.enabled;
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      slotCount: slotCount,
      position: position,
      usePins: usePins,
      slots: slots.slice(),
      editing: editing,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    state.enabled = false;
    editing = false;
    slots = [];
    state.disposed = true;
  }

  return {
    CONFIG_SLOTS_KEY,
    CONFIG_POSITION_KEY,
    CONFIG_PINS_KEY,
    LOG_TAG,
    EVENTS,
    MENU_LABEL_EN,
    MENU_LABEL_RU,
    CHOOSE_BUTTON_LABEL_EN,
    PINNED_LABEL_EN,
    slotEvent,
    chooseEvent,
    categoryEvent,
    beginEdit,
    beginPick,
    cancelPick,
    assignSlot,
    removeSlot,
    activateSlot,
    dispatch,
    applySaved,
    setEnabled,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  CONFIG_SLOTS_KEY,
  CONFIG_POSITION_KEY,
  CONFIG_PINS_KEY,
  LOG_TAG,
  EVENTS,
  MENU_LABEL_EN,
  MENU_LABEL_RU,
  DEFAULT_SLOT_COUNT,
  POSITION_X,
  POSITION_Y,
  createQuickSlots,
};
