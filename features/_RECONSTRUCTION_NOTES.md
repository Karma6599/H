# Reconstruction notes — how these files were produced

Every reconstructed `.js` file in this folder is derived **exclusively** from
`jirgear_main.qbc` (the 49 MB QuickJS bytecode blob shipped inside the mod),
parsed with our own validator/disassembler (bellard/quickjs-master opcode
table + the two JirGear format customizations below). No third-party code was
consulted.

## Bytecode format discoveries (required to read the module at all)

1. **Opcode atom operands are fixed-width 4-byte raw indexes** — unlike stock
   QuickJS which stores them as uleb128 `(idx << 1) | tag`. The stream atoms
   (function/local/closure names) DO use the stock tagged uleb. This hybrid
   is why stock tools misparse every property access.
2. **Jump label offsets are operand-relative** (`target = opcode_pos + 1 +
   stored`), not instruction-end-relative like stock QuickJS.
3. Local variable names survive only as obfuscated `loc_N/arg_N/call_arg_*`;
   module-scope imports survive as `native_import_N`; property/API names are
   26-hex hashes (`_$...`) which are the actual runtime contract.

## Reconstruction workflow (per feature)

1. Locate the feature's factory function (e.g. `fn_2070` for autospin) from
   the toggle registry / menu dispatcher references.
2. Resolve every closure variable (`get_var N`) through the scope chain to
   its terminal (factory state local / module import / global) — this recovers
   the full state layout even though names are obfuscated.
3. Read every function in the closure subtree instruction by instruction,
   reverting the per-function opaque predicate
   (`((x & 65535) * ((x & 65535) + 1) & 1) !== 0` — always false) and the
   dead XOR/OR mixing blocks.
4. Name state/functions from their verified behavior (read/write sites, the
   strings they compare, the natives they bind), keep hash keys verbatim.

## Verified against the bytecode

The fn_* ↔ function mapping and state local indexes were recorded in the file's
header during reconstruction and are preserved in the git history of this repo
(commit `102d791`). Code files carry no comments (user preference).

## Status

- `autospin.js` — COMPLETE, line-by-line verified (all 17 functions).
- `aimbot.js` — COMPLETE, line-by-line verified (all 30 functions of the fn_2617 tree).
  API and state keys renamed to their recovered semantic names for
  readability; the mapping to the original bytecode hashes is preserved
  below and must be used when cross-referencing other modules (the same
  hashes recur across the bundle).

## Hash → name map (autospin)

API (returned object, bytecode `push_const [133..136]`):

| hash (in .qbc) | name (in .js) |
|---|---|
| `_$1458b5e5e1ba5d16cc261b4d` | `setEnabled` |
| `_$da85984e278313ae052275c0` | `setSpeed` |
| `dispose` (plain atom) | `dispose` |
| `_$814748ecc47856e7b144daa6` | `getState` |

Deps/logger object (`get_field` in fn_2070):

| hash | name |
|---|---|
| `_$0f5ca3bf508eb8602288884d` | `inputGate` |
| `_$316a295be826abbc8b0c29da` | `scheduler` |

Offsets object (`get_field` in fn_2070; `battle`/`screen`/`own`/`alive`/`x`/`y`/`move`/`input` are plain atoms — `input` is a stock QuickJS atom, printed `@stock[input]`):

| hash | name |
|---|---|
| `_$6ff76fd71ed8749d4b126f55` | `alloc` |
| `_$a0ecdfeb91f25b0091d3e509` | `free` |
| `_$c4a008b45f098e9c9a99c679` | `submit` |

inputGate methods (fn_281 / fn_1037 / fn_628):

| hash | name | signature |
|---|---|---|
| `_$6c469dfb2ddb1688dfd11754` | `isLocked` | `(flags)` → bool |
| `_$9b5fe44f7c935bfb890bcb65` | `angle` | `()` → joystick angle; `!!truthy` = player steering |
| `_$22320225cdd7c427d4b8d3cb` | `notifyRejected` | `(flags)` |
| `_$2b1d9859a05368f4f18995bd` | `checkPathBudget` | `(flags, limit)` → bool |

Note: `_$9b5fe44f7c935bfb890bcb65` is used BOTH as the inputGate probe
method and as the getState field holding the spin angle — same original
name in the source (deterministic hash), which is why the field was
recovered as `angle`.

getState fields (fn_2280 `push_const [7..18]`):

| hash | name |
|---|---|
| `_$913480583cd4866078c0c6be` | `moves` |
| `_$847df37188c9e0f15414daee` | `mode` |
| `_$9b5fe44f7c935bfb890bcb65` | `angle` |
| `_$344ee9b150e5f1198fdd7ceb` | `holdKey` |

(`enabled`/`disposed`/`speed`/`ticks`/`errors`/`lastError`/`pending`/`anchor` are plain atoms in the bytecode.)

## Hash → name map (aimbot)

API (returned object of fn_2617, bytecode `push_const [61..73]`):

| hash (in .qbc) | name (in .js) | fn |
|---|---|---|
| `_$1458b5e5e1ba5d16cc261b4d` | `setEnabled` | fn_2809 |
| `_$270633830ca3fb784de198da` | `setFlags` | fn_1058 |
| `_$0e0a1d405897c8f747b1f7d5` | `setTargeting` | fn_2463 |
| `_$ae0f4a418c4f6532660085a2` | `setFocus` | fn_1480 |
| `_$0d8e8644a4dd6e93357f140f` | `getFocus` | fn_805 |
| `_$b6b5605f08944394feaa22fc` | `setTuning` | fn_1464 |
| `_$797d4bb49de6d85ff969c1e2` | `getDebugPayload` | fn_2519 |
| `_$acda679c3fad2a062358a1a0` | `peekAim` | fn_510 |
| `dispose` (plain atom) | `dispose` | fn_2531 |
| `_$814748ecc47856e7b144daa6` | `getState` | fn_2141 |

Logger object (2nd param):

| hash | name |
|---|---|
| `_$8909080e7460c4c9d13103f4` | `scanBattle(budget)` — on-demand scanner |
| `_$9ddd79a3d86c3ad16c7dd44b` | `subscribeMotion(onMotion, {noImmediate})` |
| `_$77f59e9cd494da780b769563` | `getActiveSlot()` |

Motion snapshot (context) fields:

| hash | name |
|---|---|
| `_$f846c8d5ebac9d78eb10094e` | `world` — game-world view (ownCharacter, counters, entities) |
| `battle` (plain atom) | `battle` — raw battle passed to weaponNatives.resolve |
| `_$b11b5e14c741fc4cdea61960` | `wallScan` — wall scanner state |
| `functions` (plain atom) | `functions` |

world fields: `ownCharacter` (plain), `_$528d9b3e2016a372636f303c` = counterA,
`_$cf12bf97212024a6b725bb85` = counterB, `_$af0b510be1001a7fe0745937` = entities,
`_$9b2f2ebaccfa50d0600446ce` = ownX, `_$ac68381d82cf0eedd9c6a20a` = ownY,
`_$318627662c00525b8396ba45` = paused.

Config (4th param) fields: `_$86e38a6c69f3243e016a8be6` = onFrame,
`_$b3a84ea59f6bbba8d13cd8bf` = vetoSuper, `_$0fe8bb0536ab6fc980221848` = measureLatency.

Entity info fields (from engine + predicates): `gid`, `ptr`, `data`, `x`, `y`, `hp`,
`radius`, `_$4a4f22dcb0bf1e746e16e19a` (boolean, alive flag checked by some()),
`_$4ac4dc04b6e372784a1b88d0` = threat.

Cache entry fields (fn_2618 cache, built by syncMotionCache): `seen`,
`_$ac7aa2debb2fd2945bf24c77` = velX, `_$beba420ad4d8b1b78936b59c` = velY.

Debug payload: `at`, `_$13ab7a1e49d0bdd9b32fa122` = counterB,
`_$fb871114125c47432679a723` = ownY, `_$fceb8771bca1722210e1da08` = x,
`_$e93c897329cc39b1a7b30729` = y, `_$2a91f0e48658fe0916be9e8f` = active.

getState fields: `_$9c20020d145f6a0fc3c87a0d` = runtime (manualAim.getState()),
`_$36355a4dda8337d49920de91` = creationError, `_$44da313cc27f8a07e7a16d54` = focusName,
`_$79b105643154285ac6d5ce90` = hasTarget, `_$1bd3d2c25502d9393b241e6c` = tracked (cache size),
`_$a98a2cd19b0bb14864033c19` = updates, `_$c4ded82d77ca3ddba3c08633` = hooks.

manualAim (fn_1008 factory) methods: `screen()`, `clear()`,
`_$2910015f859d1f3a1cecdb4b` = getAimPoint, `_$6325f737dd0d2173ed72fb3c` = (screen read),
`_$d8a97e6adfb272f45f1eb566` = commit, `getState()`.

Note: `native_import_5` (bundle import used as `deps = native_import_5(deps)` in
fn_2070/fn_2617 and `args[i] = native_import_5(x)` in fn_107) is Frida's global
`ptr()` — it converts a raw number address into a NativePointer. autospin.js
models it as `normalizeDeps` (legacy naming, see commit 102d791).

## Shared bundle helpers referenced by aimbot (defined in core/*)

| resolved as | name | role |
|---|---|---|
| fn_514(deps) | `createWeaponNatives` | binds selected/primary/super weapon natives, `.resolve(char, battle)` |
| fn_2618() | `createCache` | `{update, get, clear, size}` |
| fn_1008(deps) | `createManualAim` | manual aim point + preview screen + clock_gettime |
| fn_1292 | `targetingLabel(mode)` | obfuscated seed table (via fn_973) |
| fn_1267 | `isPriorityEntity(x)` | seed-table predicate, forces score -1 |
| fn_488.loc_5 | `isEnemyEntity(x, ignoreBots)` | |
| fn_488.loc_376 | `isFriendlyUnit(battle, x)` | |
| fn_488.loc_534 | `canScan(world, weaponState, scanState)` | |
| fn_488.loc_2064 | `intercept(from, to, vel, zero, dt, speed)` | projectile-motion solver |
| fn_488.loc_230 | `clamp(v, lo, hi)` | |
| fn_1877 | `readSettings(group, config)` | settings table (seed 61158) |
| fn_488.loc_1429 | `syncMotionCache(snapshot)` | fills cache velX/velY/seen |
| fn_2002 | `canHit(world, scanState, weaponState, predicted, candidate)` | line-of-fire feasibility |

## Feature system architecture (verified while reconstructing anti_afk + ally_respawn)

`fn_368` (JirGear startup) builds 4 feature owner groups:

| group | features (ids) | runtime factory |
|---|---|---|
| 0 | [4, 5, 8, 9, 14, 42] killaura, hold_to_shoot, xray, goal, anti_afk, 42 | fn_2488 (battle input runtime) |
| 1 | [10, 11, 12, 15] ball_assist, ball_trajectory, 12, mortis_chain | battle stage side |
| 2 | [17..23] leon_clone, enemy_ammo, disable_shake, teammate_hp, ally_respawn, dps_counter, camera | fn_888 (visual runtime) |
| 3 | [39] | slot 2112 runtime |

`fn_2814` = feature registry: rows `[key, owner, enabled, instance]`,
errors `Feature is outside the menu catalog: `, `Duplicate feature owner: `,
`Feature runtime is unavailable`, `Feature could not be enabled`
(its setEnabled dispatch = fn_2812 → `runtime._$1458b5e5e1ba5d16cc261b4d(key, on)`).

FEATURE_KEYS (fn_488 loc_628, slot 629): `['', 'aim_bot', 'auto_dodge', 'auto_farm',
'killaura', 'hold_to_shoot', 'auto_spin', 'emotes', 'follow', 'xray', 'goal', 'ball_assist',
'ball_trajectory', null, 'anti_afk', 'mortis_chain', 'server_region', 'leon_clone', 'enemy_ammo',
'disable_shake', 'teammate_hp', 'ally_respawn', 'dps_counter', 'camera', 'chromatic_name',
'fps_counter', 'vsync_bypass', 'server_ip']` — index 13 dead, ids are 1-based.

featureId = fn_1875 → fn_1826(magic 36748): `Number.isInteger(x)
? (KEYS[x] ? x : -1) : KEYS.indexOf(x)`. Magic lookup wrappers:
fn_953→fn_2743(31394), fn_2078→fn_2743(47096), fn_2602→fn_2743(36511),
fn_1806→fn_2743(41564), fn_1875→fn_1826(36748).

## Hash → name map (anti_afk + ally_respawn)

| hash | name | where |
|---|---|---|
| `_$1e1d1a0ea4a2176a2e52e360` | inactivityCheck (anti-afk hook target, offsets idx 16) | fn_488 frozen offsets object |
| `_$316a295be826abbc8b0c29da` | scheduler | visual runtime deps (3rd confirmation) |
| `_$9ddd79a3d86c3ad16c7dd44b` | inputGate.watch(callback, spec) | fn_1572 (goal/shared input registration) |
| `_$51d8d61c69230c30ca0ae5f9` | features (owner's iterable of feature ids) | fn_2814 group iteration |
| `_$6869ae54dfeba2b5e217d66a` | featureDefs (deps, per-owner def lists) | fn_2814 |
| `_$c6ca8052007e2c68b9ae8264` | apply | fn_2488 input runtime API |
| `_$8c6005374587f5c5e2c2eb06` | applySaved | registry API (startup re-apply) |
| `_$0e0a1d405897c8f747b1f7d5` | (runtime export, battle side) | fn_2488 + fn_368 |
| `_$c4a008b45f098e9c9a99c679` | submit | offsets object (reconfirmed) |
| `_$6ff76fd71ed8749d4b126f55` | alloc | offsets object (reconfirmed) |
| `_$a0ecdfeb91f25b0091d3e509` | free | offsets object (reconfirmed) |

Battle input runtime (fn_2488) offsets object key order (Object.values indices):
0 mode, 1 screen, 2 own, 3 x, 4 y, 5 data, 6 move, 7 input, 8 submit, 9 alloc,
10 free, 11 fire, 12 `_$ffbd8f1f343d7bcfdf56c231` (goal/hold hook), 13 `_$d822d590a1067e5a255382d1`,
14 `_$01e31636f1888bf1817d00ff`, 15 `_$53241e273efd49bf18d0164f`,
**16 `_$1e1d1a0ea4a2176a2e52e360` (inactivity check — anti-afk Interceptor target)**,
17 `_$86ba4058ce7a7757d0d790db`, 18 `_$0577fe14f99e51f5b1eb4c9d`,
19 `_$c1471263b0d1e96e43128436`, 20 `_$05f14d4afd6ecbf8df7884b1`,
21 `_$abdd3d86d875b8cdaa3016e9`, 22 `_$095e11e0707dccd52138c65d`,
23 `_$598ce79000ea943bbfe4c64b`, 24 `_$a5f41b3a1a01395ef3cf2563`,
25 `_$0fceef48d031fbd184e4369a`.

## anti_afk (features/antiafk.js)

- Menu entry: index 14, key ANTI_AFK, `Anti AFK` / `Анти-АФК`,
  description `Prevent inactivity detection` / `Отключение определения бездействия`
- setEnabled = fn_337: featureId → must be in [4,5,8,9,14,42] else
  `Unknown battle function: <raw>`; state map from fn_1223; apply = fn_1572
- apply (fn_1572) anti-afk branch: fn_1281(16, { onLeave: fn_2818 }, state[14])
- fn_1281 = attachHook(hookId, spec, on): hooks Map keyed by offsets index,
  `Interceptor.attach(Object.values(OFFSETS)[hookId], spec)`, detach+delete on off
- **fn_2818 = the whole feature**: `function onLeave(retval) { if (state[14]) retval.replace(ptr(0)); }`
  — forces the game's inactivity-check return value to 0
- dispose (fn_2502) detaches everything

## ally_respawn (features/allyrespawn.js)

- Menu entry: index 21, key ALLY_RESPAWN, `Respawn timer` / `Таймер возрождения`,
  description `Show teammate respawn time` / `Показ времени возрождения союзников`
- setEnabled = fn_1725 (visual runtime): featureId in [17..23] else
  `Unknown visual function: <raw>`; per-key pre-starts (17→fn_888.loc_116,
  18→loc_28, 19→loc_30, 23→loc_14); shared trio [20,21,22] → fn_2368
- fn_2368 = ensureWidget: scheduler ? `setInterval(tick, 120)` + immediate tick
  : Interceptor.attach(base.add(offsets[nativeIdx]), { onEnter: fn_127, onLeave: fn_1252 })
- tick = fn_212 → scheduler(fn_464, frame); fn_464 → fn_1737 (8810 bclen renderer)
- fn_1737 render pass: hudActive = state[20] || state[21]; entity loop
  `list.add(i * stride).readPointer()`; filters: skip own slot, same team,
  slot in [0,64), valid state pointer; teammate_hp draws
  `'<c'+color+'>'+(i+1)+'. '+name+': '+Math.round(ratio*100)+'%</c>'`;
  ally_respawn draws `'<cFF3333>'+(i+1)+'. '+name+': '+sec+' sec</c>'`
  with `sec = Math.max(0, Math.ceil(deadline - (now - since)/1000))`,
  deadline cached in a Map (computed via fn_1853 snapshot when null);
  dps_counter draws `'<c'+color+'>DPS: '+value+'</c>'`
- fn_888 state counters: ammoFrames, shakeSuppressed, clonesHighlighted,
  utilitySamples, utilityObjects, utilityNativeCalls, utilityQueued,
  offsetChecks, nameReads, nameCacheHits, guardedSkips, errors
- fn_888 entity snapshot fields: id, slot, gid, name, hp, maxHp, alive, ratio, seen
