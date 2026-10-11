'use strict';

const CONFIG_LANGUAGE_KEY = 'language';

const LANGUAGE_EN = 'en';
const LANGUAGE_RU = 'ru';

const LANGUAGES = [LANGUAGE_EN, LANGUAGE_RU];
const DEFAULT_LANGUAGE = LANGUAGE_EN;

const CONTROL_CHARS_PATTERN =
  '[\\u0000-\\u001f\\u007f-\\u009f<>\\u202a-\\u202e\\u2066-\\u2069]';
const MAX_LABEL_LENGTH = 80;

const MENU_TITLE = 'JirGear';

const BUILT_IN_LABELS = {
  toggle: { en: 'Open / close menu', ru: 'Открыть / закрыть меню' },
  close: { en: 'Close menu', ru: 'Закрыть меню' },
  'tab:battle': { en: 'Battle', ru: 'Бой' },
  'tab:visual': { en: 'Visual', ru: 'Визуал' },
  'tab:profile': { en: 'Profile', ru: 'Профиль' },
  'tab:about': { en: 'About mod', ru: 'О моде' },
  'popup:open': { en: 'Menu settings', ru: 'Настройки меню' },
  'menu:colors': { en: 'Color & glow', ru: 'Цвет и подсветка' },
  'menu:language': { en: 'Language', ru: 'Язык' },
  'menu:motion': { en: 'Animations', ru: 'Анимации' },
  'menu:compact': { en: 'Compact view', ru: 'Компактный вид' },
  'telegram:connect': { en: 'Connect Telegram', ru: 'Подключить Telegram' },
  'telegram:import': { en: 'Import avatar', ru: 'Импорт аватарки' },
  'telegram:refresh': { en: 'Refresh profile', ru: 'Обновить профиль' },
  title: { en: MENU_TITLE, ru: MENU_TITLE },
  'mode:spectrum': { en: 'Spectrum', ru: 'Спектр' },
  'mode:solid': { en: 'Solid color', ru: 'Один цвет' },
  'preset:ice': { en: 'Ice', ru: 'Лёд' },
  'preset:violet': { en: 'Violet', ru: 'Фиолет' },
  'preset:sunset': { en: 'Sunset', ru: 'Закат' },
  'preset:mint': { en: 'Mint', ru: 'Мята' },
  reset: { en: 'Reset colors', ru: 'Сбросить цвета' },
  'language:en': { en: 'English', ru: 'Английский' },
  'language:ru': { en: 'Russian', ru: 'Русский' },
};

const FEATURE_LABELS = {
  aim_bot: 'AIM BOT',
  auto_dodge: 'AUTO DODGE',
  auto_farm: 'AUTO FARM',
  killaura: 'KILLAURA',
  hold_to_shoot: 'HOLD TO SHOOT',
  auto_spin: 'AUTO SPIN',
  emotes: 'EMOTES',
  follow: 'FOLLOW',
  xray: 'X-RAY',
  goal: 'GOAL',
  ball_assist: 'BALL ASSIST',
  ball_trajectory: 'BALL_TRAJECTORY',
  anti_afk: 'ANTI_AFK',
  mortis_chain: 'CHAIN MORTIS',
  server_region: 'SERVER_REGION',
  leon_clone: 'LEON_CLONE',
  enemy_ammo: 'ENEMY_AMMO',
  disable_shake: 'DISABLE_SHAKE',
  teammate_hp: 'TEAMMATE_HP',
  ally_respawn: 'ALLY_RESPAWN',
  dps_counter: 'DPS_COUNTER',
  camera: 'CAMERA',
  chromatic_name: 'CHROMATIC_NAME',
  fps_counter: 'INFO_FPS',
  vsync_bypass: 'VSYNC_BYPASS',
  server_ip: 'BATTLE SERVERS',
  trickshot: 'TRICKSHOT',
};

const FEATURE_LABELS_RU = {
  mortis_chain: 'Цепочка Мортиса',
  leon_clone: 'Клон Леона',
};

const FEATURE_FRIENDLY_LABELS = {
  sync_bot: 'Bot sync',
  skip_moment: 'Skip highlight',
  real_names: 'Real names',
  player_trophies: 'Player trophies',
  gadget_timer: 'Gadget cooldown',
  charge_hud: 'Super / Hyper state',
  safe_timer: 'Safe shield timer',
  hide_super_aim: 'Hide Super aim',
  online_status: 'Online status',
  team_chat_uncensor: 'Team chat uncensor',
  gray_mod: 'Gray mod',
  super_hold: 'Super held',
  super_hold_blink: 'Super blink',
  nani_gadget: 'Nani gadget',
  skip_prestige: 'Skip prestige',
  skip_rewards: 'Skip animations',
  quick_slots: 'Quick access',
  hud_editor: 'HUD editor',
  colors_glow: 'Color & glow',
  fps_unlock: 'FPS unlock',
  brawlers: 'Brawlers',
  network: 'Network',
  presence: 'Presence',
};

const TAB_LABELS = {
  battle: 'tab:battle',
  visual: 'tab:visual',
  profile: 'tab:profile',
  about: 'tab:about',
};

const COLOR_PRESET_NAMES = ['ice', 'violet', 'sunset', 'mint'];

const COLOR_MODES = ['solid', 'spectrum'];

function sanitizeLabel(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  const chars = Array.from(
    text.replace(new RegExp(CONTROL_CHARS_PATTERN, 'g'), '')
  );
  return chars.slice(0, MAX_LABEL_LENGTH).join('').trim();
}

function normalizeLanguage(language) {
  return language === LANGUAGE_RU ? LANGUAGE_RU : LANGUAGE_EN;
}

function createMenuStrings(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  let language = DEFAULT_LANGUAGE;

  const listFeatures = deps.listFeatures;

  function label(commandId) {
    const entry = BUILT_IN_LABELS[commandId];
    if (entry) {
      return entry[normalizeLanguage(language)] || entry[LANGUAGE_EN];
    }
    if (typeof commandId === 'string' && commandId.indexOf('feature:') === 0) {
      return featureLabel(commandId.slice('feature:'.length));
    }
    return '';
  }

  function featureLabel(featureKey) {
    if (Object.prototype.hasOwnProperty.call(FEATURE_LABELS_RU, featureKey) &&
        language === LANGUAGE_RU) {
      return FEATURE_LABELS_RU[featureKey];
    }
    if (Object.prototype.hasOwnProperty.call(FEATURE_LABELS, featureKey)) {
      return FEATURE_LABELS[featureKey];
    }
    if (Object.prototype.hasOwnProperty.call(FEATURE_FRIENDLY_LABELS,
      featureKey)) {
      return FEATURE_FRIENDLY_LABELS[featureKey];
    }
    return featureKey;
  }

  function labelFor(commandId, forcedLanguage) {
    const saved = language;
    language = normalizeLanguage(forcedLanguage);
    const text = label(commandId);
    language = saved;
    return text;
  }

  function setLanguage(value) {
    language = normalizeLanguage(value);
    return language;
  }

  function getLanguage() {
    return language;
  }

  function isRu() {
    return language === LANGUAGE_RU;
  }

  function listCommandIds() {
    return Object.keys(BUILT_IN_LABELS);
  }

  function listFeatureKeys() {
    if (typeof listFeatures === 'function') {
      return listFeatures();
    }
    return Object.keys(FEATURE_LABELS)
      .concat(Object.keys(FEATURE_FRIENDLY_LABELS));
  }

  function setEnabled(value) {
    state.enabled = value === true;
    return state.enabled;
  }

  function applySaved(saved) {
    state.enabled = saved ? saved.enabled === true : false;
    if (saved && typeof saved[CONFIG_LANGUAGE_KEY] === 'string') {
      language = normalizeLanguage(saved[CONFIG_LANGUAGE_KEY]);
    } else {
      language = DEFAULT_LANGUAGE;
    }
  }

  function tick() {}

  function getState() {
    return {
      enabled: state.enabled,
      disposed: state.disposed,
      lastError: state.lastError,
      language: language,
      isRu: isRu(),
      commandCount: Object.keys(BUILT_IN_LABELS).length,
    };
  }

  function dispose() {
    state.disposed = true;
  }

  return {
    label,
    labelFor,
    featureLabel,
    setLanguage,
    getLanguage,
    isRu,
    listCommandIds,
    listFeatureKeys,
    applySaved,
    setEnabled,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  CONFIG_LANGUAGE_KEY,
  LANGUAGE_EN,
  LANGUAGE_RU,
  LANGUAGES,
  DEFAULT_LANGUAGE,
  CONTROL_CHARS_PATTERN,
  MAX_LABEL_LENGTH,
  MENU_TITLE,
  BUILT_IN_LABELS,
  FEATURE_LABELS,
  FEATURE_LABELS_RU,
  FEATURE_FRIENDLY_LABELS,
  TAB_LABELS,
  COLOR_PRESET_NAMES,
  COLOR_MODES,
  sanitizeLabel,
  normalizeLanguage,
  createMenuStrings,
};
