# Full disassembly of main.qbc

`main_qbc.disasm.gz` — gzip -9 of the annotated disassembly:
- 2,891 functions, 604,224 instructions, 624,459 lines (197 MB raw)
- format: `=== FUNCTION <name> [idx] parent=... ===` header (flags, counts, locals, closures, cpool summary)
  followed by `offset  opcode  operands` lines
- jumps annotated `-> <target>` using the jirjs operand-relative rule (see opcodes/CUSTOMIZATIONS.md)
- constants annotated inline: `[cpool_idx] str '...'` / `[i] num ...` / `[i] fn <name>`
- atoms annotated `@'name'` (file atoms) / `@stock[name]`

Regenerate with: `python3 tools/gen_disasm.py` (after pointing it at your paths)
