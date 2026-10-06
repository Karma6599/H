# Brawler Database & Ban Lists

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `BRAWLERS`

Menu catalog key: `brawlers` (fn_488 strings table, alongside
`autoSwitch`→AUTO SWITCH, `target`→TARGET TROPHIES,
`_$74242ee5262be322bb1db3ed`→ANY ELIGIBLE BRAWLER,
`_$127eb0345d274e59799d65e2`→"Scroll and choose one or more brawlers",
`_$5f63fca8525ab4b6bec949d7`→LOCKED, `_$9e9b0637c47114d87495640f`→NOT
RELEASED; the any-eligible row carries a live closure fn_692).

No dedicated battle runtime: the feature is the identity + settings layer
that other modules (auto_dodge ban list, auto_farm brawler selection,
per-brawler option overrides) consume. State lives in the shared config
factory `fn_488` (storage + catalog), the settings store `fn_2288`
(serialize/validate), and the menu page factories `fn_1488` / `fn_1647`
(children of fn_488). Name canon comes from the bundled module
`utils/brawlerName.js` (module-import atom in fn_488).

## Notes

### 1. Brawler identity module — `fn_1535` [#1666, child of fn_488]

Factory (462 bclen) exporting `{manager, homeMode, avatar,
_$ada97b007f74f324d2445e6e, ...}` (9-slot export table, keys are plain
atoms). Key closures:

- `fn_84` [#1668] — **getBrawlerIdentity**: `typeof deps fn === 'function'`
  else `throw Error('Brawler identity function unavailable')`; resolves via
  `Module.findRangeByAddress(...)` + `.indexOf('r')` address-range matching,
  then reads the entity through a constructed native
  (`new NativeFunction(ptr, 'pointer', ['pointer', …])` at base offset
  `+47701`); prefix label `'Brawler identity '`.
- `fn_2533`, `fn_2242`, `fn_615`, `fn_2625` — manager / homeMode / avatar
  accessors of the export table.

The HUD status bar (neighbouring subtree) renders `'BRAWLER ' + name` /
`'GLOBAL'` / `'Waiting for brawler'` (RU: `'ЗАГРУЗКА БОЙЦОВ…'`) and
`'Brawler details refresh in the lobby'` / RU `'Данные бойцов обновятся в
лобби'`.

### 2. Per-brawler settings store — `fn_2288` [#2788, child of fn_488]

Persisted shape (JSON):

```js
{
  version: 1,
  autoSwitch: true|false,      // use the global block by default
  global: { ... },             // shared settings object (non-array)
  byBrawler: { "<id>": { name: "...", settings: [...] } }   // ≤ 1024 entries
}
```

- `fn_2512` [#249] — **serialize** (state array → storage object):
  `version: state[0]`, `autoSwitch: state[1]`,
  `global: fn_381(23, state[2])` (fn_381 = the generic settings codec in
  fn_488; 23 = codec group id), `byBrawler: Object.fromEntries((state[3] ||
  []).map(fn_752))`; `null` passes through untouched.
- `fn_752` — per-entry mapper: `[String(entry[0]), { name: entry[1],
  settings: fn_381(2, entry[2]) }]` (codec group 2 = settings arrays).
- `fn_2227` [#2794] — **validate/deserialize**: reads `global` / `autoSwitch`
  / `byBrawler` through the fn_2288 reader; `global` must be a non-array
  object (else normalized through fn_2288.loc_6 with defaults);
  `autoSwitch === true` strict; `byBrawler` entries: max **1024**, keys must
  match `/^(0|[1-9]\d{0,5})$/` (numeric ids 0..999999), values non-array
  objects with `name` + `settings` where `Array.isArray(settings)`; invalid
  entries are dropped silently.

### 3. Menu pages (children of fn_488)

- `fn_1488` [#1672] — brawlers page factory. Children:
  - `fn_1942` [#1754] — the **USE GLOBAL SETTINGS / ОБЩИЕ НАСТРОЙКИ**
    per-brawler override switch (RU/EN label pair, language check selects).
  - `fn_1492` [#1685] — `'Waiting for brawler'` empty state.
  - `fn_2011` / `fn_1967` / `fn_316` — sibling page builders.
- `fn_1647` [#1152] — brawler grid factory (shared with the Auto Farm UI:
  errors `'Auto Farm UI helper missing: …'` when
  `_$e4d4bcee11bf985393979150` is absent). Child `fn_1767` [#1182, 4963
  bclen] — the grid renderer: `'LOADING BRAWLERS…'` / `'ЗАГРУЗКА БОЙЦОВ…'`
  (330/14/10 layout constants), `panel_background` / `border_top` sprites,
  list fields `_$c8216481dd5b120467ed0c99` (indexOf'd membership tests ×4),
  `_$c45db30edea22f3e4fcf8832`, `_$51f13a485fcbbb81b3bbb7e2`,
  `_$ef46967afcf5b6689d66b38d`, `_$fb2f721b6f5cb0203ae2b46d`,
  `_$c2ef71c9863782e389761312`, `_$e4d4bcee11bf985393979150` (visual/sprite
  helpers).
- `fn_2131` [#1809, child of fn_2349] — `'Waiting for brawler…'` picker row.

### 4. Consumers

- **auto_dodge ban list** — dodge option index 5 of the options map
  (fn_488): `[0] safetyMargin, [1] horizonMs, [2] moveDistance, [3]
  dodgeWhenCarrying, [4] dodgeWhenStanding, [5] ignoredBrawlerIds, [6]
  _$828f136528603782e8c3f694 (aggressiveness), …`; picker UI
  `'AUTO DODGE — BAN LIST'` (fn_887 [#1600, child of fn_1980]); runtime
  option `ignoredBrawlers` (array of names) + antiSniperBrawlers default
  PIPER/COLT/BEA/BEE/BELLE/ELECTROSNIPER; sniper classes matched by
  canonical projectile names (see auto_dodge.md).
- **auto_farm brawler selection** — 12-slot options spec in fn_488:
  `[0] enabled, [1] selectedBrawlers, [3] attack, [4] follow, [5] autoSwitch,
  [6] autoStart, [7] useSuper, [8] useHyper, [9] useGadgets, [10] usePins`;
  `'ANY ELIGIBLE BRAWLER'` mode + `selectedCharacters` mirror in the
  autofarm option reader (fn_75 subtree, see auto_farm.md).

## Key strings / constants

- `BRAWLERS`
- `ANY ELIGIBLE BRAWLER`
- `AUTO DODGE — BAN LIST`
- `LOADING BRAWLERS…` / `ЗАГРУЗКА БОЙЦОВ…`
- `Waiting for brawler` / `Waiting for brawler…`
- `Scroll and choose one or more brawlers`
- `Brawler identity` / `Brawler identity function unavailable`
- `USE GLOBAL SETTINGS` / `ОБЩИЕ НАСТРОЙКИ`
- `selectedBrawlers`
- `ignoredBrawlerIds`
- `byBrawler`
- `autoSwitch`
- `version`
- `global`
- `settings` / `name`
- `utils/brawlerName.js`
- `Brawler details refresh in the lobby` / `Данные бойцов обновятся в лобби`
- `LOCKED` / `NOT RELEASED`

## Functions (brawlers feature map)

Core module subtrees (all children of fn_488 unless noted):

- `fn_1535` [#1666] — brawler identity factory (462 bclen, exports
  manager/homeMode/avatar/…)
- `fn_84` [#1668, child of fn_1535] — getBrawlerIdentity (findRangeByAddress
  + native read at +47701)
- `fn_2533` / `fn_2242` / `fn_615` / `fn_2625` — identity module closures
- `fn_2288` [#2788] — settings store factory
- `fn_2227` [#2794, child of fn_2288] — validate/deserialize (1024-entry
  cap, id regex `^(0|[1-9]\d{0,5})$`)
- `fn_2512` [#249] — serialize (version/autoSwitch/global/byBrawler)
- `fn_752` — byBrawler entry mapper
- `fn_1488` [#1672] — brawlers page factory
- `fn_1942` [#1754] / `fn_1492` [#1685] / `fn_2011` [#1751] / `fn_1967`
  [#1752] / `fn_316` [#1753] — page builders (children of fn_1488)
- `fn_1647` [#1152] — grid factory (Auto Farm UI helper dependency)
- `fn_1767` [#1182, child of fn_1647] — grid renderer (4963 bclen)
- `fn_2131` [#1809, child of fn_2349] — waiting row
- `fn_887` [#1600, child of fn_1980] — AUTO DODGE ban-list picker
- `fn_692` — ANY ELIGIBLE BRAWLER closure (menu catalog)

## Disassembly (entry)

fn_84 (brawler identity) — the address-range resolution head:

```asm
=== FUNCTION fn_84 [#1668] parent=_parent:fn_1535 ===
  ...
     173  get_var                    1282
     177  push_const                 [8] str 'function'
     188  get_var                    1282
     191  get_var                    0
     197  push_const                 [9] str 'Brawler identity '
     202  get_var                    8
     210  call                       3
     221  get_var                    2498
     224  push_const                 [10] str 'findRangeByAddress'
     241  call_method                1
     266  push_const                 [11] str 'indexOf'
     273  push_const                 [12] str 'r'
     285  call_method                1
     288  push_const                 [13] num 0.0
     299  get_var                    2499
     302  push_const                 [14] str 'Brawler identity function unavailable'
     314  call_constructor           1
```

fn_1767 (grid renderer) — the loading-state fork:

```asm
=== FUNCTION fn_1767 [#1182] parent=_parent:fn_1647 ===
  ...
    4675  get_var                    58
    4678  call                       0
    4681  get_var                    1795
    4684  strict_eq
    4685  if_false                   -> 4723
    4690  push_const                 [144] str 'ЗАГРУЗКА БОЙЦОВ…'
    4718  goto                       -> 1454
    4723  push_const                 [148] str 'LOADING BRAWLERS…'
    4728  push_const                 [149] num 330.0
    4733  push_const                 [150] num 14.0
    4738  push_const                 [151] num 10.0
    4743  call                       5
```
