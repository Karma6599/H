# JirGear Menu / UI Structure

> Reconstructed from `bytecode/main.qbc` — see `menu_strings.md` for the complete raw string dump.

## Menu organization (from strings + config keys in `fn_488` / `fn_701`)

Logger/module tags found in strings: `feature:`, `tab:`, `menu:`, `preset:`, `autofarm:`, `telegram:`, `quick:`, `center:`, `mode:`, `language:`, `emotes:`, `server:`, `popup:`, `tools:`, `emoteui:`, `aim:`, `trickshot:`, `killaura:`, `copy:`, `chroma:`, `camera:`

The main config object (function `fn_488`) exposes these top-level keys:
`functions`, `trickshot` (mode: `manual` / `auto`), `aim`, `dodge`, `killaura`, `spin`, `camera`, `autoFarm`, `quickSlots`, `quickPosition`, `serverRegion`, `fpsUnlock`, `hudLayout`, `usePins`, `emoteSpeed`, `spinSpeed`, `aim_bot`, `auto_dodge`, `hold_to_shoot`, `serverRegion`.

## Tabs / sections

| Section | Labels / toggles found |
|---|---|
| **Aim** | `AIM BOT`, `AIM GADGET`, `AIM SUPER`, `MANUAL AIM`, `TRICKSHOT`, `LOOK AHEAD`, `SELECT TARGET`, `IGNORE BOTS` |
| **Auto Dodge** | `AUTO DODGE`, `DODGE DISTANCE`, `DODGE WHILE IDLE`, `DODGE WITH BALL/OBJECT`, `SAFETY MARGIN`, `AUTO DODGE — BAN LIST`, `ANY ELIGIBLE BRAWLER`, `IGNORE BOTS` |
| **Killaura** | `KILLAURA`, `SKIP ENEMIES ABOVE HP`, `STOP BELOW OWN OWN HP` (string: `STOP BELOW OWN HP`), `LOWEST HP`, `NEAREST`, `SELECT TARGET` |
| **Auto Farm** | `AUTO FARM`, `TARGET TROPHIES`, `AUTO START`, `AUTO SWITCH` (ON/OFF), `AUTO KICK`, `MANUAL KICK`, `CHAIN MORTIS`, `BALL ASSIST`, `FARMING` |
| **Auto Spin** | `AUTO SPIN`, `SPIN SPEED`, `CYCLE / SEC` |
| **Shooting** | `HOLD TO SHOOT`, `AUTO ATTACK` |
| **Camera** | `CAMERA`, `CAMERA HEIGHT`, `FIELD OF VIEW` |
| **FPS / Perf** | `FPS UNLOCK — 240`, `FRAME LIMIT REMOVED`, `VSYNC_BYPASS`, `REAL RENDER FPS`, `FRAME TIME`, `FPS / IP`, `IP HUD`, `LATENCY`, `TARGET: 9999 FPS`, `INFO_FPS`, `DPS_COUNTER` |
| **Visuals** | `X-RAY`, `DEBUG VIEW`, `COLOR & GLOW`, `COLORS & SPEED`, `OPACITY`, `GLOW`, `SPECTRUM`, `SOLID`, `CHROMATIC_NAME` |
| **Brawlers** | `BRAWLERS`, `LOADING BRAWLERS…`, `ANY ELIGIBLE BRAWLER`, `USE GLOBAL SETTINGS`, per-brawler profiles |
| **Emotes & Pins** | `EMOTES`, `PINS`, `PINNED`, `CHOOSE A BUTTON`, `IMPORT AVATAR`, `VICTORY INTRO`, `DEFEAT INTRO`, `CELEBRATE`, `DANCE`, `HERO POSE`, `SHOWTIME` |
| **Quick access** | `QUICK ACCESS`, `QUICK SLOTS`, `QUICK POSITION` |
| **Server** | `BATTLE SERVER`, `SERVER_REGION`, `SERVER_IP_TOGGLE`, `SERVER COPIED`, `CONNECT`, `CONNECTING…`, `BATTLE SERVERS` |
| **HUD Editor** | `EDIT HUD`, `SAVE HUD`, `SHOW HUD`, `RESET LAYOUT`, `RESET CONFIG`, `COMPACT VIEW`, `MONITOR`, `TEAMMATE_HP`, `ALLY_RESPAWN` (teammate health + respawn timers) |
| **Stats / Monitor** | `WINS`, `LOSSES`, `TROPHIES`, `STATS`, `SESSION TIME`, `SHOTS` |
| **Settings** | `MENU SETTINGS`, `LANGUAGE`, `ABOUT MOD`, `MOD CREATORS`, `RESET`, `APPLY`, `RESET STATS` |

## HUD telemetry widgets
- `OPENING BAR`, `FPS / IP`, `NOTIFICATIONS`, `MONITOR` bar
- `TEAMMATE_HP` — show teammate health
- `ALLY_RESPAWN` / `RESPAWNING` — respawn timers
- `DPS_COUNTER`, `LATENCY`, `SESSION TIME`

## Native menu registry
The menu itself is rendered through a **native CModule registry** (not the game's UI):
- `NATIVE_MENU_LIMITS`, `Native color registry full or null`, `Native slider registry full/invalid`, `Unknown slider kind`
- Menu assets are Supercell `.sc` files written at runtime to `/data/data/com.supercell.brawlstars/files/jirgear/` — all six are in `sc_assets/` (they were base64-embedded in the bytecode):
  - `jirgear_menu.sc` (1,220,195 B) — the whole menu UI
  - `autofarm_emblem.sc` (111,051 B)
  - `easter_face.sc` (77,406 B)
  - `jgutils.sc` (27,506 B)
  - `player_avatar_frame.sc` (9,621 B)
  - `menu_hint.sc` (1,250 B)

## Brawler & projectile knowledge base
Dodge profiles are keyed by projectile class names (see `AUTO DODGE — BAN LIST`):
`ARROWPROJECTILE`, `BELLEPROJECTILE`, `BOARROW`, `BOWPROJECTILE`, `BROCKROCKET`, `BROCK_ROCKET`, `ELECTROSNIPERPROJECTILE`, `PIERCEPROJECTILE`, `PIPERPROJECTILE`, `SNIPERPROJECTILE`, `ROCKETGIRLPROJECTILE`, `ROCKETGIRLULTI`, `BALL_TRAJECTORY`, `GOAL`, `HOOP`, `TURRET`, `PET`, `LASER`, `TRAIL`, `EFFECT`, `INDICATOR`, `SPAWN` (full regex: `PROJECTILE|SKILL|BRAWLER|DODGE|LASER|TRAIL|EFFECT|INDICATOR|GOAL|HOOP|SPAWN|TURRET|PET`)

Brawler identifiers: `BELLE`, `BIBI`, `BOARROW`(Bo), `BOLT`, `BOWDUDE`(Dyna?), `BRONSON`, `COLT`, `DARRYL`, `DIGGER`(Digger), `DOUG`, `DYNAMIKE`, `EDGAR`, `ELPRIMO`/`EL_PRIMO`, `FISHTANK`, `FRANK`, `GLOWBERT`, `HANK`, `JACKY`, `JAE-YONG`/`JAE_YONG`, `JESS`, `JESSIE`, `KENJI`, `LARRY_AND_LAWRIE`, `LEON_CLONE`, `LOLA`/`LOLLA`, `MEEPLE`, `MELODIE`/`MELODY`, `MIKE`, `MINT`, `MIPLE`, `MR_P`, `PRIMO`, `RICK`, `RICO`, `ROBOT`, `ROCKETGIRL`, `ROSA`, `SAMURAI`, `STELLA`, `STARR_NOVA`, `TARA`, `TARO`, `TWINS`...

## Misc
- `ANTI_AFK` (anti-idle)
- `DISABLE_SHAKE`
- `JIRGEAR_DATA_DIR`
- `AUTO SWITCH` with `AUTO SWITCH — ON` / `AUTO SWITCH — OFF`
- Tile knowledge: `TILE_SIZE` (bound at runtime, 300 in-game units), `BLOCKS_MOVEMENT` = 128, `BLOCKS_PROJECTILES` = 64
- Scene states: `SCENE`, `RELOAD`, `VIEWPORT`, `WORK`, `RETIRED_SAFE`, `AUX_ORPHAN`, `ORPHAN`, `DRAG`, `DRAG_READY`, `DRAG_MOVE`, `SLIDER`
