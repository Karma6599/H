# JirGear — Reverse Engineering

Reverse-engineering of the JirGear Brawl Stars mod (custom QuickJS bytecode + custom Frida gadget).

This repo contains **only the two working folders**:

- **`ui/`** — menu structure (complete toggle registries), menu strings, and the six runtime-extracted Supercell `.sc` menu assets.
- **`features/`** — one file per feature: **50 files** covering all 43 toggles (26 numbered + 16 hidden fromCharCode-obfuscated + trickshot) plus the config groups (quick slots, HUD editor, colors, FPS, brawlers, network, presence).

Each feature file documents: the menu key, toggle index, UI label, config keys, key strings, the implementation functions (with closure subtrees), and the relevant disassembly excerpts.

## Feature inventory

### Toggle Registry A — numbered, plaintext (26)
`aim_bot` · `auto_dodge` · `auto_farm` · `killaura` · `hold_to_shoot` · `auto_spin` · `emotes` · `follow` · `xray` · `goal` · `ball_assist` · `ball_trajectory` · `anti_afk` · `mortis_chain` · `server_region` · `leon_clone` · `enemy_ammo` · `disable_shake` · `teammate_hp` · `ally_respawn` · `dps_counter` · `camera` · `chromatic_name` · `fps_counter` · `vsync_bypass` · `server_ip` (+ mode selector `trickshot`)

### Toggle Registry B — hidden, `String.fromCharCode`-obfuscated (16)
`sync_bot` · `skip_moment` · `real_names` · `player_trophies` · `gadget_timer` · `charge_hud` · `safe_timer` · `hide_super_aim` · `online_status` · `team_chat_uncensor` · `gray_mod` · `super_hold` · `super_hold_blink` · `nani_gadget` · `skip_prestige` · `skip_rewards`

### Config groups
`quick_slots` · `hud_editor` · `colors_glow` · `fps_unlock` · `brawlers` · `network` · `presence`

See `ui/menu_structure.md` for the complete registries, tabs, config tree and implementation runtimes.

> Extracted from `jirgear_main.qbc` (49 MB QuickJS bytecode, 2,891 functions). Engine: bellard/quickjs master opcode table with operand-relative label offsets (custom anti-disassembly trick).
