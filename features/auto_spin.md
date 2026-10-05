# Auto Spin (auto_spin / spin)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `AUTO SPIN`

Menu toggle registry index: **6**

## Notes

Auto spin the brawler. Needs a game-thread scheduler. SPIN SPEED slider = config spin.speed (cycles/sec).

## Key strings / constants

- `auto_spin`
- `spin`
- `spinSpeed`
- `AUTO SPIN`
- `SPIN SPEED`
- `CYCLE / SEC`
- `Auto Spin disposed`
- `Auto Spin module is unavailable`
- `Auto Spin requires a game-thread scheduler`
- `Could not start Auto Spin`
- `Auto Spin settings rejected`

## Disassembly (entry)

_(no dedicated entry function — state lives in the shared config `fn_488` / visual runtime `fn_888`; see `ui/menu_structure.md`)_
