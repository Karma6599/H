#!/usr/bin/env python3
"""Generate full annotated disassembly of JirGear main.qbc + feature analysis."""
import sys, json, struct
sys.path.insert(0, '/home/z/my-project/scripts')
from qjs_bc import OpcodeTable, parse_atoms_header, BCReader

data = open('/home/z/my-project/work/jirgear_main.qbc', 'rb').read()
ops = OpcodeTable('/home/z/my-project/work/opcodes/bellard_quickjs_master.h')
stock = parse_atoms_header('/home/z/my-project/work/opcodes/bellard_quickjs-atom.h')
r = BCReader(data, [], stock, 243, ops)
r.u8(); count = r.uleb()
r.atoms = [r.read_string() for _ in range(count)]
obj = r.read_object()

# Collect functions with hierarchy
funcs = []
def collect(o, parent=None):
    if isinstance(o, tuple) and o and o[0] == 'function':
        f = dict(o[1])
        f['_parent'] = parent
        f['_idx'] = len(funcs)
        funcs.append(f)
        for c in o[1].get('cpool', []):
            collect(c, f['_idx'])
    elif isinstance(o, tuple) and o and o[0] in ('object',):
        for _, v in o[1]:
            collect(v, parent)
    elif isinstance(o, tuple) and o and o[0] in ('array',):
        for v in o[1]:
            collect(v, parent)
collect(obj)

print(f"functions: {len(funcs)}", file=sys.stderr)

def atom_of(v):
    # v already a resolved string from atom_str
    return v

def cpool_summary(f):
    out = []
    for c in f.get('cpool', []):
        if isinstance(c, tuple):
            if c[0] == 'string':
                s = c[1]
                if len(s) > 60: s = s[:57] + '...'
                out.append(f'str {s!r}')
            elif c[0] == 'float64':
                out.append(f'num {c[1]!r}')
            elif c[0] == 'function':
                out.append(f"fn <{c[1].get('func_name')}>")
            elif c[0] == 'undefined':
                out.append('undefined')
            elif c[0] == 'bool':
                out.append(f'bool {c[1]}')
            else:
                out.append(c[0])
        else:
            out.append(repr(c))
    return out

lines = []
instr_total = 0
for f in funcs:
    bc = f['bytecode']
    name = f['func_name']
    parent = f"_parent:{funcs[f['_parent']]['func_name']}" if f['_parent'] is not None else "root"
    lines.append('')
    lines.append(f"=== FUNCTION {name} [#{f['_idx']}] parent={parent} ===")
    lines.append(f"  flags: proto={f['has_prototype']} simple_params={f['has_simple_parameter_list']} "
                 f"derived={f['is_derived_class_constructor']} home={f['need_home_object']} "
                 f"kind={f['func_kind']} js_mode={f.get('js_mode')}")
    lines.append(f"  args={f['arg_count']} vars={f['var_count']} defined_args={f['defined_arg_count']} "
                 f"stack={f['stack_size']} var_refs={f['var_ref_count']} closures={f['closure_var_count']} "
                 f"cpool={f['cpool_count']} bclen={len(bc)}")
    if f['locals']:
        ls = ', '.join(f"{l['name']}(:{l['scope_next']}/vr:{l['var_ref_idx']}/k:{l['var_kind']}{';c' if l['is_const'] else ''}{';x' if l['is_captured'] else ''})" for l in f['locals'])
        lines.append(f"  locals: {ls}")
    if f['closure_vars']:
        cs = ', '.join(f"{c['name']}({c['var_idx']}/t:{c['closure_type']})" for c in f['closure_vars'])
        lines.append(f"  closures: {cs}")
    cp = cpool_summary(f)
    if cp:
        lines.append(f"  cpool: " + ' | '.join(x[:80] for x in cp[:40]) + (' ...' if len(cp) > 40 else ''))
    # disassemble
    p = 0
    instrs = []
    while p < len(bc):
        op = bc[p]
        if op >= ops.count:
            instrs.append((p, f'OP_0x{op:02x}_INVALID', ''))
            p += 1
            continue
        o = ops.ops[op]
        arg = ''
        try:
            if o.fmt in ('atom',) or o.fmt.startswith('atom_'):
                v = struct.unpack_from('<I', bc, p + 1)[0]
                if v & 1:
                    arg = f'#{v >> 1}'
                else:
                    i = v >> 1
                    if i < 243:
                        arg = f'@stock[{stock[i]}]'
                    else:
                        i -= 243
                        arg = f'@{r.atoms[i]!r}' if i < len(r.atoms) else f'@ATOM_OOB_{i}'
                if o.fmt == 'atom_u8':
                    arg += f', u8={bc[p+5]}'
                elif o.fmt == 'atom_u16':
                    arg += f', u16={struct.unpack_from("<H", bc, p+5)[0]}'
                elif o.fmt == 'atom_label_u8':
                    off = struct.unpack_from('<b', bc, p + 5)[0]
                    arg += f', -> {p + 6 + off}'
                elif o.fmt == 'atom_label_u16':
                    off = struct.unpack_from('<h', bc, p + 5)[0]
                    arg += f', -> {p + 6 + off}'
            elif o.fmt == 'label':
                off = struct.unpack_from('<i', bc, p + 1)[0]
                arg = f'-> {p + 1 + off}'
            elif o.fmt in ('label8',):
                off = struct.unpack_from('<b', bc, p + 1)[0]
                arg = f'-> {p + 1 + off}'
            elif o.fmt in ('label16',):
                off = struct.unpack_from('<h', bc, p + 1)[0]
                arg = f'-> {p + 1 + off}'
            elif o.fmt == 'label_u16':
                off = struct.unpack_from('<i', bc, p + 1)[0]
                arg = f'-> {p + 1 + off}, u16={struct.unpack_from("<H", bc, p+5)[0]}'
            elif o.fmt in ('loc', 'arg', 'var_ref'):
                arg = str(struct.unpack_from('<H', bc, p + 1)[0])
            elif o.fmt in ('const',):
                ci = struct.unpack_from('<I', bc, p + 1)[0]
                cp_ent = f.get('cpool', [])[ci] if ci < len(f.get('cpool', [])) else None
                if isinstance(cp_ent, tuple):
                    if cp_ent[0] == 'string':
                        s = cp_ent[1]
                        if len(s) > 50: s = s[:47] + '...'
                        arg = f'[{ci}] str {s!r}'
                    elif cp_ent[0] == 'float64':
                        arg = f'[{ci}] num {cp_ent[1]!r}'
                    elif cp_ent[0] == 'function':
                        arg = f'[{ci}] fn <{cp_ent[1].get("func_name")}>'
                    else:
                        arg = f'[{ci}] {cp_ent[0]}'
                else:
                    arg = f'[{ci}]'
            elif o.fmt in ('i32',):
                arg = str(struct.unpack_from('<i', bc, p + 1)[0])
            elif o.fmt == 'u32':
                arg = str(struct.unpack_from('<I', bc, p + 1)[0])
            elif o.fmt in ('u8', 'loc8', 'const8', 'npopx'):
                if o.fmt == 'const8':
                    ci = bc[p + 1]
                    cp_ent = f.get('cpool', [])[ci] if ci < len(f.get('cpool', [])) else None
                    arg = f'[{ci}] ' + (repr(cp_ent[1])[:40] if isinstance(cp_ent, tuple) and len(cp_ent) > 1 else '?')
                else:
                    arg = str(bc[p + 1])
            elif o.fmt in ('i8',):
                arg = str(struct.unpack_from('<b', bc, p + 1)[0])
            elif o.fmt in ('u16', 'npop', 'npop_u16', 'i16'):
                if o.fmt == 'i16':
                    arg = str(struct.unpack_from('<h', bc, p + 1)[0])
                else:
                    arg = str(struct.unpack_from('<H', bc, p + 1)[0])
        except Exception as e:
            arg = f'?? {e}'
        instrs.append((p, o.name, arg))
        instr_total += 1
        p += o.size
    for off, nm, ar in instrs:
        lines.append(f'  {off:6d}  {nm:26s} {ar}')

out = '\n'.join(lines)
open('/home/z/my-project/work/main_qbc.disasm', 'w').write(out)
print(f"disasm written: {instr_total:,} instructions, {len(out):,} chars, {len(lines):,} lines", file=sys.stderr)

# feature atom usage map
feature_atoms = ['aim_bot', 'auto_dodge', 'hold_to_shoot', 'killaura', 'fpsUnlock', 'fps', 'aim', 'dodge', 'spin', 'camera',
                 'speed', 'emoteSpeed', 'spinSpeed', 'usePins', 'dodgeWhenCarrying', 'dodgeWhenStanding']
usage = {a: [] for a in feature_atoms}
for f in funcs:
    bc = f['bytecode']
    p = 0
    while p < len(bc):
        op = bc[p]
        if op >= ops.count:
            p += 1; continue
        o = ops.ops[op]
        if o.fmt == 'atom' or o.fmt.startswith('atom_'):
            v = struct.unpack_from('<I', bc, p + 1)[0]
            if not (v & 1):
                i = (v >> 1) - 243
                if 0 <= i < len(r.atoms):
                    s = r.atoms[i]
                    if s in usage:
                        usage[s].append(f['func_name'])
        p += o.size
print("\nfeature atom usage:", file=sys.stderr)
json.dump(usage, open('/home/z/my-project/work/feature_usage.json', 'w'), indent=1)
for a, fs in usage.items():
    print(f"  {a}: {len(fs)} refs in {len(set(fs))} fns: {sorted(set(fs))[:12]}", file=sys.stderr)
