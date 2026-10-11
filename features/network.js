'use strict';

const URL_SCHEME = 'https:' + '/';
const API_ORIGIN = URL_SCHEME + '/jirgear.com';

const OFFSETS_PATH = '/api/menu/offsets';

const REQUEST_TIMEOUT_MS = 30000;

const DEVICE_TAG = 'jir-device';

const DEVICE_SECRET = '6c1643b876d88227';

const PROFILE_HASH =
  'a4eef479f20da3192eec7c2dd79ae48a91d3147fce9cee111d54712671bd67a8';

const PAYMENT_BOT_URL = URL_SCHEME + '/t.me/JirGearPayBot?start=avatar';

const MAX_OFFSET_VALUE = 4294967295;

const NATIVE_CONSTANT_PATTERN =
  /^(?:0[xX][0-9a-fA-F]+(?:\.[0-9a-fA-F]*)?(?:[pP][+-]?\d+)?|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)[uUlLfF]*$/;

const ENDPOINTS = {
  login: 'Invalid login response',
  activation: 'Invalid activation response',
  verifiedProfile: 'Invalid verified profile',
  network: 'Invalid network response',
  presence: 'Invalid presence response',
  sharedAvatars: 'Invalid shared avatars response',
  events: 'Invalid events response',
};

const ERRORS = {
  offsetProfileAuthenticated: 'Offset profile authenticated',
  offsetProfileUnavailable: 'Offset profile unavailable',
  incompatibleOffsetProfile: 'Incompatible offset profile',
  invalidTrustedApiOrigin: 'Invalid trusted API origin',
};

function endpointUrl(path) {
  return API_ORIGIN + (path.charAt(0) === '/' ? path : '/' + path);
}

function createNetwork(deps) {
  const state = {
    enabled: false,
    disposed: false,
    lastError: '',
  };

  const log = typeof deps.log === 'function' ? deps.log : () => {};
  const request = deps.request;
  const verifyOrigin = deps.verifyOrigin;

  let offsetProfile = null;
  let deviceRegistered = false;

  function ensureTrustedOrigin(url) {
    const origin = String(url).slice(0, API_ORIGIN.length);
    if (verifyOrigin) {
      return verifyOrigin(url, API_ORIGIN);
    }
    if (origin !== API_ORIGIN) {
      throw new Error(ERRORS.invalidTrustedApiOrigin);
    }
    return true;
  }

  function parseResponse(kind, body) {
    if (body === null || body === undefined) {
      throw new Error(ENDPOINTS[kind] || ENDPOINTS.network);
    }
    return body;
  }

  function validateOffsetValue(value) {
    if (typeof value !== 'number' || !isFinite(value) ||
        Math.abs(value) > MAX_OFFSET_VALUE) {
      throw new Error('Invalid offset value');
    }
    return value;
  }

  function validateNativeConstant(value) {
    if (typeof value !== 'string' ||
        !NATIVE_CONSTANT_PATTERN.test(value)) {
      throw new Error('Invalid native constant');
    }
    return value;
  }

  function fetchOffsetProfile() {
    if (!request) return null;
    ensureTrustedOrigin(endpointUrl(OFFSETS_PATH));
    const response = request({
      url: endpointUrl(OFFSETS_PATH),
      method: 'POST',
      body: { profile: PROFILE_HASH },
      timeoutMs: REQUEST_TIMEOUT_MS,
    });
    if (!response || !Array.isArray(response.values)) {
      throw new Error(ERRORS.offsetProfileUnavailable);
    }
    const values = response.values;
    if (response.compatMask &&
        !response.compatMask.every((bit, index) => bit === '0' ||
          values[index] !== undefined)) {
      throw new Error(ERRORS.incompatibleOffsetProfile);
    }
    for (const value of values) {
      validateOffsetValue(value);
    }
    for (const constant of response.constants || []) {
      validateNativeConstant(constant);
    }
    offsetProfile = Object.freeze({
      values: values.slice(),
      constants: (response.constants || []).slice(),
    });
    return offsetProfile;
  }

  function registerDevice(registerModule) {
    if (deviceRegistered) return true;
    if (typeof registerModule !== 'function') return false;
    registerModule(DEVICE_TAG, { secret: DEVICE_SECRET });
    deviceRegistered = true;
    return true;
  }

  function post(path, body) {
    if (!request) return null;
    ensureTrustedOrigin(endpointUrl(path));
    return parseResponse('network', request({
      url: endpointUrl(path),
      method: 'POST',
      body: body,
      timeoutMs: REQUEST_TIMEOUT_MS,
    }));
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
      origin: API_ORIGIN,
      deviceRegistered: deviceRegistered,
      offsetProfile: offsetProfile
        ? { values: offsetProfile.values.length }
        : null,
      lastError: state.lastError,
    };
  }

  function dispose() {
    if (state.disposed) return;
    offsetProfile = null;
    deviceRegistered = false;
    state.disposed = true;
  }

  return {
    API_ORIGIN,
    OFFSETS_PATH,
    DEVICE_TAG,
    PAYMENT_BOT_URL,
    ENDPOINTS,
    ERRORS,
    endpointUrl,
    ensureTrustedOrigin,
    parseResponse,
    validateOffsetValue,
    validateNativeConstant,
    fetchOffsetProfile,
    registerDevice,
    post,
    setEnabled,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  API_ORIGIN,
  OFFSETS_PATH,
  REQUEST_TIMEOUT_MS,
  DEVICE_TAG,
  DEVICE_SECRET,
  PROFILE_HASH,
  PAYMENT_BOT_URL,
  ENDPOINTS,
  ERRORS,
  MAX_OFFSET_VALUE,
  NATIVE_CONSTANT_PATTERN,
  endpointUrl,
  createNetwork,
};
