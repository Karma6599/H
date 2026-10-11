'use strict';

const FEATURE_ID = 20;

const TEAMMATE_HP = 20;

const MENU_LABEL_EN = 'TEAMMATE_HP';
const MENU_LABEL_RU = 'Здоровье союзников';
const SETTINGS_KEY = 'teammate_hp';

const WIDGET_TICK_MS = 120;

const MAX_SLOTS = 64;

const ROW_PREFIX_NONE = '';

const COUNTER_KEYS = [
  'frames',
  'rows',
  'scans',
  'skipped',
  'errors',
];

const ENTITY_FIELDS = {
  slot: 24,
  team: 40,
  state: 56,
  hp: 132,
};

const FIELD_SLOT = 'slot';
const FIELD_TEAM = 'team';
const FIELD_STATE = 'state';
const FIELD_HP = 'hp';

function label(language) {
  return language === 'ru' ? MENU_LABEL_RU : MENU_LABEL_EN;
}

function clampRatio(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function formatRow(index, name, percent, color) {
  return '<c' + color + '>' + (index + 1) + '. ' + name + ': ' +
    percent + '%</c>';
}

function createTeammateHp(deps) {
  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const battleList = deps.battleList;
  const stride = deps.stride;
  const readSlot = deps.readSlot;
  const readTeam = deps.readTeam;
  const readState = deps.readState;
  const readHp = deps.readHp;
  const readMaxHp = deps.readMaxHp;
  const hpColor = deps.hpColor;
  const isUsable = deps.isUsable;

  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
    battleKey: '',
    lastRun: 0,
    rows: [],
    ownTeam: null,
    ownSlot: null,
  };

  const counters = Object.fromEntries(COUNTER_KEYS.map((key) => [key, 0]));

  function isRuntimeActive() {
    if (!state.enabled || state.disposed) return false;
    if (typeof deps.isVisualRuntimeEnabled === 'function') {
      return deps.isVisualRuntimeEnabled();
    }
    return true;
  }

  function beginBattle(battleKey) {
    state.battleKey = battleKey === undefined ? '' : battleKey;
    state.rows.length = 0;
    state.ownTeam = null;
    state.ownSlot = null;
    if (typeof deps.beginBattle === 'function') {
      deps.beginBattle(battleKey);
    }
  }

  function readOwnIdentity() {
    if (typeof deps.readOwnIdentity !== 'function') {
      return undefined;
    }
    return deps.readOwnIdentity();
  }

  function collectTeammates() {
    const list = [];
    const count = battleList.length;
    for (let i = 0; i < count; i++) {
      const entity = battleList.add(i * stride).readPointer();
      if (entity.isNull()) continue;
      const slot = readSlot(entity, ENTITY_FIELDS.slot);
      if (slot === state.ownSlot) continue;
      const team = readTeam(entity, ENTITY_FIELDS.team);
      if (team !== state.ownTeam) continue;
      if (slot < 0 || slot >= MAX_SLOTS) continue;
      const entityState = readState(entity, ENTITY_FIELDS.state);
      if (!entityState || !isUsable(entity, entityState)) continue;
      list.push({
        index: list.length,
        slot: slot,
        entity: entity,
        entityState: entityState,
        name: deps.names ? deps.names[i] : undefined,
        key: deps.keys ? deps.keys[i] : slot,
      });
      counters.scans += 1;
    }
    return list;
  }

  function renderTeammates(teammates) {
    const rows = [];
    for (let i = 0; i < teammates.length; i++) {
      const teammate = teammates[i];
      const hp = readHp(teammate.entity, ENTITY_FIELDS.hp);
      const maxHp = readMaxHp(teammate.entityState);
      if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) {
        counters.skipped += 1;
        continue;
      }
      const ratio = clampRatio(hp / maxHp);
      const percent = Math.round(ratio * 100);
      const color = hpColor(teammate.index, ratio);
      rows.push([
        TEAMMATE_HP,
        formatRow(teammate.index, teammate.name, percent, color),
      ]);
    }
    return rows;
  }

  function render() {
    if (!isRuntimeActive()) return undefined;
    const identity = readOwnIdentity();
    if (identity) {
      state.ownTeam = identity.team;
      state.ownSlot = identity.slot;
    }
    if (state.ownTeam === null || state.ownSlot === null) {
      return undefined;
    }
    const rows = renderTeammates(collectTeammates());
    state.rows = rows;
    counters.frames += 1;
    counters.rows += rows.length;
    deps.flush(rows);
    return rows;
  }

  function throttleExpired(now) {
    if (state.lastRun !== 0 && now < state.lastRun) {
      return false;
    }
    state.lastRun = now + WIDGET_TICK_MS;
    return true;
  }

  function tick(now) {
    if (!isRuntimeActive()) return undefined;
    const at = now === undefined ? Date.now() : now;
    if (!throttleExpired(at)) return undefined;
    try {
      return render();
    } catch (err) {
      counters.errors += 1;
      state.lastError = err && err.message ? err.message : String(err);
      log(state.lastError);
      return undefined;
    }
  }

  function ensureWidget() {
    if (typeof deps.ensureWidget === 'function') {
      deps.ensureWidget();
    }
  }

  function releaseWidget() {
    state.rows.length = 0;
    if (typeof deps.clearWidget === 'function') {
      deps.clearWidget();
    }
  }

  function setEnabled(on) {
    if (state.disposed) {
      throw new Error('Visual runtime disposed');
    }
    on = on === true;
    if (state.enabled === on) return on;
    if (on) {
      try {
        state.enabled = true;
        ensureWidget();
      } catch (err) {
        state.enabled = false;
        state.lastError = err && err.message ? err.message : String(err);
        log(state.lastError);
        throw err;
      }
    } else {
      state.enabled = false;
      releaseWidget();
    }
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved[SETTINGS_KEY] === true : false;
    if (state.enabled) ensureWidget();
  }

  function getState() {
    return {
      enabled: state.enabled,
      battleKey: state.battleKey,
      rows: state.rows.map((row) => row[1]),
      rowIds: state.rows.map((row) => row[0]),
      frames: counters.frames,
      renderedRows: counters.rows,
      scans: counters.scans,
      skipped: counters.skipped,
      errors: counters.errors,
      disposed: state.disposed,
      lastError: state.lastError,
      featureId: TEAMMATE_HP,
      settingsKey: SETTINGS_KEY,
      label: label(deps.language),
    };
  }

  function dispose() {
    if (state.disposed) return undefined;
    releaseWidget();
    state.enabled = false;
    state.disposed = true;
    return undefined;
  }

  const api = {
    setEnabled: setEnabled,
    applySaved: applySaved,
    beginBattle: beginBattle,
    tick: tick,
    render: render,
    getState: getState,
    dispose: dispose,
  };

  return api;
}

module.exports = {
  FEATURE_ID,
  TEAMMATE_HP,
  WIDGET_TICK_MS,
  MAX_SLOTS,
  ENTITY_FIELDS,
  COUNTER_KEYS,
  label,
  clampRatio,
  formatRow,
  createTeammateHp,
};
