# JirGear — full reverse-engineering workspace

> Custom-QuickJS ("jirjs") Brawl Stars mod — deobfuscated bytecode, refined opcode/atom tables,
> full annotated disassembly, feature map and embedded native modules.

## What this is

Everything needed to read JirGear's protected scripts:

1. **`opcodes/`** — the refined opcode table + documentation of the engine's customizations
   (the bytecode format is bellard/quickjs master, BC_VERSION 5, **except jump offsets are
   operand-relative instead of end-relative** — that single change is what breaks every
   stock disassembler).
2. **`atoms/`** — the full atom tables (243 stock + 21,624 file atoms from main.qbc).
3. **`tools/`** — `qjs_bc.py`: a complete QuickJS-bytecode parser / validator / disassembler
   for the JirGear format. It validates 100% of the 49 MB `main.qbc` with 0 errors.
4. **`disasm/`** — the full annotated disassembly (2,891 functions, 604,224 instructions),
   gzipped.
5. **`features/`** — one file per feature (aimbot, autododge, killaura, autofarm, autospin,
   fpsunlock, camera, emotes/pins, quickslots, server region, HUD, colors/glow, brawlers,
   network) with entry points, key strings, constants and per-feature disassembly.
6. **`ui/`** — the reconstructed menu structure, all 285 UI strings, and the six embedded
   `.sc` menu assets extracted from the bytecode.
7. **`native/fragments/`** — the embedded Frida CModule **C sources** (obfuscated
   identifiers), including the 112 KB native core (dodge planner, worker threads).
8. **`bytecode/`** — the mod files themselves (`main.qbc` plaintext; loader/payload in
   their encrypted `JIRJS` containers).
9. **`analysis/`** — the APK/runtime architecture write-up.

## TL;DR of findings

- Engine = **bellard/quickjs master** (BC_VERSION 5) + operand-relative labels, running as a
  renamed gumjs inside a custom Frida gadget (`libg.so`) whose sections are decrypted at
  runtime from `ECC2` blobs by `libJir.so` (ChaCha20 + SHA-256; key material in
  `.jir_literal_key`).
- Scripts travel as `JIRJS` containers (AES-CTR + HMAC-SHA256, "JirGear embedded loader v3").
- Feature offsets are fetched at runtime from `https://jirgear.com/api/menu/offsets`
  (pinned to 212.22.82.57 / 213.136.70.93 and sslip.io aliases). Payments/avatars via
  Telegram bot `JirGearPayBot`.
- The mod is one 49 MB qbc: 2,891 functions, ~604 K instructions, all identifiers mangled
  (`fn_####`, `loc_####`, `capture_####`, `_$<hex>`), all constants as FLOAT64, all property
  access via cpool strings.
- Heavy logic (dodge planner) is a native **CModule** — actual C compiled at runtime.
- Menu = native registry + six base64-embedded Supercell `.sc` files written to
  `/data/data/com.supercell.brawlstars/files/jirgear/`.

## Quick start

```bash
# validate + stats
python3 tools/qjs_bc.py bytecode/main.qbc

# extract the atom table
python3 tools/parse_qbc.py bytecode/main.qbc

# regenerate the full disassembly
python3 tools/gen_disasm.py        # writes main_qbc.disasm

# read the opcode table + the customizations
$EDITOR opcodes/CUSTOMIZATIONS.md
```

## Repo layout

```
opcodes/      refined opcode table (JSON) + stock headers + CUSTOMIZATIONS.md
atoms/        atoms_main_qbc.json (21,624 atoms + 243 stock)
tools/        qjs_bc.py · parse_qbc.py · gen_disasm.py
disasm/       main_qbc.disasm.gz (604,224 instructions)
features/     one file per feature
ui/           menu_structure.md · menu_strings.md · sc_assets/*.sc
native/       fragments/*.c (embedded CModule sources)
bytecode/     main.qbc · loader.jirjs.encrypted · bytecode.bin.encrypted
analysis/     architecture.md
```
