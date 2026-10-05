# Reconstruction notes — how these files were produced

Every reconstructed `.js` file in this folder is derived **exclusively** from
`jirgear_main.qbc` (the 49 MB QuickJS bytecode blob shipped inside the mod),
parsed with our own validator/disassembler (bellard/quickjs-master opcode
table + the two JirGear format customizations below). No third-party code was
consulted.

## Bytecode format discoveries (required to read the module at all)

1. **Opcode atom operands are fixed-width 4-byte raw indexes** — unlike stock
   QuickJS which stores them as uleb128 `(idx << 1) | tag`. The stream atoms
   (function/local/closure names) DO use the stock tagged uleb. This hybrid
   is why stock tools misparse every property access.
2. **Jump label offsets are operand-relative** (`target = opcode_pos + 1 +
   stored`), not instruction-end-relative like stock QuickJS.
3. Local variable names survive only as obfuscated `loc_N/arg_N/call_arg_*`;
   module-scope imports survive as `native_import_N`; property/API names are
   26-hex hashes (`_$...`) which are the actual runtime contract.

## Reconstruction workflow (per feature)

1. Locate the feature's factory function (e.g. `fn_2070` for autospin) from
   the toggle registry / menu dispatcher references.
2. Resolve every closure variable (`get_var N`) through the scope chain to
   its terminal (factory state local / module import / global) — this recovers
   the full state layout even though names are obfuscated.
3. Read every function in the closure subtree instruction by instruction,
   reverting the per-function opaque predicate
   (`((x & 65535) * ((x & 65535) + 1) & 1) !== 0` — always false) and the
   dead XOR/OR mixing blocks.
4. Name state/functions from their verified behavior (read/write sites, the
   strings they compare, the natives they bind), keep hash keys verbatim.

## Verified against the bytecode

Each file lists the fn_* ↔ function mapping and the state local indexes in
its header comment. Spot-check any claim against
`work/spin/resolved/*.dis` (annotated disassembly) if in doubt.

## Status

- `autospin.js` — COMPLETE, line-by-line verified (all 17 functions).
