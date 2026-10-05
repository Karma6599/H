# JirGear Menu / UI Structure

> Reconstructed from the JirGear QuickJS bytecode (`main.qbc`) — 2,891 functions, 21,624 atoms.
> This is the **complete** feature inventory: 26 numbered toggles + 16 hidden (fromCharCode-obfuscated) toggles + mode selectors / config groups.

## Menu organization

The native menu is rendered through a **native CModule registry** (`NATIVE_MENU_LIMITS`, "Native slider registry full/invalid", "Unknown slider kind") driven by Supercell `.sc` assets written at runtime to `/data/data/com.supercell.brawlstars/files/jirgear/` (all six are in `sc_assets/`):

- `jirgear_menu.sc` (1,220,195 B) — the whole menu UI
- `autofarm_emblem.sc` (111,051 B)
- `easter_face.sc` (77,406 B)
- `jgutils.sc` (27,506 B)
- `player_avatar_frame.sc` (9,621 B)
- `menu_hint.sc` (1,250 B)

Tabs: `tab:battle`, `tab:visual`, `tab:profile`, `tab:about`.
Command dispatcher: `fn_2288` (menu events → actions).
Menu state / config: `fn_488` (the mega config object).
Toggle registry consumer: `fn_51`.

## Toggle Registry A — numbered, plaintext keys (fn_488, offsets 23404–23729)

Built as an array literal: `['0'→'', '1'→'aim_bot', ..., '13'→null (removed slot), ..., '27'→'server_ip']`.

| # | key | UI label | RU label | file |
|---|-----|----------|----------|------|
| 0 | `''` | *(unused)* | | — |
| 1 | `aim_bot` | AIM BOT | | `features/aim_bot.md` |
| 2 | `auto_dodge` | AUTO DODGE | | `features/auto_dodge.md` |
| 3 | `auto_farm` | AUTO FARM | | `features/auto_farm.md` |
| 4 | `killaura` | KILLAURA | | `features/killaura.md` |
| 5 | `hold_to_shoot` | HOLD TO SHOOT | | `features/hold_to_shoot.md` |
| 6 | `auto_spin` | AUTO SPIN | | `features/autospin.js` |
| 7 | `emotes` | EMOTES | | `features/emotes.md` |
| 8 | `follow` | FOLLOW | | `features/follow.md` |
| 9 | `xray` | X-RAY | | `features/xray.md` |
| 10 | `goal` | GOAL | | `features/goal.md` |
| 11 | `ball_assist` | BALL ASSIST | | `features/ball_assist.md` |
| 12 | `ball_trajectory` | BALL_TRAJECTORY | | `features/ball_trajectory.md` |
| 13 | `null` | *(removed slot)* | | — |
| 14 | `anti_afk` | ANTI_AFK | | `features/anti_afk.md` |
| 15 | `mortis_chain` | CHAIN MORTIS | Цепочка Мортиса | `features/mortis_chain.md` |
| 16 | `server_region` | SERVER_REGION | | `features/server_region.md` |
| 17 | `leon_clone` | LEON_CLONE | Клон Леона | `features/leon_clone.md` |
| 18 | `enemy_ammo` | ENEMY_AMMO | | `features/enemy_ammo.md` |
| 19 | `disable_shake` | DISABLE_SHAKE | | `features/disable_shake.md` |
| 20 | `teammate_hp` | TEAMMATE_HP | | `features/teammate_hp.md` |
| 21 | `ally_respawn` | ALLY_RESPAWN | | `features/ally_respawn.md` |
| 22 | `dps_counter` | DPS_COUNTER | | `features/dps_counter.md` |
| 23 | `camera` | CAMERA | | `features/camera.md` |
| 24 | `chromatic_name` | CHROMATIC_NAME | | `features/chromatic_name.md` |
| 25 | `fps_counter` | INFO_FPS | | `features/fps_counter.md` |
| 26 | `vsync_bypass` | VSYNC_BYPASS | | `features/vsync_bypass.md` |
| 27 | `server_ip` | (Battle servers page) | | `features/server_ip.md` |

Mode selector (UI row between GOAL and BALL ASSIST, not in the numbered registry):

| key | UI label | file |
|-----|----------|------|
| `trickshot` (mode: manual/auto) | TRICKSHOT | `features/trickshot.md` |

## Toggle Registry B — hidden, `String.fromCharCode`-obfuscated keys (fn_488)

The keys/labels are **never stored as plaintext cpool strings** — they are built at runtime with `String.fromCharCode(...)` (anti-static-analysis). Decoded from the disassembly:

| key | UI label | friendly label | file |
|-----|----------|----------------|------|
| `sync_bot` | SYNC_BOT | Bot sync | `features/sync_bot.md` |
| `skip_moment` | SKIP_MOMENT | Skip highlight | `features/skip_moment.md` |
| `real_names` | REAL_NAMES | Real names | `features/real_names.md` |
| `player_trophies` | PLAYER_TROPHIES | Player trophies | `features/player_trophies.md` |
| `gadget_timer` | GADGET_TIMER | Gadget cooldown | `features/gadget_timer.md` |
| `charge_hud` | CHARGE_HUD | Super / Hyper state | `features/charge_hud.md` |
| `safe_timer` | SAFE_TIMER | Safe shield timer | `features/safe_timer.md` |
| `hide_super_aim` | HIDE_SUPER_AIM | Hide Super aim | `features/hide_super_aim.md` |
| `online_status` | ONLINE_STATUS | Online status | `features/online_status.md` |
| `team_chat_uncensor` | TEAM_CHAT_UNCENSOR | Team chat uncensor | `features/team_chat_uncensor.md` |
| `gray_mod` | GRAY_MOD | Gray mod | `features/gray_mod.md` |
| `super_hold` | SUPER_HOLD | Super held | `features/super_hold.md` |
| `super_hold_blink` | SUPER_HOLD_BLINK | Super blink | `features/super_hold_blink.md` |
| `nani_gadget` | NANI_GADGET | Nani gadget | `features/nani_gadget.md` |
| `skip_prestige` | SKIP_PRESTIGE | Skip prestige | `features/skip_prestige.md` |
| `skip_rewards` | SKIP_REWARDS | Skip animations | `features/skip_rewards.md` |

## Config groups (fn_488 object literal, offsets ~35900–37400)

```
version, language, functions,
trickshot: { mode: 'manual' | 'auto' },
aim:       { ignoreBots, useSuper, useGadget, debugView, ... },
dodge:     { reactionSpeed, directionPrecision, safetyMargin, horizonMs, moveDistance,
             dodgeWhenCarrying, dodgeWhenStanding, ignoredBrawlerIds },
killaura:  { targeting, ignoreBots, useSuper, useGadget, debugView, minOwnHp, maxTargetHp },
spin:      { speed },
camera:    { mode ('firstPerson'|...), fov [50,100] d75, eyeHeight [150,600] d350, chase },
serverRegion: { regionId, hud },
autoFarm:  { enabled, selectedBrawlers, targetTrophies, attack, follow, autoSwitch, autoStart,
             useSuper, useHyper, useGadgets, usePins, mode },
colors:    { mode ('solid'|'spectrum'), red, green, blue, hue, cycleSeconds, saturation,
             brightness, opacity, glow },
menu:      { motion, compact, language ('en'|'ru') },
fpsUnlock, emoteHud, emoteRepeat, emoteSpeed, onboardingSeen,
quickPosition, hudLayout, profiles, quickSlots,
handle / telemetry / floaters (HUD widgets), scale
```

## Battle runner stats (fn_2488 — numbered counter registry)

`ticks, scans, shots, attempts, queued, heldAimResolved, xrayRewrites, xrayLastGid, xrayBlocked, superAttempts, superShots, moves, pulses, rejectedWalls, targetTraces, nativeSuppressed, tickMsTotal, tickMsMax` — the aim/dodge/xray runtime is driven from fn_2488 (`Battle functions require the shared scanner`).

## Implementation runtimes

| runtime | fn | scope |
|---------|----|-------|
| Mega config + menu registration | `fn_488` | everything above; toggle registries A & B |
| Menu command dispatcher | `fn_2288` | feature:/tab:/menu:/quick:/server:/emotes:/popup: events |
| Toggle state store | `fn_51` | persistence of registry A |
| Battle runner | `fn_2488` | aim/dodge/xray/super/stats per-tick |
| Ball/Mortis runtime | `fn_109` | goal, ball_assist, ball_trajectory, mortis_chain, trickshot |
| Visual runtime | `fn_888` | enemy_ammo, leon_clone, disable_shake, chromatic name, HUD widgets ("Visual runtime requires libg base") |
| Autofarm runner | `fn_1013` / `fn_1692` | follow/autoSwitch/battles/stats |
| Autofarm config validators | `fn_215` / `fn_1463` | filter/attack/followTarget/fireDelayMs |
| Camera | `fn_476` (runtime), `fn_1516` (config) | mode/fov/eyeHeight/chase |
| Server region | `fn_1343` | regionId/hud, server events |

## Tabs / sections (from labels + events)

| Tab | Contents |
|-----|----------|
| **battle** (`tab:battle`) | aim_bot, auto_dodge, auto_farm, killaura, hold_to_shoot, auto_spin, emotes, follow, xray, goal, trickshot (mode), ball_assist, ball_trajectory, anti_afk, mortis_chain + sub-rows (AUTO KICK, AUTO SWITCH, AUTO START, TARGET TROPHIES, USE SUPER/GADGET, BAN LIST, IGNORE BOTS, DODGE DISTANCE, SAFETY MARGIN, SPIN SPEED, SELECT TARGET, LOWEST HP / NEAREST, SKIP ENEMIES ABOVE HP, STOP BELOW OWN HP) |
| **visual** (`tab:visual`) | edit hud, battle servers (server_region, server_ip), leon_clone, enemy_ammo, disable_shake, teammate_hp, ally_respawn, dps_counter, camera (+ height/fov), chromatic_name, fps_counter, vsync_bypass, gray_mod, super_hold(+blink), nani_gadget, gadget/charge/safe timers, hide_super_aim, color & glow + colors & speed + opacity, language |
| **profile** (`tab:profile`) | profiles (per-brawler), monitor, stats (WINS/LOSSES/TROPHIES/SESSION TIME), presence, real_names, player_trophies, online_status, sync_bot, skip_* toggles, team_chat_uncensor |
| **about** (`tab:about`) | about mod, mod creators |

## HUD telemetry widgets
- `OPENING BAR`, `FPS / IP`, `NOTIFICATIONS`, `MONITOR` bar
- `TEAMMATE_HP` — teammate health
- `ALLY_RESPAWN` / `RESPAWNING` — respawn timers
- `DPS_COUNTER`, `LATENCY`, `SESSION TIME`, `INFO_FPS`

## Logger/module event tags

`feature:`, `tab:`, `menu:`, `preset:`, `autofarm:`, `telegram:`, `quick:`, `center:`, `mode:`, `language:`, `emotes:`, `server:`, `popup:`, `tools:`, `emoteui:`, `aim:`, `trickshot:`, `killaura:`, `copy:`, `chroma:`, `camera:`, `combat:`, `memory:`, `presence:`

## Brawler & projectile knowledge base

Dodge profiles are keyed by projectile class names (see `AUTO DODGE — BAN LIST`):
`ARROWPROJECTILE`, `BELLEPROJECTILE`, `BOARROW`, `BOWPROJECTILE`, `BROCKROCKET`, `BROCK_ROCKET`, `ELECTROSNIPERPROJECTILE`, `PIERCEPROJECTILE`, `PIPERPROJECTILE`, `SNIPERPROJECTILE`, `ROCKETGIRLPROJECTILE`, `ROCKETGIRLULTI`, `BALL_TRAJECTORY`, `GOAL`, `HOOP`, `TURRET`, `PET`, `LASER`, `TRAIL`, `EFFECT`, `INDICATOR`, `SPAWN`.

Hidden (fromCharCode) projectile/damage internals: `CactusProjectile`, `CactusSpike`, `CrossBomber`, `Mine`, `Ulti`, damage classes `Dot` / `Damage` / `HealAndDamage` / `HotAndDot` / `StatusEffect` / `BulletExplosion` (fn_1081), flight-model reason codes (`native-target`, `invalid-flight-duration`, `native-bounce-progress-fit`, ... in fn_2461), `grom-cross-stage`, `larry-second-hit-window` (fn_2092), `native-mine-native-radius` (fn_1263), `thrower-v4` / `landing-filter` (fn_1202).

Brawler identifiers: `BELLE`, `BIBI`, `BOARROW`(Bo), `BOLT`, `BOWDUDE`, `BRONSON`, `COLT`, `DARRYL`, `DIGGER`, `DOUG`, `DYNAMIKE`, `EDGAR`, `ELPRIMO`/`EL_PRIMO`, `FISHTANK`, `FRANK`, `GLOWBERT`, `HANK`, `JACKY`, `JAE-YONG`/`JAE_YONG`, `JESS`, `JESSIE`, `KENJI`, `LARRY_AND_LAWRIE`, `LEON_CLONE`, `LOLA`/`LOLLA`, `MEEPLE`, `MELODIE`/`MELODY`, `MIKE`, `MINT`, `MIPLE`, `MR_P`, `PRIMO`, `RICK`, `RICO`, `ROBOT`, `ROCKETGIRL`, `ROSA`, `SAMURAI`, `STELLA`, `STARR_NOVA`, `TARA`, `TARO`, `TWINS`...

## Misc
- `ANTI_AFK`, `DISABLE_SHAKE`, `JIRGEAR_DATA_DIR`
- Tile knowledge: `TILE_SIZE` (300 in-game units), `BLOCKS_MOVEMENT` = 128, `BLOCKS_PROJECTILES` = 64
- Scene states: `SCENE`, `RELOAD`, `VIEWPORT`, `WORK`, `RETIRED_SAFE`, `AUX_ORPHAN`, `ORPHAN`, `DRAG`, `DRAG_READY`, `DRAG_MOVE`, `SLIDER`
- Presets: `ice`, `violet`, `sunset`, `mint` (colors); languages `en` / `ru`
