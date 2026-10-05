# Presence System (presence)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

## Notes

Player presence panel (friends/online list UI) — rows, paging, events. Shares the network layer.

## Key strings / constants

- `presence`
- `presence:open`
- `presence:close`
- `presence:prev`
- `presence:next`
- `presence:body`
- `presence:row:`
- `Invalid presence response`

## Disassembly (entry)

_(no dedicated entry function — state lives in the shared config `fn_488` / visual runtime `fn_888`; see `ui/menu_structure.md`)_
