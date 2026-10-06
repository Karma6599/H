'use strict';

// Chromatic Name — the "NATIVE BLING NAME" feature (id 24). Rewrites the
// own player name at the native render boundary: a 24-slot one-shot
// CModule trampoline matches the name pointer passed to the hooked
// native text function and calls back into JavaScript, where the name is
// rebuilt with the live chromatic palette (rainbow cycle or solid tint,
// plus glow/opacity).
//
// Module shape (factory fn_313): 43 closure functions, the CModule
// bridge below, and a 12-method API. The chromatic palette options live
// in the settings under the color category: [mode, red, green, blue,
// hue, cycleSeconds, saturation, brightness, opacity, glow] with the
// mode enum [rainbow, solid].
//
// Reconstructed from the JirGear QuickJS bytecode (see chromatic_name.md
// for the disassembly excerpts and the raw runtime keys).

// Feature id 24 (fn_488 constant slot); registered under the plaintext
// menu key 'CHROMATIC_NAME'.
const FEATURE_ID = 24;

// Menu labels (fn_488 strings table): row 62 is the feature, row 63 its
// description. The factory also exposes the label pair for the page.
const MENU_LABEL = 'NATIVE BLING NAME';
const MENU_LABEL_RU = 'ПЕРЕЛИВ НИКА';
const MENU_DESCRIPTION = 'Live colors and animation speed';

// Options schema (fn_488 options category 8): index -> key.
const OPTION_MODE = 0;
const OPTION_RED = 1;
const OPTION_GREEN = 2;
const OPTION_BLUE = 3;
const OPTION_HUE = 4;
const OPTION_CYCLE_SECONDS = 5;
const OPTION_SATURATION = 6;
const OPTION_BRIGHTNESS = 7;
const OPTION_OPACITY = 8;
const OPTION_GLOW = 9;

// Mode enum: 0 = rainbow (animated hue cycle), 1 = solid tint.
const MODE_RAINBOW = 0;
const MODE_SOLID = 1;

// Palette ranges (menu writers clamp; hue wraps at 360).
const HUE_MAX = 360;
const CHANNEL_MIN = 0;
const CHANNEL_MAX = 255;
const OPACITY_MIN = 0;
const OPACITY_MAX = 1;

// The native marker string: the module allocates the C string
// 'player_name' once and matches it against the first argument of the
// hooked native function (the game's own name-render entry).
const PLAYER_NAME_MARKER = 'player_name';

// Trampoline capacity: the C slot table holds at most 24 one-shot
// registrations, each matching up to 3 pointers.
const TRAMPOLINE_SLOTS = 24;
const TRAMPOLINE_POINTERS_PER_SLOT = 3;

// The byte-recovered CModule source. It compiles to:
//   slots[24]  — {a, b, c, id} one-shot registration records
//   onHit(id, arg)  — exported JS callback (invoked once, then the
//                     registration is consumed)
//   invocationHandler — the Gum onEnter body that scans the slot table
//                      for the current first argument pointer
const TRAMPOLINE_C_SOURCE = `
  #include <gum/guminterceptor.h>
  typedef struct {void *a,*b,*c; unsigned id;} entry;
  extern unsigned char slots[];
  extern void onHit(unsigned, void *);
  int allocSlot(void *a, void *b, void *c, unsigned id){
    unsigned i; entry *tab = (entry *)slots;
    for (i = 0; i < ${TRAMPOLINE_SLOTS}; i++) if (!tab[i].id) {
      tab[i].a = a; tab[i].b = b; tab[i].c = c; tab[i].id = id;
      return (int)i;
    }
    return -1;
  }
  void freeSlot(unsigned id){
    unsigned i; entry *tab = (entry *)slots;
    for (i = 0; i < ${TRAMPOLINE_SLOTS}; i++) if (tab[i].id == id) {
      tab[i].a = 0; tab[i].b = 0; tab[i].c = 0; tab[i].id = 0;
    }
  }
  void invocationHandler(GumInvocationContext *ic){
    unsigned i, id; void *arg0 =
        gum_invocation_context_get_nth_argument(ic, 0);
    entry *tab = (entry *)slots;
    for (i = 0; i < ${TRAMPOLINE_SLOTS}; i++)
      if (tab[i].id && (arg0 == tab[i].a || arg0 == tab[i].b ||
                        arg0 == tab[i].c)) {
        id = tab[i].id;
        tab[i].a = 0; tab[i].b = 0; tab[i].c = 0; tab[i].id = 0;
        onHit(id, arg0);
      }
  }
`;

// hslToRgb — the palette engine used by the rainbow mode. Mirrors the
// standard hue wheel with saturation/lightness clamped to the option
// ranges before conversion.
function hslToRgb(h, s, l) {
  const hue = ((h % HUE_MAX) + HUE_MAX) % HUE_MAX;
  const sat = Math.min(1, Math.max(0, s));
  const lig = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lig - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [
    Math.round((r + m) * CHANNEL_MAX),
    Math.round((g + m) * CHANNEL_MAX),
    Math.round((b + m) * CHANNEL_MAX),
  ];
}

function clampChannel(v, fallback) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(CHANNEL_MAX, Math.max(CHANNEL_MIN, Math.round(v)));
}

function normalizeColorOptions(raw) {
  // Option writer for the color category. Rainbow mode keeps the hue
  // cycle parameters; solid mode pins the RGB tint.
  const opts = raw || {};
  const mode = opts.mode === MODE_SOLID ? MODE_SOLID : MODE_RAINBOW;
  return {
    mode,
    red: clampChannel(opts.red, 0),
    green: clampChannel(opts.green, 0),
    blue: clampChannel(opts.blue, 0),
    hue: typeof opts.hue === 'number' ? opts.hue % HUE_MAX : 0,
    cycleSeconds:
      typeof opts.cycleSeconds === 'number' && opts.cycleSeconds > 0
        ? opts.cycleSeconds
        : 4,
    saturation:
      typeof opts.saturation === 'number'
        ? Math.min(1, Math.max(0, opts.saturation))
        : 1,
    brightness:
      typeof opts.brightness === 'number'
        ? Math.min(1, Math.max(0, opts.brightness))
        : 0.5,
    opacity:
      typeof opts.opacity === 'number'
        ? Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, opts.opacity))
        : OPACITY_MAX,
    glow: opts.glow === true,
  };
}

function buildTrampolineBridge(CModule, NativeFunction, callbacks) {
  // The CModule construction (byte-verified):
  //   new CModule(source, { onHit: jsCallback, slots: backingBuffer })
  // followed by the symbol pair table
  //   [jsName, cName] x5 — onHit / slots / invocationHandler /
  //                       allocSlot / freeSlot
  // and the NativeFunction wrappers:
  //   add    = allocSlot(ptr, ptr, ptr, uint) -> int
  //   remove = freeSlot(uint) -> void
  const module = new CModule(TRAMPOLINE_C_SOURCE, callbacks, [
    ['onHit', 'oe1499f0f86'],
    ['slots', 'of7b083d525'],
    ['invocationHandler', 'o481548b4bd'],
    ['allocSlot', 'o259d8c4dc8'],
    ['freeSlot', 'o5111176cfe'],
  ]);

  return {
    module,
    add: new NativeFunction(module.allocSlot, 'int', [
      'pointer', 'pointer', 'pointer', 'uint',
    ]),
    remove: new NativeFunction(module.freeSlot, 'void', ['uint']),
  };
}

function createChromaticRuntime(deps) {
  // deps:
  //   CModule / NativeFunction / Memory  the Frida natives
  //   emitColor(id, text)  the rewrite hook (the 43-function body:
  //                        palette selection + name rebuild + write-back)
  //   features  the id -> enabled snapshot provider
  //   settings  saved color options
  const options = normalizeColorOptions(deps.settings);
  const bridge = buildTrampolineBridge(
    deps.CModule, deps.NativeFunction, deps.callbacks
  );

  // The marker buffer: allocated once, registered in the trampoline so
  // the C handler fires when the game passes the own player name.
  const playerNameMarker = deps.Memory.allocUtf8String(PLAYER_NAME_MARKER);

  const state = {
    enabled: deps.features()[FEATURE_ID] === true,
    options,
    hookId: -1,
    registrations: 0,
    hits: 0,
    disposed: false,
  };

  function registerNamePointer(pointers, id) {
    // One-shot registration of up to three name buffers (the stable
    // pointer set of the current player name). Returns the slot index
    // or -1 when the table is full.
    const a = pointers[0] || null;
    const b = pointers[1] || null;
    const c = pointers[2] || null;
    return bridge.add(a, b, c, id);
  }

  function releaseNamePointer(id) {
    bridge.remove(id);
  }

  function computeColor(nowMs) {
    // Live palette: rainbow rotates the hue over the configured cycle,
    // solid pins the tint. Glow multiplies the brightness in the emit
    // path (handled by the native draw side).
    if (state.options.mode === MODE_SOLID) {
      return {
        r: state.options.red,
        g: state.options.green,
        b: state.options.blue,
        opacity: state.options.opacity,
      };
    }
    const cycleMs = state.options.cycleSeconds * 1000;
    const hue = (nowMs / Math.max(1, cycleMs)) * HUE_MAX;
    const [r, g, b] = hslToRgb(
      hue, state.options.saturation, state.options.brightness
    );
    return { r, g, b, opacity: state.options.opacity };
  }

  function setEnabled(enabled) {
    state.enabled = enabled === true;
    return state.enabled;
  }

  function setOptions(raw) {
    state.options = normalizeColorOptions(raw);
    return getState().options;
  }

  function applySaved(saved) {
    state.options = normalizeColorOptions(saved);
  }

  function tick(nowMs) {
    if (state.disposed || !state.enabled) return null;
    const color = computeColor(nowMs == null ? Date.now() : nowMs);
    state.hits += 1;
    return color;
  }

  function getState() {
    // fn_847 — the getState view (raw key map in the notes).
    return {
      enabled: state.enabled,
      options: {
        mode: state.options.mode,
        red: state.options.red,
        green: state.options.green,
        blue: state.options.blue,
        hue: state.options.hue,
        cycleSeconds: state.options.cycleSeconds,
        saturation: state.options.saturation,
        brightness: state.options.brightness,
        opacity: state.options.opacity,
        glow: state.options.glow,
      },
      registrations: state.registrations,
      hits: state.hits,
      disposed: state.disposed,
    };
  }

  function dispose() {
    if (state.disposed) return;
    releaseNamePointer(state.hookId);
    state.disposed = true;
  }

  state.hookId = registerNamePointer(
    [playerNameMarker], state.registrations++
  );

  return {
    FEATURE_ID,
    MENU_LABEL,
    MENU_LABEL_RU,
    MENU_DESCRIPTION,
    registerNamePointer,
    releaseNamePointer,
    computeColor,
    setEnabled,
    setOptions,
    applySaved,
    tick,
    getState,
    dispose,
  };
}

module.exports = {
  FEATURE_ID,
  MENU_LABEL,
  MENU_DESCRIPTION,
  MODE_RAINBOW,
  MODE_SOLID,
  OPTION_MODE,
  OPTION_RED,
  OPTION_GREEN,
  OPTION_BLUE,
  OPTION_HUE,
  OPTION_CYCLE_SECONDS,
  OPTION_SATURATION,
  OPTION_BRIGHTNESS,
  OPTION_OPACITY,
  OPTION_GLOW,
  TRAMPOLINE_C_SOURCE,
  TRAMPOLINE_SLOTS,
  PLAYER_NAME_MARKER,
  hslToRgb,
  normalizeColorOptions,
  buildTrampolineBridge,
  createChromaticRuntime,
};
