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
- `allyrespawn.js` — COMPLETE (shared visual runtime fn_888/fn_2368 widget trio,
  scheduler-driven 120 ms tick, per-entity deadline Map, no hash keys).
- `antiafk.js` — COMPLETE (fn_2488 battle input runtime, anti-afk branch);
  all `_$hash` keys renamed to recovered/positional names — see the full
  offsets map below. Unattributed slots (13/14/15/25, plus behavior-named
  gates) carry positional names and are documented with their evidence level.

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

Battle input runtime (fn_2488) offsets object — full hash → name map
(Object.values indices; fn_488 frozen object, keys verified against consumers):

| idx | hash | name | evidence |
|---|---|---|---|
| 8 | `_$c4a008b45f098e9c9a99c679` | `submit` | fn_1139 getNative(8,'void'); same key in autospin + entity tables |
| 9 | `_$6ff76fd71ed8749d4b126f55` | `alloc` | fn_1139 getNative(9,'pointer',['ulong']) |
| 10 | `_$a0ecdfeb91f25b0091d3e509` | `free` | fn_1139 getNative(10,'void') ×3 |
| 12 | `_$ffbd8f1f343d7bcfdf56c231` | `activateWeapon` | VERIFIED: same fn_488 local 122 resolves with label 'activate weapon' in fn_2617 (aimbot); fn_1572 attachHook(12, state[goal]||state[hold_to_shoot], {onEnter: fn_1754}); fn_2803 calls it as 7-arg native (ptr,int,int,ptr,ptr,int,int)→int; fn_1754 rewrites args[1]/args[2]/args[5]/args[6] (aim redirect) |
| 13 | `_$d822d590a1067e5a255382d1` | `native13` | no consumer in any reconstructed tree (also entity-table key + aim array [2]); positional name |
| 14 | `_$01e31636f1888bf1817d00ff` | `native14` | no consumer (aim array [3]; entity table uses same VALUE under `_$f0cfe3c418d3ef67623fc7d6`; fn_2461 payload key of same name holds an {x,y} point); positional name |
| 15 | `_$53241e273efd49bf18d0164f` | `native15` | no consumer (aim array [4]); positional name |
| 16 | `_$1e1d1a0ea4a2176a2e52e360` | `inactivityCheck` | VERIFIED: fn_1572 attachHook(16, state[anti_afk=14], {onLeave: fn_2818}); fn_2818 forces retval 0 |
| 17 | `_$86ba4058ce7a7757d0d790db` | `aimX` | VERIFIED: fn_488 loc 2090 = aim offsets array [5]; fn_107 (aimbot commit) does handle.add(AIM[5]).writeS32(shot.x) (idx const 2049=5); fn_2803 .add(VALUES[17]).readS32()/writeS32(x); ball runtime fn_2230/fn_1919 read entity values[22] |
| 18 | `_$0577fe14f99e51f5b1eb4c9d` | `aimY` | VERIFIED: fn_488 loc 1298 = aim array [6]; fn_107 handle.add(AIM[6]).writeS32(shot.y) (idx const 1332=6); fn_2803 .add(VALUES[18]).readS32()/writeS32(y) |
| 19 | `_$c1471263b0d1e96e43128436` | `packedPosition` | fn_2803 getNative(19,'uint64',['pointer','pointer','pointer']); result .toString(16).padStart(16) split into x (low 32) / y (high 32) |
| 20 | `_$05f14d4afd6ecbf8df7884b1` | `ctxGate` | fn_2803 getNative(20,'int',['pointer']) — required gate on the same ctx as packedPosition's 3rd arg |
| 21 | `_$abdd3d86d875b8cdaa3016e9` | `ctxGateAlt` | fn_2803 getNative(21,'int',['pointer']) — first alternative gate |
| 22 | `_$095e11e0707dccd52138c65d` | `ctxGateFallback` | fn_2803 getNative(22,'int',['pointer']) — second alternative gate (21 || 22) |
| 23 | `_$598ce79000ea943bbfe4c64b` | `cellIndex` | fn_2803 getNative(23,'int',['pointer']) — reads index from the entity array element |
| 24 | `_$a5f41b3a1a01395ef3cf2563` | `cellOffset` | fn_2803 getNative(24,'int',['int']) — index→coordinate offset: x = x(ptr) + native24(idx+90), y = y(ptr) + native24(idx) |
| 25 | `_$0fceef48d031fbd184e4369a` | `native25` | no consumer (value = cfg[513], breaks the cfg[717-721] run of 20-24); positional name |

Plain-atom keys (unhashed in the bytecode, kept verbatim): 0 mode, 1 screen,
2 own, 3 x, 4 y, 5 data, 6 move, 7 input, 11 fire.
Reads via fn_1006 getNative: 0 ('pointer',[]) — returns root ptr; 2 ('pointer',['pointer']);
3/4 ('int',['pointer']) coordinate getters; 6 ('pointer',…) fn_2037; 7 ('pointer',…) fn_1139.
Slots 1/5/11/13/14/15/25 have no reader inside the fn_2488 subtree (shared pool:
the same values reappear in the entity-side frozen object — fn_488 loc 1661 —
consumed by fn_109 via Object.values(...).concat([screen]) — and in the aim
offsets array — fn_488 loc 1891 = freeze([fire, activateWeapon, 13, 14, 15,
aimX, aimY, +3 more]), only [1] activateWeapon is read by fn_2617).
Related extra natives outside the offsets table, resolved by literal label:
'gadget readiness' (cfg slot → natives cache 26, fn_2598), 'use gadget'
(→ cache 27, fn_2598), killaura hook target = cfg[726] resolved directly by
fn_2754 (Interceptor.attach with onEnter fn_552). fn_2317 warmup labels are
built as 'Battle ' + Object.keys(OFFSETS)[index].

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

## auto_dodge (features/autododge.js)

- Real module subtree: fn_1432 [#535] (parent fn_509 = battle-modules bootstrapper,
  manifest index '6') + 90 descendants. The auto-generated doc's fn_1443 attribution
  was wrong (fn_1443 = the save-state aggregator). fn_1903 = options normalizer,
  fn_2651 = threat collector, fn_2207 = tick, fn_1333 = antiSnipe jitter
- Options model: 21-slot STATE array + OPTION_KEYS order (reactionSpeed,
  directionPrecision, safetyMargin, horizonMs, reactionMs, commandIntervalMs,
  moveDistance, holdDirectionMs, compactDodge, parkMargin, releaseHysteresis,
  antiSnipe, antiSnipeMs, antiSnipeReach, trimHazardEnd, maxThreatRadius,
  dodgeWhenCarrying, dodgeWhenStanding, ignoredBrawlerIds, aggressiveness,
  ignoredThreatPairs); defaults [100,48,45,700,0,16,360,0,true,40,8,false,130,
  0.85,true,360,true,true,[],75,[]]; ranges in fn_1903 spec map
- Directions = Array.from({length: directionPrecision}, (e,i) => unit vector 2*pi*i/N)
  (fn_1409 + fn_209)
- Threat pipeline (fn_2651): providers[6] projectile scan -> per-projectile
  fn_2666; providers[7] zone provider; own-position marker hazard (ttl 2.5s);
  enemy body circles (reach test); aim prediction (cap 1.3s); tracker.update ->
  dispatch via memoized 4-tuple traits (fn_1394) to subsystem expanders; horizon
  finalization (markers <= 2.5s, enemy <= planHorizon, aim <= 1.3s)
- Subsystem expanders: headingTracked (fn_8), timedBurst (fn_1733), curving
  (fn_2291, angVel cap 12 rad/s, dt clamp 16-250ms), controllerProjectile
  (fn_1389, phase 380-760 sweep +/-50deg), sniper (fn_205, corridor
  min(70, v*0.012), BO burst), spread (fn_1808, first-contact burst)
- Sniper classes: 1 BELLE, 2 PIPER, 3 BO, 4 PIERCE via canonical names
  (ELECTROSNIPER/BELLEPROJECTILE, SNIPERPROJECTILE/PIPERPROJECTILE,
  BOWDUDE/BOARROW, PIERCE...) matched against fn_2441 evaluator; loc_104 = 3 = BO
- Tick (fn_2207): 6 gates (enable, suspend, standing+isMoving native flag,
  carrying, own staleness 150ms, same-frame dedupe); teleport-safe motion
  (speed <= max(3000, 4*maxSpeed), clamp to maxSpeed); calls the shared-library
  direction engine registry['_$83a10f3eb573b85fb3c0b8e0'] with a 20-field
  config (angleSpread = pi*(0.12+0.88*aggressiveness/100), hop = clamp(60,360)*
  (1.3-0.7*aggressiveness/100), compactDodge ? parkMargin : false, ...);
  stores plan in loc_108, holdUntil = now + holdDirectionMs on direction change
  (dot < 0.98), planMoved on delta > 0.001
- antiSnipe (fn_1333): perpendicular jitter to the aim line, flip every
  antiSnipeMs*(0.75+random*0.5), drift correction beyond 150 from anchor,
  wall check via raycast (limit 140) with side flip fallback
- Native hook (fn_1061 + fn_743/fn_2374): NativeFunction(ptr,'pointer',[]) at
  the offset-220 hook; onEnter reads own entity (x/y/radius/speed/maxSpeed/
  heading/gameTs/isCarrying via readFloat/readU8), samples position history
  (150ms window, 64 cap), writes dodge target position (writeS32 x/y + bridge
  commit), command gate = commandIntervalMs; onLeave writes plan command floats
  (x*100/y*100), active byte, timestamp
- fn_1462 = requireDodgeDep (lazy dep resolution, TypeError 'Missing dodge
  dependency <name>'); registry keys resolved through fn_509's manifest

## Hash -> name map (auto_dodge)

- '_$71cd06c96e960f95ce5754ac' -> setOptions (fn_1903, registry on ctx)
- '_$e301ab50874e83131d4045f3' -> planDodge (fn_2651)
- '_$797c01311c01b478a69339bd' -> readOwnEntity (fn_1709)
- '_$762e1513b74417ddb14ab31f' -> readNativeFlag (fn_1628)
- '_$914ccde1abebb373d8b8f750' -> clampToPlayfield (fn_616)
- '_$498063d1494ef410120f82f8' -> writePosition (fn_9)
- '_$a58ffce950afff77a5752646' -> planDodgeStep (fn_2207)
- '_$a65e0a2462e673d88e6feee8' -> installNativeHook (fn_1061)
- '_$194dfac1a42f1a727dbf1203' -> resetDodgeState (fn_1231)
- '_$3ef3235fb754a3f1265d70a7' -> getPlan (fn_608, returns loc_108)
- '_$d512b339e08eeedc9d9e72da' -> isDodging (fn_2014, returns loc_26)
- '_$c57de1024fd5027a5a9568b9' -> isDodgingOrMoved (fn_428, loc_26 || loc_55)
- '_$828f136528603782e8c3f694' -> aggressiveness (option 19, [0,100], def 75)
- '_$5a852abb2baf216bd9695a90' -> ignoredThreatPairs (option 20, [id<512, class 0-7] pairs)
- '_$443793ddaa450ee38c083a7f' -> ignoredBrawlers (option, array of names)
- '_$acd71be6ec997601e3b7a920' -> antiSnipeBrawlers (option, def PIPER/COLT/BEA/BEE/BELLE/ELECTROSNIPER)
- '_$b8098fead853d9d093ab84d7' -> margin (hazard/ownRec field, = safetyMargin)
- '_$28da3c8e1f0b48c4a4e289cd' -> horizon (ownRec field, horizonSec)
- '_$ac7aa2debb2fd2945bf24c77' -> vx (hazard field)
- '_$beba420ad4d8b1b78936b59c' -> vy (hazard field)
- '_$eff2e994b9058c064b527129' -> ttl/end (hazard field)
- '_$e64a8b1942ab80ed22f8edd2' -> ownerBox (hazard field)
- '_$cb72a18c4c987235409df8b0' -> planHorizon (hazards array property, atom #5022)
- '_$c94b2d90bacf9319e3c26783' -> raycast (helpers registry, wall clearance)
- '_$83a10f3eb573b85fb3c0b8e0' -> directionEngine (helpers registry, shared scoring engine)
- '_$81ecbe0191ce69f51fbc7303' -> estimateDistance (module ctx)
- '_$96db106b20dce7e9e184c70b' -> buildHazard (module ctx)
- '_$a18b02557b1a1c19d436e5f7' -> commitPosition (bridge method)
- '_$5c39acaea68f7e2dca79827b' -> clamp (helpers registry, loc_112)
- '_$9bd9ec1d23e38e503beb4bd7' -> getPlayfieldWidth (helpers registry)
- '_$f7c30d51cf08aedbf4c036af' -> getPlayfieldHeight (helpers registry)
- '_$d51fbbbf8e8d9c78c4895a8b' -> effectiveMargin (per-hazard field)
- '_$ddf5f1373eac550ad776b11e' / '_$f14bb127548e574dafce6ee1' -> nearest-enemy scan internals (fn_2584)
- '_$4133aae8c4c8e56b452cdf29' / '_$926d5cde826d9884789cefa6' -> geometry solver fields (fn_669)
- '_$c28d5317b4e256937cc4c90f' / '_$c0858225bbc8ae0227f380a7' -> actor-cache Map keys (fn_767)
- '#1577' = x, '#1804' = y, '#2715' = vx, '@'capture_2381'' = vy, '#2416' = id,
  '#2722' = own x, '@'capture_2388'' = own y, '#2723' = radius, '#3532' = gameTs,
  '@'capture_2389'' = enemies iterable, '#2729'/'#2730' = actor iterables,
  '#4775' = score, '@'call_arg_403_0'' = plan, '@'call_arg_271_4'' = isCarrying,
  '@'call_arg_896_0'' = own maxSpeed, '@'call_arg_296_0'' = Math.PI
- Conventions corrections verified this session: @stock[catch] = 'length',
  @stock[cause] = 'next', @stock[extends] = 'value', @stock[true] = 'return',
  #54 = 'done', #125 = Symbol.iterator, #31 = 'prototype', #126 = 'call'

## auto_farm (features/autofarm.js) — session 3

Real module subtree: fn_75 [#1048] (parent fn_488) + 83 descendants =
84 functions, ~110KB bytecode (2x autododge). The auto-generated doc's
fn_215 attribution is the menu config panel, not the module.

### Delivered this session (byte-verified, line by line)

Factory fn_75, API methods (fn_2426 start, fn_1633 setEnabled, fn_1013
setOptions, fn_2750 refresh/poll, fn_236 getTimings, fn_1692 getState +
fn_171/fn_291/fn_2633 mappers, fn_2282 resetStats, fn_490 dispose),
lifecycle (fn_2864 stop, fn_462 cleanup, fn_1298 setReason, fn_2608
reportError, fn_945 tick, fn_2321 menuTick, fn_1305 finalizeBattle,
fn_2842 beginFollowBattle, fn_1294 updateBattleTrophies), helpers
(fn_1577 runtime, fn_2442/fn_609 dispatchers, fn_254/fn_610/fn_2775/
fn_1376/fn_591 thunks, fn_2432 readPosition, fn_980 clearBattle,
fn_854 joinBattle, fn_2672 selectBrawler, fn_1461 skipResults,
fn_686 refreshBrawlers, fn_599/fn_1077 brawler views, fn_2418
updateFarm, fn_2468 registerLabel, fn_1880 tryMove, fn_77
installBattleHook, fn_1383/fn_2686/fn_1774/fn_958/fn_1131/fn_438/
fn_1573/fn_60/fn_641 predicates/finders, fn_2027 getOptionsSnapshot).

### PENDING (verified boundaries, deep read next session)

The in-battle AI engine: fn_2520 (2296 instr, processBattleResult) +
fn_1965, fn_1825, fn_2411, fn_1616, fn_2728, fn_2417, fn_784, fn_2735,
fn_614, fn_632, fn_1147, fn_2746, fn_2030, fn_1657 and their
descendants (movement/attack/targeting micro-decisions). In autofarm.js
these are collapsed into the executeBattlePlan boundary — the verified
entry guards (slot record checks, gate locks, world-view fetch) are
kept, the phase-level decisions (PHASES table 0-29) are reconstructed
from the state machine, and the per-entity logic needs the next pass.
Analysis artifacts with the full call graph + slot map are preserved in
_AUTOFARM_ANALYSIS.md.

### fn_75 state model (local slot N = loc_(N-1), arg1 = deps at 0)

- slot59 started, slot79 enabled, slot109 disposed, slot175 revision
- slot147 startedAt, slot38 lastError, slot13 reasonCode, slot87 ticking
- slot120 gamePhase, slot32 idleStart, slot52 inBattleSince, slot53 joining
- slot14 reconnected, slot123 lastTickAt, slot163 lastRefreshAt/pollAt
- slot58/73 gadget timers, slot157 gadgetWindow, slot162 followAnchor
- slot131 lastResultKey, slot69 selectedIdx, slot74 prevPick, slot153 prevIdx
- slot95 session {0:startedAt..8:lastDelta}, slot63 farm {0:phaseA,1:phaseB,
  2:target,3:reason,4:extra,5:counters[9]}, slot130 options
- slot89 base, slot168 engine, slot164 api, slot139 hook, slot64 battle
- 48 closures: slot1 fn_1461, slot33 fn_1965, slot122 fn_2728, slot81
  fn_1374, slot114 fn_2411, slot146 fn_1305, slot26 fn_1577, slot99
  fn_2864, slot108 fn_1298, slot174 fn_2608, slot180 fn_599, slot2
  fn_686, slot23 fn_1294, slot115 fn_2746, slot96 fn_2432, slot24
  fn_2775, slot85 fn_2418, slot25 fn_1376, slot48 fn_254, slot15
  fn_610, slot121 fn_1147, slot117 fn_614, slot16 fn_1618, slot141
  fn_2417, slot149 fn_2006, slot11 fn_2030, slot113 fn_2735, slot154
  fn_302, slot70 fn_1880, slot104 fn_1657, slot5 fn_2468, slot143
  fn_591, slot151 fn_1825, slot12 fn_1616, slot39 fn_632, slot72 fn_43,
  slot137 fn_784, slot30 fn_2520, slot165 fn_2672, slot105 fn_854,
  slot65 fn_980, slot50 fn_2842, slot129 fn_2321, slot67 fn_945,
  slot84 fn_77, slot124 fn_462, slot92 fn_2442, slot118 fn_609

### Hash -> name map (auto_farm API + engine contract)

| hash | name | evidence |
|---|---|---|
| `_$326b40333128b4d78bc7e739` | start | fn_2426; UI label START; setEnabled calls it when !started |
| `_$1458b5e5e1ba5d16cc261b4d` | setEnabled | fn_1633 (same hash as autospin/aimbot) |
| `_$0e0a1d405897c8f747b1f7d5` | setOptions | fn_1013 (same hash as aimbot setTargeting / battle-side export) |
| `_$98706144ef6b6cdb9e9923df` | refresh | fn_2750; engine has same-key brawler fetch (fn_686) |
| `tick` (plain) | tick | fn_945 registered by name |
| `_$cc9ef745c7beaad8fcdac2ea` | getTimings | fn_236 diagnostics probe |
| `_$814748ecc47856e7b144daa6` | getState | fn_1692 (same hash as all modules) |
| `_$6238cfbe1bb46d10e08d6328` | resetStats | fn_2282; UI label RESET STATS |
| `_$22320225cdd7c427d4b8d3cb` | notifyRejected | gate method (reconfirmed from autospin) |
| `_$2b1d9859a05368f4f18995bd` | checkPathBudget | gate method (reconfirmed) |
| `_$9ddd79a3d86c3ad16c7dd44b` | watch | gate method (reconfirmed, installBattleHook) |
| `_$4cb26d224db7394fc9cd96ef` | engine.isInBattle | probed in tick/menuTick/cleanup as battle presence |
| `_$4de9456cc438a21076dea802` | engine.isFreshBattle | distinguishes fresh battle join |
| `_$d38631472831ee8c61ada5ce` | engine.readGamePhase | gamePhase code (0 menu, 22 active screen) |
| `_$98706144ef6b6cdb9e9923df` (engine) | engine.fetchBrawlers | raw brawler list |
| `_$3da9401690a091035152af16` | engine.readOwnSlotIndex | selectBrawler arg |
| `_$0a4631483a85e4a76340aef1` | engine.selectBrawler | by id, menuTick switch path |
| `_$6975f2a66b3886417ebe1eb1` | engine.canStartBattle | matchmaking gate |
| `_$bfb17577a7d7ce39f624c757` | engine.canUseGadget | pre-battle gadget check |
| `_$60894cda100942d3c8f19083` | engine.useGadget | pre-battle gadget use |
| `_$fe75ec1a10bd4566217717e6` | engine.useSuper | post-join super use |
| `_$c9a9e1a7599900ccda418b62` | engine.startBattle | retry backoff path |
| `_$4c25a9d3665c3d44671a6b7b` | engine.readBattleView | world/entities view |
| `_$f846c8d5ebac9d78eb10094e` | engine.readWorld | motion snapshot view |
| `_$9bd9ec1d23e38e503beb4bd7` / `_$f7c30d51cf08aedbf4c036af` / `_$735ecb99890a46f30c70f919` | mover.canMove / mover.ready / mover.step | battle[5505] movement helper trio |
| `_$b1c1fd9b08c939a58752485f` / `_$2c8df886ef4dd948d6d253ae` / `_$9eeae86f99566aed4d53508f` | engine.install hook spec | installBattleHook args |
| `_$f9114d7e00ca74bd99fe3676` | engine.reset | cleanup |
| `_$65b3440634fedfa37cf93dc8` | gate.isLockedProbe | skipResults guard |
| `_$514b2e44ae09fa0ecd67bd1d` | deps[6029].detach | hook detach |
| `_$0cb1e6e12110cb6253361dd5` | deps[6029].readPendingResult | pending result probe |
| `_$371edf41cefa490bf13678bf` | gate.releaseAlt | cleanup release |
| `_$d59c5e089e027c280678dbe9` | options (snapshot key) | ctx object + getState |
| `_$82d621c353e8b511991868b6` | gate (ctx key) | ctx object |
| `_$959ddfbde0867dbe30d9b573` / `_$18bf150356dd129b8567a861` | rate tracker config (2, 1000) | fn_1005 arg |
| `_$9152bb47b295cda5e547b11e` | createAutoFarm (registry export) | fn_488 exports table |
| `_$63be9aca05f57f6cf9d7e4df`, `_$05ec49aa245383348d1cac58`, `_$42dff362b2a786e5a82f1f83`, `_$6efc9ae1149d626e5ff2b31b`, `_$45345448a194f2a58b520758`, `_$57cc67270c44b1649561b056`, `_$a1e84b831583247974945566`, `_$03518639e9f4c4742ffc4f05`, `_$fc173d49c1cb34effb0d77f1`, `_$e60f0ad6faf3d9ba0a4ff5d1`, `_$cc0099f13af4944a3117abd1`, `_$192fb677c15ae506902345a0`, `_$e8720c0b26835c8f5ce08de0`, `_$02ba24c1a53c7d4d51555801`, `_$668024f76431ae04690f70bf`, `_$9d77b14fac7a1211990eb2e1`, `_$785d5ef00166ecb2b43c23ed`, `_$245628981788bf6021e19fac` | getState/view field keys (kept verbatim; UI panel contract) | fn_1692/fn_1077 |
