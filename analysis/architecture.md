# JirGear Architecture (reverse-engineered)

## Overview

```
┌────────────────────────────────────────────────────────────────────┐
│ JirGear.apk (1,857,084,873 B, Flutter shell + Brawl Stars assets) │
└────────────────────────────────────────────────────────────────────┘
   │
   ├─ lib/arm64-v8a/libJir.so (13.9 MB)          ← the GUARD/RASP library
   │    ├─ jir_guard   (1.7 MB code)             ← 12 anti-tamper checks (offsets below)
   │    ├─ jir_archive (128 KB code)            ← ChaCha20+SHA-256 decryptor
   │    └─ .jir_literal_key (80 B)               ← key material (2 doubles + 16B key + …)
   │
   ├─ lib/arm64-v8a/libg.so (20.2 MB)            ← CUSTOM Frida gadget (gumjs renamed "jirjs")
   │    └─ stripped to segments; sections replaced at runtime by .ecc blobs ↓
   │
   ├─ assets/arm64-v8a/libg.so.{rodata,text,eh_frame,eh_frame_hdr,
   │                              note.gnu.build-id}.ecc              ← ECC2-encrypted sections
   │    .text: 0x4f7b00 (5,208,832 B)  .rodata: 0x191470 (1,046,564 B)
   │    → decrypted into memory over the shipped libg.so
   │
   ├─ assets/kogcpfofggee.dat (1.58 MB, "lbts" magic) ← encrypted payload (engine/scripts)
   │
   └─ [server] https://jirgear.com/api/menu/offsets ← runtime offset profile
        pinned origins: 212.22.82.57 / 213.136.70.93 (+ sslip.io aliases)
```

## Runtime chain

1. App starts → `libJir.so` loads (init_array constructors)
2. `jir_archive` (ChaCha20 + SHA-256, key material from `.jir_literal_key`) decrypts the `ECC2` blobs
3. Decrypted sections are mapped over `libg.so` (the custom Frida gadget, "jirjs" = renamed gumjs, embedding a modified **QuickJS**)
4. The loader script (`loader.jirjs`, "JIRJS" container: `AES-CTR` + `HMAC-SHA256`, "JirGear embedded loader v3") runs
5. Loader evaluates `main.qbc` — the mod itself, compiled QuickJS bytecode (49 MB, 2,891 functions)
6. Menu UI renders via a native CModule registry, using base64-embedded `.sc` assets written to `/data/data/com.supercell.brawlstars/files/jirgear/`

## The custom QuickJS ("jirjs") — what makes it custom

Base: **bellard/quickjs master** (BC_VERSION = 5). Verified empirically over the whole 49 MB bytecode with **zero** validation errors:

| Aspect | Value |
|---|---|
| BC_VERSION | 5 |
| header | `u8 version` + `uleb128 atom_count` + atom strings (`uleb128 (len<<1)\|wide` + bytes) |
| first_atom (JS_ATOM_END) | 243 (NULL + 242 atom.h DEFs — master has no symbol/module extras) |
| tags | NULL=1, UNDEFINED=2, BOOL_F=3, BOOL_T=4, INT32=5, FLOAT64=6, STRING=7, OBJECT=8, ARRAY=9, BIG_INT=10, TEMPLATE=11, **FUNCTION=12, MODULE=13**, TYPED_ARRAY=14, ARRAY_BUFFER=15, SAB=16, DATE=17, OBJECT_VALUE=18, OBJECT_REFERENCE=19 |
| function header | `u16 flags` (has_prototype, has_simple_parameter_list, is_derived_class_constructor, need_home_object, func_kind:2, new_target_allowed, super_call_allowed, super_allowed, arguments_allowed, has_debug, is_direct_or_indirect_eval) + `u8 js_mode` + `atom func_name` + 9× `uleb128` counts |
| locals | `atom name` + `uleb scope_next(-1)` + `uleb var_ref_idx` + `u8 kind flags` |
| opcode table | **100 % stock bellard master** (244 opcodes; max byte seen in main.qbc = 0xf0) |

### The one (crucial) customization — label encoding

```
stock QuickJS :  jump_target = instruction_end + stored_offset   (end-relative)
jirjs        :  jump_target = opcode_pos + 1 + stored_offset     (OPERAND-relative!)
```

Every `goto`, `if_true/false`, `catch`, `for_of_start`, `label_u16` (switch) stores its offset relative to the **address of the operand itself** instead of the end of the instruction. This silently breaks every stock QuickJS disassembler/decompiler (they mis-land every jump by 4/2/1 bytes, cascading into garbage) while changing nothing for the engine itself. See `opcodes/CUSTOMIZATIONS.md`.

Other obfuscation properties of the shipped bytecode:
- all numeric constants emitted as **FLOAT64** cpool entries (zero INT32 tags)
- all identifiers mangled (`fn_####`, `loc_####`, `capture_####`, `array_####`, `object_####`, `_$<24-hex>`)
- property access via cpool strings (not atoms) wherever the obfuscator touched
- no debug info (`has_debug = 0` everywhere, no filenames/pc2line/source)

## Encryption layers

| Layer | Format | Crypto |
|---|---|---|
| Section patches | `ECC2` magic + `u64 section_offset` + `u64 size` + fields + payload | ChaCha20 (constant `expand 32-byte k` in libJir.so) + SHA-256 |
| Mod scripts | `JIRJS` magic + version/lengths + `1e000000` field + 16B | AES-CTR + HMAC-SHA256 ("JirGear embedded loader v3") |
| kogcpfofggee.dat | `lbts` magic + u32 16 + u32 1264 + encrypted body | (same loader) |
| main.qbc | plaintext QuickJS bytecode (once the loader decrypts) | — |

## RASP / anti-tamper (libJir.so `jir_guard`)

The 12 checks neutralized by the loader (Frida `Interceptor.replace` on `libJir.so` base):
`0x753A9C immutable_region`, `0x7538E0 memory_image` (the crasher), `0x75B188 server_access`, `0x74E964 exec_mapping`, `0x75407C code_guard`, `0x75651C library_file`, `0x7568C0 signed_apk`, `0x755824 apk_identity`, `0x751608 debugger`, `0x754E2C agent_entry`, `0x754FCC java_debugger`, plus one more returning a constant.
Integrity manifest at `assets/jir/integrity.bin` (SignatureGuard / IntegrityHasher classes).

## Server-side

- Activation/offsets: `https://jirgear.com/api/menu/offsets` ("This offset profile requires ARM64 libg" → offset profile = the memory offsets used by the features)
- Payments/avatars: `https://t.me/JirGearPayBot?start=avatar` (Telegram bot; `fetchAvatar`)
- API origin pinning: regex `^https:\/\/(?:212(?:\.22\.82\.57|-22-82-57\.sslip\.io)|213(?:\.136\.70\.93|-136-70-93\.sslip\.io))(?::443)?$` + a generic `^https:\/\/[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::([0-9]{1,5}))?$`

## Files

- `bytecode/main.qbc` — the mod (plaintext bytecode, recovered)
- `bytecode/loader.jirjs.encrypted` — the loader (JIRJS container)
- `bytecode/bytecode.bin.encrypted` — server payload (JIRJS container)
- `disasm/main_qbc.disasm.gz` — full annotated disassembly (604,224 instructions)
- `native/fragments/*.c` — embedded CModule C sources (obfuscated identifiers; `fn_2289.c` = 112 KB native core incl. the dodge planner, worker thread with pthreads/mutexes, file IO)
