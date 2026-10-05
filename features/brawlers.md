# Brawler Database & Ban Lists

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

**UI label:** `BRAWLERS`

## Notes

Per-brawler settings + dodge ban-list picker (brawler name canon from utils/brawlerName). "USE GLOBAL SETTINGS" per-brawler override switch.

## Key strings / constants

- `BRAWLERS`
- `ANY ELIGIBLE BRAWLER`
- `AUTO DODGE — BAN LIST`
- `LOADING BRAWLERS…`
- `selectedBrawlers`
- `ignoredBrawlerIds`
- `byBrawler`
- `Waiting for brawler`
- `Scroll and choose one or more brawlers`
- `Brawler identity`
- `USE GLOBAL SETTINGS`

## Disassembly (entry)

_(no dedicated entry function — state lives in the shared config `fn_488` / visual runtime `fn_888`; see `ui/menu_structure.md`)_
