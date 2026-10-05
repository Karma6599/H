# JirGear "jirjs" QuickJS — opcode table refinements

## Summary

The engine is **bellard/quickjs master** (BC_VERSION 5) with exactly one serialization-level
customization that breaks stock tooling: **jump/label offsets are operand-relative**.

Everything else — opcode numbering, sizes, formats, the atom table, the reader layout —
matches stock `quickjs-opcode.h` / `quickjs-atom.h` from master. Verified by fully
parsing and validating `bytecode/main.qbc` (49,013,693 bytes, 2,891 functions,
604,224 instructions, 21,624 atoms) with **0 errors**: every instruction stream ends
exactly on `byte_code_len`, every atom index resolves, every jump lands on an
instruction boundary.

## The custom label encoding

```
# stock QuickJS (JS_CallInternal):
#   pc points at the operand (opcode already consumed)
CASE(OP_goto): {
    int32_t diff = get_i32(pc);
    pc += 4 + diff;          # → target = opcode_pos + 5 + diff  (END-relative)
}

# jirjs (JirGear):
#   target = opcode_pos + 1 + diff    (OPERAND-relative — no +4/+2/+1 skip)
```

| fmt | operand | stock target | jirjs target |
|---|---|---|---|
| `label` (goto, if_true/false, catch, for_of_start, …) | i32 @ pos+1 | pos + 5 + off | **pos + 1 + off** |
| `label_u16` (switch tables) | i32 @ pos+1, u16 @ pos+5 | pos + 5 + off | **pos + 1 + off** |
| `label16` (goto16, if_true16…) | i16 @ pos+1 | pos + 3 + off | **pos + 1 + off** |
| `label8` (goto8, if_false8…) | i8 @ pos+1 | pos + 2 + off | **pos + 1 + off** |

Impact: a stock disassembler mis-lands every jump by exactly the operand width
(4/2/1 bytes), which cascades — basic blocks, switch tables and exception handlers
decode as garbage. This is the "custom opcodes" illusion: the table itself is stock.

## Reader layout (what `tools/qjs_bc.py` implements)

```
u8      bc_version               # 5
uleb128 atom_count               # 21624 for main.qbc
repeat atom_count:
    uleb128 (len<<1 | is_wide) ; bytes(utf8/utf16le)

# then the object graph:
u8 tag                          # 1..19 (see architecture.md)
FUNCTION (12):
    u16  flags  (11 bit-fields, in order:
                has_prototype, has_simple_parameter_list,
                is_derived_class_constructor, need_home_object,
                func_kind:2, new_target_allowed, super_call_allowed,
                super_allowed, arguments_allowed, has_debug,
                is_direct_or_indirect_eval)
    u8   js_mode
    atom func_name
    uleb128 arg_count, var_count, defined_arg_count, stack_size,
            var_ref_count, closure_var_count, cpool_count,
            byte_code_len, local_count
    repeat local_count:
        atom name ; uleb128 scope_next-1 ; uleb128 var_ref_idx
        u8 (var_kind:4, is_const:1, is_lexical:1, is_captured:1, has_scope:1)
    repeat closure_var_count:
        atom name ; uleb128 var_idx
        u16 (closure_type:3, is_const:1, is_lexical:1, var_kind:4)
    raw[byte_code_len]
    if has_debug: atom filename ; uleb128 pc2line_len ; pc2line ;
                  uleb128 source_len ; source
    repeat cpool_count: <object>          # nested functions live here
atom = uleb128 v ; v&1 → tagged-int(v>>1) ; else idx=v>>1
        idx < 243 → stock atom ; else file_atom[idx-243]
```

`loc` / `arg` / `var_ref` operands are **u16** (3-byte instructions) — master style.
`const` / `atom` / `i32` / `u32` / `label` operands are u32 (5-byte instructions).

## Files

- `opcode_table.json` — the refined table (244 ops with size/stack/fmt + the customizations documented)
- `quickjs-opcode.h`, `quickjs-atom.h` — the stock headers it matches (bellard master)
