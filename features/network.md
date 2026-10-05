# Network Layer (API, profiles, telegram)

> Extracted from the JirGear QuickJS bytecode (`main.qbc`).

## Notes

Remote offset profile (ARM64 libg offsets) fetched from jirgear.com/api/menu/offsets at runtime; API origin regex-pinned; Telegram bot for payments/avatars; device binding (jir-device).

## Key strings / constants

- `https://jirgear.com`
- `https://jirgear.com/api/menu/offsets`
- `https://t.me/JirGearPayBot?start=avatar`
- `Invalid login response`
- `Invalid activation response`
- `Invalid verified profile`
- `Invalid network response`
- `Invalid presence response`
- `Invalid shared avatars response`
- `Invalid events response`
- `Offset profile authenticated`
- `Offset profile unavailable`
- `Incompatible offset profile`
- `Invalid trusted API origin`
- `jir-device`
- `POST`

## Disassembly (entry)

_(no dedicated entry function — state lives in the shared config `fn_488` / visual runtime `fn_888`; see `ui/menu_structure.md`)_
