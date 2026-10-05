# Anti-AFK (anti_afk)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `ANTI_AFK`

Menu toggle registry index: **14**

## Notes

Anti-idle: prevents AFK kicks by simulating activity. Registry index 14 (13 is a removed slot).

## Key strings / constants

- `anti_afk`
- `ANTI_AFK`
- `idle`

## Disassembly (entry)

_(no dedicated entry function — state lives in the shared config `fn_488` / visual runtime `fn_888`; see `ui/menu_structure.md`)_
